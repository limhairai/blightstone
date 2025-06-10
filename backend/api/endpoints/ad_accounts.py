from fastapi import APIRouter, HTTPException, Query, Depends
# from core.firebase import get_firestore  # TODO: Migrate to Supabase
from services.facebook import FacebookAPI
from datetime import datetime
import os
import requests  # Add this import for the test endpoint
import time
from core.security import get_current_user
from schemas.user import UserRead as User
from typing import List
from services.audit_log_service import log_audit_event
from collections import defaultdict
import logging

router = APIRouter()

HOST_BM_ID = os.getenv("HOST_BM_ID")  # Set this in your .env

# Pool limits by plan
POOL_LIMITS = {
    "Bronze": 1,
    "Silver": 3,
    "Gold": 5,
    "Platinum": 10,
    "Diamond": 10,
}

# In-memory rate limit tracker (replace with Redis for production)
RATE_LIMIT_WINDOW = 3600  # 1 hour
RATE_LIMIT_MAX = 3
rate_limit_tracker = defaultdict(list)

logger = logging.getLogger("adhub_app")

# --- 1. Inventory: List all ad accounts (admin only) ---
@router.get("/inventory")
async def list_inventory():
    db = get_firestore()
    docs = db.collection("adAccounts").stream()
    return {"adAccounts": [doc.to_dict() for doc in docs]}

# --- 2. Assign ad account to client (with BM ID) ---
@router.post("/assign")
async def assign_ad_account(ad_account_id: str, client_uid: str, client_bm_id: str, fb_user_id: str):
    try:
        db = get_firestore()
        # --- Rate limiting ---
        now = time.time()
        key = f"assign:{client_uid}"
        timestamps = rate_limit_tracker[key]
        # Remove timestamps outside window
        rate_limit_tracker[key] = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
        if len(rate_limit_tracker[key]) >= RATE_LIMIT_MAX:
            raise HTTPException(status_code=429, detail="Too many ad account assignments. Please try again later.")
        rate_limit_tracker[key].append(now)

        # --- Pool limit enforcement ---
        # Find user's org and plan
        org_user_docs = db.collection("organization_users").where("userId", "==", client_uid).stream()
        org_id = None
        for doc in org_user_docs:
            org_id = doc.to_dict().get("orgId")
            break
        if not org_id:
            raise HTTPException(status_code=400, detail="Organization not found for user.")
        org_doc = db.collection("organizations").document(org_id).get()
        if not org_doc.exists:
            raise HTTPException(status_code=400, detail="Organization not found.")
        plan = org_doc.to_dict().get("plan", "Bronze")
        pool_limit = POOL_LIMITS.get(plan, 1)
        # Count assigned accounts for this org
        assigned_accounts = db.collection("adAccounts").where("orgId", "==", org_id).where("status", "==", "assigned").stream()
        assigned_count = sum(1 for _ in assigned_accounts)
        if assigned_count >= pool_limit:
            raise HTTPException(status_code=403, detail=f"Account pool limit reached for your plan ({plan}). Please upgrade to add more accounts.")

        doc_ref = db.collection("adAccounts").document(ad_account_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Ad account not found")
        data = doc.to_dict()
        if data.get("clientUid"):
            raise HTTPException(status_code=400, detail="Ad account already assigned")
        # Share ad account with client BM via Facebook API
        fb_api = FacebookAPI()
        fb_api.share_ad_account_with_bm(HOST_BM_ID, client_bm_id, ad_account_id)
        # Assign user as ADVERTISER
        fb_api.assign_user_to_ad_account(ad_account_id, fb_user_id, role="ADVERTISER")
        # Update Firestore
        doc_ref.update({
            "clientUid": client_uid,
            "clientBmId": client_bm_id,
            "sharedWith": {client_uid: "ADVERTISER"},
            "status": "assigned",
            "assignedAt": datetime.utcnow().isoformat()
        })
        db.collection("auditLogs").add({
            "action": "assign",
            "adAccountId": ad_account_id,
            "clientUid": client_uid,
            "clientBmId": client_bm_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        logger.info(f"Assigned ad account {ad_account_id} to client {client_uid} (BM {client_bm_id})")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error assigning ad account {ad_account_id}: {e}")
        raise

# --- 3. Change client BM ---
@router.post("/change-bm")
async def change_client_bm(ad_account_id: str, old_bm_id: str, new_bm_id: str, client_uid: str, fb_user_id: str):
    try:
        db = get_firestore()
        doc_ref = db.collection("adAccounts").document(ad_account_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Ad account not found")
        data = doc.to_dict()
        if data.get("clientBmId") != old_bm_id:
            raise HTTPException(status_code=400, detail="Old BM does not match current assignment")
        fb_api = FacebookAPI()
        fb_api.remove_ad_account_from_bm(HOST_BM_ID, old_bm_id, ad_account_id)
        fb_api.share_ad_account_with_bm(HOST_BM_ID, new_bm_id, ad_account_id)
        fb_api.assign_user_to_ad_account(ad_account_id, fb_user_id, role="ADVERTISER")
        doc_ref.update({
            "clientBmId": new_bm_id,
            "sharedWith": {client_uid: "ADVERTISER"},
            "bmChangedAt": datetime.utcnow().isoformat()
        })
        db.collection("auditLogs").add({
            "action": "change_bm",
            "adAccountId": ad_account_id,
            "oldBmId": old_bm_id,
            "newBmId": new_bm_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        logger.info(f"Changed BM for ad account {ad_account_id} from {old_bm_id} to {new_bm_id}")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error changing BM for ad account {ad_account_id}: {e}")
        raise

# --- 4. Reclaim ad account (return to inventory) ---
@router.post("/reclaim")
async def reclaim_ad_account(ad_account_id: str):
    try:
        db = get_firestore()
        doc_ref = db.collection("adAccounts").document(ad_account_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Ad account not found")
        data = doc.to_dict()
        # Remove from client BM via Facebook API
        if data.get("clientBmId"):
            fb_api = FacebookAPI()
            fb_api.remove_ad_account_from_bm(HOST_BM_ID, data["clientBmId"], ad_account_id)
        doc_ref.update({
            "clientUid": None,
            "clientBmId": None,
            "sharedWith": {},
            "status": "available",
            "reclaimedAt": datetime.utcnow().isoformat()
        })
        db.collection("auditLogs").add({
            "action": "reclaim",
            "adAccountId": ad_account_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        logger.info(f"Reclaimed ad account {ad_account_id}")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error reclaiming ad account {ad_account_id}: {e}")
        raise

# --- 5. Allocate funds & set spend cap ---
@router.post("/allocate")
async def allocate_funds(ad_account_id: str, client_uid: str, amount: float):
    try:
        db = get_firestore()
        doc_ref = db.collection("adAccounts").document(ad_account_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Ad account not found")
        data = doc.to_dict()
        # Update allocation
        allocations = data.get("allocations", {})
        allocations[client_uid] = amount
        # Set spend cap via Facebook API (in cents)
        fb_api = FacebookAPI()
        fb_api.set_spend_cap(ad_account_id, int(amount * 100))
        doc_ref.update({
            "allocations": allocations,
            "spendCap": amount,
            "allocationUpdatedAt": datetime.utcnow().isoformat()
        })
        db.collection("auditLogs").add({
            "action": "allocate",
            "adAccountId": ad_account_id,
            "clientUid": client_uid,
            "amount": amount,
            "timestamp": datetime.utcnow().isoformat()
        })
        logger.info(f"Allocated {amount} to ad account {ad_account_id} for client {client_uid}")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error allocating funds to ad account {ad_account_id}: {e}")
        raise

# --- 6. Set spend cap directly ---
@router.post("/{ad_account_id}/spend-cap")
async def set_spend_cap(ad_account_id: str, amount: float):
    fb_api = FacebookAPI()
    fb_api.set_spend_cap(ad_account_id, int(amount * 100))
    db = get_firestore()
    doc_ref = db.collection("adAccounts").document(ad_account_id)
    doc_ref.update({
        "spendCap": amount,
        "spendCapUpdatedAt": datetime.utcnow().isoformat()
    })
    return {"status": "success"}

# --- 7. Pause ad account (SpendGuard) ---
@router.post("/{ad_account_id}/pause")
async def pause_ad_account(ad_account_id: str):
    try:
        fb_api = FacebookAPI()
        fb_api.set_spend_cap(ad_account_id, 100)  # $1 in cents
        db = get_firestore()
        doc_ref = db.collection("adAccounts").document(ad_account_id)
        doc_ref.update({
            "spendCap": 1,
            "pausedAt": datetime.utcnow().isoformat()
        })
        db.collection("auditLogs").add({
            "action": "pause",
            "adAccountId": ad_account_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        logger.info(f"Paused ad account {ad_account_id}")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error pausing ad account {ad_account_id}: {e}")
        raise

# --- 8. Resume ad account (restore spend cap) ---
@router.post("/{ad_account_id}/resume")
async def resume_ad_account(ad_account_id: str, client_uid: str):
    try:
        db = get_firestore()
        doc_ref = db.collection("adAccounts").document(ad_account_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Ad account not found")
        data = doc.to_dict()
        allocation = data.get("allocations", {}).get(client_uid)
        if not allocation:
            raise HTTPException(status_code=400, detail="No allocation found for client")
        fb_api = FacebookAPI()
        fb_api.set_spend_cap(ad_account_id, int(allocation * 100))
        doc_ref.update({
            "spendCap": allocation,
            "resumedAt": datetime.utcnow().isoformat()
        })
        db.collection("auditLogs").add({
            "action": "resume",
            "adAccountId": ad_account_id,
            "clientUid": client_uid,
            "timestamp": datetime.utcnow().isoformat()
        })
        logger.info(f"Resumed ad account {ad_account_id} for client {client_uid}")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error resuming ad account {ad_account_id}: {e}")
        raise

# --- 9. Get spend/cap ---
@router.get("/{ad_account_id}/spend")
async def get_spend(ad_account_id: str):
    fb_api = FacebookAPI()
    details = fb_api.get_ad_account_details(ad_account_id)
    return {
        "amount_spent": details.get("amount_spent"),
        "spend_cap": details.get("spend_cap"),
        "balance": details.get("balance")
    }

# --- 10. Sync spend (stub for cron/automation) ---
@router.post("/sync-spend")
async def sync_spend():
    # TODO: Loop through all ad accounts, fetch spend, update Firestore, adjust allocations
    return {"status": "not_implemented"}

# --- 11. Audit log (admin only) ---
@router.get("/audit-log")
async def get_audit_log():
    db = get_firestore()
    docs = db.collection("auditLogs").order_by("timestamp", direction="DESCENDING").limit(100).stream()
    return {"logs": [doc.to_dict() for doc in docs]}

# --- 12. Sync ad account inventory from Facebook to Firestore ---
@router.post("/sync-inventory")
def sync_inventory():
    db = get_firestore()
    fb_api = FacebookAPI()
    try:
        # Fetch all ad accounts with business field
        url = f"https://graph.facebook.com/v19.0/me/adaccounts"
        params = {
            "fields": "account_id,name,business",
            "access_token": fb_api.access_token
        }
        response = requests.get(url, params=params, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"})
        response.raise_for_status()
        fb_accounts = response.json().get("data", [])
    except Exception as e:
        raise
    # Sync all accounts (no business.id filter)
    filtered_accounts = fb_accounts
    fb_account_ids = set(acc["account_id"] for acc in filtered_accounts)
    firestore_docs = list(db.collection("adAccounts").stream())
    # Update or add accounts from Facebook
    added, updated = 0, 0
    for acc in filtered_accounts:
        acc_id = acc["account_id"]
        doc_ref = db.collection("adAccounts").document(acc_id)
        doc = doc_ref.get()
        fb_data = {
            "fbAccountId": acc_id,
            "name": acc.get("name"),
            "status": "available",
            "syncedAt": datetime.utcnow().isoformat()
        }
        if doc.exists:
            local_data = doc.to_dict()
            local_data.update(fb_data)
            doc_ref.set(local_data)
            updated += 1
        else:
            doc_ref.set(fb_data)
            added += 1
    # Delete accounts no longer present in Facebook
    removed = 0
    for doc in firestore_docs:
        if doc.id not in fb_account_ids:
            doc.reference.delete()
            removed += 1
    return {"added": added, "updated": updated, "removed": removed, "total": len(filtered_accounts)}

@router.get("", status_code=200)
@router.get("/", status_code=200)
async def list_ad_accounts(orgId: str = Query(...), current_user: User = Depends(get_current_user)):
    db = get_firestore()
    # Find all ad accounts linked to this org
    docs = db.collection("adAccounts").where("orgId", "==", orgId).stream()
    ad_accounts = [doc.to_dict() | {"id": doc.id} for doc in docs]
    return {"adAccounts": ad_accounts}

# --- Archive ad account ---
@router.post("/archive")
async def archive_ad_account(ad_account_id: str, current_user: User = Depends(get_current_user)):
    try:
        db = get_firestore()
        ad_ref = db.collection("adAccounts").document(ad_account_id)
        ad_doc = ad_ref.get()
        if not ad_doc.exists:
            raise HTTPException(status_code=404, detail="Ad account not found")
        ad_data = ad_doc.to_dict()
        bal = ad_data.get("balance", 0.0)
        # Move balance to main wallet
        user_ref = db.collection("users").document(ad_data.get("clientUid"))
        user_doc = user_ref.get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            new_balance = user_data.get("mainBalance", 0.0) + bal
            user_ref.update({"mainBalance": new_balance})
        # Reset spend cap and mark as archived
        fb_api = FacebookAPI()
        fb_api.set_spend_cap(ad_account_id, 100)  # $1
        ad_ref.update({
            "balance": 0.0,
            "spendCap": 1,
            "archived": True,
            "archivedAt": datetime.utcnow().isoformat(),
            "status": "archived"
        })
        db.collection("transactions").add({
            "userId": ad_data.get("clientUid"),
            "type": "archive",
            "amount": bal,
            "from": ad_account_id,
            "to": "mainWallet",
            "timestamp": datetime.utcnow().isoformat()
        })
        log_audit_event(
            user_id=current_user.id,
            org_id=ad_data.get("orgId"),
            action="archive_ad_account",
            before_state={"ad_account_id": ad_account_id, "status": "active"},
            after_state={"ad_account_id": ad_account_id, "status": "archived"},
            ip=None,
            details=None,
        )
        logger.info(f"Archived ad account {ad_account_id}")
        return {"archived": True}
    except Exception as e:
        logger.error(f"Error archiving ad account {ad_account_id}: {e}")
        raise

# --- Add/Edit tags for ad account ---
@router.post("/tags")
async def set_ad_account_tags(ad_account_id: str, tags: List[str], current_user: User = Depends(get_current_user)):
    db = get_firestore()
    ad_ref = db.collection("adAccounts").document(ad_account_id)
    ad_doc = ad_ref.get()
    if not ad_doc.exists:
        raise HTTPException(status_code=404, detail="Ad account not found")
    ad_ref.update({"tags": tags, "tagsUpdatedAt": datetime.utcnow().isoformat()})
    log_audit_event(
        user_id=current_user.id,
        org_id=ad_data.get("orgId"),
        action="tag_ad_account",
        before_state=None,
        after_state={"ad_account_id": ad_account_id, "tags": tags},
        ip=None,
        details=None,
    )
    return {"tags": tags}

# --- Sync ad account status from Facebook ---
@router.post("/sync-status")
async def sync_ad_account_status(ad_account_id: str):
    db = get_firestore()
    ad_ref = db.collection("adAccounts").document(ad_account_id)
    ad_doc = ad_ref.get()
    if not ad_doc.exists:
        raise HTTPException(status_code=404, detail="Ad account not found")
    fb_api = FacebookAPI()
    details = fb_api.get_ad_account_details(ad_account_id)
    status = details.get("status", "unknown")
    spend_cap = details.get("spend_cap")
    ad_ref.update({
        "status": status,
        "spendCap": spend_cap,
        "statusSyncedAt": datetime.utcnow().isoformat()
    })
    log_audit_event(
        user_id=current_user.id,
        org_id=ad_data.get("orgId"),
        action="sync_ad_account_status",
        before_state=None,
        after_state={"ad_account_id": ad_account_id, "status": status},
        ip=None,
        details=None,
    )
    return {"status": status, "spendCap": spend_cap} 
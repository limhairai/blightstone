from fastapi import APIRouter, HTTPException, Depends, Query, Body
from app.core.firebase import get_firestore
from app.core.security import get_current_user
from app.services.facebook import FacebookAPI
from app.schemas.user import UserRead as User
from datetime import datetime
from typing import List, Dict
from app.services.audit_log_service import log_audit_event
import logging

router = APIRouter()
logger = logging.getLogger("adhub_app")

# --- 1. Top-up main wallet ---
@router.post("/topup")
async def topup_org_wallet(
    orgId: str = Body(...),
    amount: float = Body(...),
    idempotency_key: str = Body(None),
    current_user: User = Depends(get_current_user)
):
    if amount <= 0 or amount > 1_000_000:
        raise HTTPException(status_code=400, detail="Invalid amount")
    db = get_firestore()
    org_ref, org_doc = get_org_for_user(db, current_user.uid, orgId)
    FEE_PERCENT = 0.03
    def transaction_logic(transaction):
        org_snapshot = org_ref.get(transaction=transaction)
        org_data = org_snapshot.to_dict()
        # Idempotency check
        if idempotency_key:
            tx_query = db.collection("transactions").where("orgId", "==", orgId).where("idempotencyKey", "==", idempotency_key).stream(transaction=transaction)
            if any(True for _ in tx_query):
                raise HTTPException(status_code=409, detail="Duplicate request")
        fee = round(amount * FEE_PERCENT, 2)
        net_amount = round(amount - fee, 2)
        new_balance = org_data.get("balance", 0.0) + net_amount
        transaction.update(org_ref, {"balance": new_balance})
        transaction.set(db.collection("transactions").document(), {
            "orgId": orgId,
            "userId": current_user.uid,
            "type": "topup",
            "grossAmount": amount,
            "fee": fee,
            "netAmount": net_amount,
            "from": "external",
            "to": "orgWallet",
            "timestamp": datetime.utcnow().isoformat(),
            "idempotencyKey": idempotency_key,
        })
        return {"balance": new_balance, "fee": fee, "netAmount": net_amount}
    return db.run_transaction(transaction_logic)

def get_user_org_ids(db, user_id):
    org_user_docs = db.collection("organization_users").where("userId", "==", user_id).stream()
    return set(doc.to_dict()["orgId"] for doc in org_user_docs)

def get_org_for_user(db, user_id, org_id):
    # Ensure user is a member of org
    org_user_doc = db.collection("organization_users").document(f"{org_id}_{user_id}").get()
    if not org_user_doc.exists:
        raise HTTPException(status_code=403, detail="Not a member of this organization.")
    org_ref = db.collection("organizations").document(org_id)
    org_doc = org_ref.get()
    if not org_doc.exists:
        raise HTTPException(status_code=404, detail="Organization not found.")
    return org_ref, org_doc

# --- 2. Distribute funds to ad accounts ---
@router.post("/distribute")
async def distribute_funds(
    orgId: str = Body(...),
    distributions: list = Body(...),
    idempotency_key: str = Body(None),
    current_user: User = Depends(get_current_user)
):
    db = get_firestore()
    user_org_ids = get_user_org_ids(db, current_user.uid)
    if orgId not in user_org_ids:
        raise HTTPException(status_code=403, detail="Not a member of this organization.")
    org_ref = db.collection("organizations").document(orgId)
    def transaction_logic(transaction):
        org_snapshot = org_ref.get(transaction=transaction)
        org_data = org_snapshot.to_dict()
        main_balance = org_data.get("balance", 0.0)
        total = 0.0
        for d in distributions:
            if d["amount"] <= 0 or d["amount"] > 1_000_000:
                raise HTTPException(status_code=400, detail="Invalid amount in distribution")
            ad_ref = db.collection("adAccounts").document(d["adAccountId"])
            ad_doc = ad_ref.get(transaction=transaction)
            if not ad_doc.exists:
                raise HTTPException(status_code=404, detail=f"Ad account {d['adAccountId']} not found")
            ad_data = ad_doc.to_dict()
            if ad_data.get("orgId") != orgId:
                raise HTTPException(status_code=403, detail=f"Ad account {d['adAccountId']} does not belong to this org")
            total += d["amount"]
        if total > main_balance:
            raise HTTPException(status_code=400, detail="Insufficient org wallet balance")
        # Idempotency check
        if idempotency_key:
            tx_query = db.collection("transactions").where("orgId", "==", orgId).where("idempotencyKey", "==", idempotency_key).stream(transaction=transaction)
            if any(True for _ in tx_query):
                raise HTTPException(status_code=409, detail="Duplicate request")
        transaction.update(org_ref, {"balance": main_balance - total})
        for d in distributions:
            ad_ref = db.collection("adAccounts").document(d["adAccountId"])
            ad_doc = ad_ref.get(transaction=transaction)
            ad_data = ad_doc.to_dict()
            new_balance = ad_data.get("balance", 0.0) + d["amount"]
            transaction.update(ad_ref, {"balance": new_balance, "spendCap": new_balance, "spendCapUpdatedAt": datetime.utcnow().isoformat()})
            transaction.set(db.collection("transactions").document(), {
                "orgId": orgId,
                "userId": current_user.uid,
                "type": "distribute",
                "amount": d["amount"],
                "from": "orgWallet",
                "to": d["adAccountId"],
                "timestamp": datetime.utcnow().isoformat(),
                "idempotencyKey": idempotency_key,
            })
        return {"balance": main_balance - total}
    return db.run_transaction(transaction_logic)

# --- 3. Consolidate funds from ad accounts to main wallet ---
@router.post("/consolidate")
async def consolidate_funds(
    orgId: str = Body(...),
    adAccountIds: list = Body(...),
    idempotency_key: str = Body(None),
    current_user: User = Depends(get_current_user)
):
    db = get_firestore()
    user_org_ids = get_user_org_ids(db, current_user.uid)
    if orgId not in user_org_ids:
        raise HTTPException(status_code=403, detail="Not a member of this organization.")
    org_ref = db.collection("organizations").document(orgId)
    def transaction_logic(transaction):
        org_snapshot = org_ref.get(transaction=transaction)
        org_data = org_snapshot.to_dict()
        main_balance = org_data.get("balance", 0.0)
        total = 0.0
        for ad_id in adAccountIds:
            ad_ref = db.collection("adAccounts").document(ad_id)
            ad_doc = ad_ref.get(transaction=transaction)
            if not ad_doc.exists:
                continue
            ad_data = ad_doc.to_dict()
            if ad_data.get("orgId") != orgId:
                raise HTTPException(status_code=403, detail=f"Ad account {ad_id} does not belong to this org")
            bal = ad_data.get("balance", 0.0)
            total += bal
            transaction.update(ad_ref, {"balance": 0.0, "spendCap": 1, "spendCapUpdatedAt": datetime.utcnow().isoformat()})
            transaction.set(db.collection("transactions").document(), {
                "orgId": orgId,
                "userId": current_user.uid,
                "type": "consolidate",
                "amount": bal,
                "from": ad_id,
                "to": "orgWallet",
                "timestamp": datetime.utcnow().isoformat(),
                "idempotencyKey": idempotency_key,
            })
        transaction.update(org_ref, {"balance": main_balance + total})
        return {"balance": main_balance + total}
    return db.run_transaction(transaction_logic)

@router.get("/transactions")
async def get_transactions(
    orgId: str = Query(...),
    start_date: str = Query(None),
    end_date: str = Query(None),
    type: str = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
):
    db = get_firestore()
    user_org_ids = get_user_org_ids(db, current_user.uid)
    if orgId not in user_org_ids:
        raise HTTPException(status_code=403, detail="Not a member of this organization.")
    query = db.collection("transactions").where("orgId", "==", orgId)
    if type:
        query = query.where("type", "==", type)
    if start_date:
        query = query.where("timestamp", ">=", start_date)
    if end_date:
        query = query.where("timestamp", "<=", end_date)
    docs = list(query.stream())
    docs = docs[offset:offset+limit]
    txs = [doc.to_dict() for doc in docs]
    return {"transactions": txs} 
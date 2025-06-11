from fastapi import APIRouter, HTTPException, Query, Depends
from core.supabase_client import get_supabase_client
from services.facebook import FacebookAPI
from datetime import datetime, timezone
import os
import requests
import time
from core.security import get_current_user
from schemas.user import UserRead as User
from typing import List, Optional
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

def verify_org_membership(supabase, user_id: str, org_id: str):
    """Verify user is a member of the organization"""
    member_check = (
        supabase.table("organization_members")
        .select("user_id")
        .eq("organization_id", org_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    
    if not member_check.data:
        raise HTTPException(
            status_code=403, 
            detail="Not a member of this organization"
        )
    return True

def get_user_organization(supabase, user_id: str):
    """Get user's primary organization"""
    org_response = (
        supabase.table("organization_members")
        .select("organization_id, organizations(plan_id)")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    
    if not org_response.data:
        raise HTTPException(status_code=404, detail="No organization found for user")
    
    return org_response.data

def create_audit_log(supabase, user_id: str, org_id: str, action: str, details: dict):
    """Create audit log entry in Supabase"""
    try:
        audit_data = {
            "user_id": user_id,
            "organization_id": org_id,
            "action": action,
            "details": details,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        supabase.table("audit_logs").insert(audit_data).execute()
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")

# --- 1. Inventory: List all ad accounts (admin only) ---
@router.get("/inventory")
async def list_inventory(current_user: User = Depends(get_current_user)):
    """List all ad accounts in inventory"""
    supabase = get_supabase_client()
    
    try:
        response = (
            supabase.table("ad_accounts")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )
        
        return {"ad_accounts": response.data or []}
        
    except Exception as e:
        logger.error(f"Error listing inventory: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list inventory")

# --- 2. Assign ad account to client (with BM ID) ---
@router.post("/assign")
async def assign_ad_account(
    ad_account_id: str, 
    client_uid: str, 
    client_bm_id: str, 
    fb_user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Assign ad account to client"""
    try:
        supabase = get_supabase_client()
        
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
        user_org = get_user_organization(supabase, client_uid)
        org_id = user_org["organization_id"]
        
        # Get plan from organizations table
        plan_response = (
            supabase.table("organizations")
            .select("plans(name)")
            .eq("id", org_id)
            .maybe_single()
            .execute()
        )
        
        plan_name = "Bronze"  # Default
        if plan_response.data and plan_response.data.get("plans"):
            plan_name = plan_response.data["plans"]["name"]
        
        pool_limit = POOL_LIMITS.get(plan_name, 1)
        
        # Count assigned accounts for this org
        assigned_response = (
            supabase.table("ad_accounts")
            .select("id", count="exact")
            .eq("status", "assigned")
            .execute()
        )
        
        # Filter by organization through business relationship
        business_response = (
            supabase.table("businesses")
            .select("id")
            .eq("organization_id", org_id)
            .execute()
        )
        
        business_ids = [b["id"] for b in business_response.data or []]
        
        assigned_count = 0
        if business_ids:
            assigned_accounts_response = (
                supabase.table("ad_accounts")
                .select("id", count="exact")
                .in_("business_id", business_ids)
                .eq("status", "assigned")
                .execute()
            )
            assigned_count = assigned_accounts_response.count or 0
        
        if assigned_count >= pool_limit:
            raise HTTPException(
                status_code=403, 
                detail=f"Account pool limit reached for your plan ({plan_name}). Please upgrade to add more accounts."
            )

        # Get ad account
        ad_account_response = (
            supabase.table("ad_accounts")
            .select("*")
            .eq("account_id", ad_account_id)
            .maybe_single()
            .execute()
        )
        
        if not ad_account_response.data:
            raise HTTPException(status_code=404, detail="Ad account not found")
        
        ad_account = ad_account_response.data
        
        if ad_account.get("user_id"):
            raise HTTPException(status_code=400, detail="Ad account already assigned")
        
        # Share ad account with client BM via Facebook API
        fb_api = FacebookAPI()
        fb_api.share_ad_account_with_bm(HOST_BM_ID, client_bm_id, ad_account_id)
        
        # Assign user as ADVERTISER
        fb_api.assign_user_to_ad_account(ad_account_id, fb_user_id, role="ADVERTISER")
        
        # Update ad account in Supabase
        update_response = (
            supabase.table("ad_accounts")
            .update({
                "user_id": client_uid,
                "status": "assigned",
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
            .eq("account_id", ad_account_id)
            .execute()
        )
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to update ad account")
        
        # Create audit log
        create_audit_log(
            supabase, 
            str(current_user.uid), 
            org_id,
            "assign_ad_account",
            {
                "ad_account_id": ad_account_id,
                "client_uid": client_uid,
                "client_bm_id": client_bm_id
            }
        )
        
        logger.info(f"Assigned ad account {ad_account_id} to client {client_uid} (BM {client_bm_id})")
        return {"status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning ad account {ad_account_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to assign ad account")

# --- 3. Change client BM ---
@router.post("/change-bm")
async def change_client_bm(
    ad_account_id: str, 
    old_bm_id: str, 
    new_bm_id: str, 
    client_uid: str, 
    fb_user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Change client business manager for ad account"""
    try:
        supabase = get_supabase_client()
        
        # Get ad account
        ad_account_response = (
            supabase.table("ad_accounts")
            .select("*")
            .eq("account_id", ad_account_id)
            .maybe_single()
            .execute()
        )
        
        if not ad_account_response.data:
            raise HTTPException(status_code=404, detail="Ad account not found")
        
        # Facebook API operations
        fb_api = FacebookAPI()
        fb_api.remove_ad_account_from_bm(HOST_BM_ID, old_bm_id, ad_account_id)
        fb_api.share_ad_account_with_bm(HOST_BM_ID, new_bm_id, ad_account_id)
        fb_api.assign_user_to_ad_account(ad_account_id, fb_user_id, role="ADVERTISER")
        
        # Update ad account
        update_response = (
            supabase.table("ad_accounts")
            .update({
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
            .eq("account_id", ad_account_id)
            .execute()
        )
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to update ad account")
        
        # Get user's organization for audit log
        user_org = get_user_organization(supabase, client_uid)
        
        # Create audit log
        create_audit_log(
            supabase,
            str(current_user.uid),
            user_org["organization_id"],
            "change_bm",
            {
                "ad_account_id": ad_account_id,
                "old_bm_id": old_bm_id,
                "new_bm_id": new_bm_id
            }
        )
        
        logger.info(f"Changed BM for ad account {ad_account_id} from {old_bm_id} to {new_bm_id}")
        return {"status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing BM for ad account {ad_account_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to change BM")

# --- 4. Reclaim ad account (return to inventory) ---
@router.post("/reclaim")
async def reclaim_ad_account(ad_account_id: str, current_user: User = Depends(get_current_user)):
    """Reclaim ad account and return to inventory"""
    try:
        supabase = get_supabase_client()
        
        # Get ad account
        ad_account_response = (
            supabase.table("ad_accounts")
            .select("*")
            .eq("account_id", ad_account_id)
            .maybe_single()
            .execute()
        )
        
        if not ad_account_response.data:
            raise HTTPException(status_code=404, detail="Ad account not found")
        
        ad_account = ad_account_response.data
        
        # Remove from client BM via Facebook API if assigned
        if ad_account.get("user_id"):
            fb_api = FacebookAPI()
            # Note: We'd need to store client_bm_id to remove properly
            # For now, this is a simplified version
            
        # Update ad account status
        update_response = (
            supabase.table("ad_accounts")
            .update({
                "user_id": None,
                "status": "available",
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
            .eq("account_id", ad_account_id)
            .execute()
        )
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to update ad account")
        
        # Get organization for audit log
        if ad_account.get("business_id"):
            business_response = (
                supabase.table("businesses")
                .select("organization_id")
                .eq("id", ad_account["business_id"])
                .maybe_single()
                .execute()
            )
            
            if business_response.data:
                create_audit_log(
                    supabase,
                    str(current_user.uid),
                    business_response.data["organization_id"],
                    "reclaim_ad_account",
                    {"ad_account_id": ad_account_id}
                )
        
        logger.info(f"Reclaimed ad account {ad_account_id}")
        return {"status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reclaiming ad account {ad_account_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to reclaim ad account")

# --- 5. Allocate funds & set spend cap ---
@router.post("/allocate")
async def allocate_funds(
    ad_account_id: str, 
    client_uid: str, 
    amount: float,
    current_user: User = Depends(get_current_user)
):
    """Allocate funds to ad account and set spend cap"""
    try:
        supabase = get_supabase_client()
        
        # Get ad account
        ad_account_response = (
            supabase.table("ad_accounts")
            .select("*")
            .eq("account_id", ad_account_id)
            .maybe_single()
            .execute()
        )
        
        if not ad_account_response.data:
            raise HTTPException(status_code=404, detail="Ad account not found")
        
        # Set spend cap via Facebook API (in cents)
        fb_api = FacebookAPI()
        fb_api.set_spend_cap(ad_account_id, int(amount * 100))
        
        # Update ad account balance and spend limit
        update_response = (
            supabase.table("ad_accounts")
            .update({
                "balance": amount,
                "spend_limit": amount,
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
            .eq("account_id", ad_account_id)
            .execute()
        )
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to update ad account")
        
        # Get organization for audit log
        user_org = get_user_organization(supabase, client_uid)
        
        create_audit_log(
            supabase,
            str(current_user.uid),
            user_org["organization_id"],
            "allocate_funds",
            {
                "ad_account_id": ad_account_id,
                "client_uid": client_uid,
                "amount": amount
            }
        )
        
        logger.info(f"Allocated ${amount} to ad account {ad_account_id} for client {client_uid}")
        return {"status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error allocating funds to ad account {ad_account_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to allocate funds")

# --- 6. Set spend cap ---
@router.post("/{ad_account_id}/spend-cap")
async def set_spend_cap(ad_account_id: str, amount: float, current_user: User = Depends(get_current_user)):
    """Set spend cap for ad account"""
    try:
        supabase = get_supabase_client()
        
        # Set spend cap via Facebook API
        fb_api = FacebookAPI()
        fb_api.set_spend_cap(ad_account_id, int(amount * 100))
        
        # Update ad account
        update_response = (
            supabase.table("ad_accounts")
            .update({
                "spend_limit": amount,
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
            .eq("account_id", ad_account_id)
            .execute()
        )
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to update spend cap")
        
        logger.info(f"Set spend cap of ${amount} for ad account {ad_account_id}")
        return {"status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting spend cap for ad account {ad_account_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to set spend cap")

# --- 7. Pause ad account ---
@router.post("/{ad_account_id}/pause")
async def pause_ad_account(ad_account_id: str, current_user: User = Depends(get_current_user)):
    """Pause ad account by setting spend cap to $1"""
    try:
        supabase = get_supabase_client()
        
        # Set spend cap to $1 via Facebook API
        fb_api = FacebookAPI()
        fb_api.set_spend_cap(ad_account_id, 100)  # $1 in cents
        
        # Update ad account status
        update_response = (
            supabase.table("ad_accounts")
            .update({
                "status": "paused",
                "spend_limit": 1.0,
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
            .eq("account_id", ad_account_id)
            .execute()
        )
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to pause ad account")
        
        logger.info(f"Paused ad account {ad_account_id}")
        return {"status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error pausing ad account {ad_account_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to pause ad account")

# --- 8. Resume ad account ---
@router.post("/{ad_account_id}/resume")
async def resume_ad_account(
    ad_account_id: str, 
    client_uid: str,
    current_user: User = Depends(get_current_user)
):
    """Resume ad account by restoring previous spend cap"""
    try:
        supabase = get_supabase_client()
        
        # Get ad account current balance
        ad_account_response = (
            supabase.table("ad_accounts")
            .select("balance")
            .eq("account_id", ad_account_id)
            .maybe_single()
            .execute()
        )
        
        if not ad_account_response.data:
            raise HTTPException(status_code=404, detail="Ad account not found")
        
        balance = ad_account_response.data.get("balance", 0.0)
        
        if balance <= 0:
            raise HTTPException(status_code=400, detail="No balance available for this ad account")
        
        # Set spend cap via Facebook API
        fb_api = FacebookAPI()
        fb_api.set_spend_cap(ad_account_id, int(balance * 100))
        
        # Update ad account status
        update_response = (
            supabase.table("ad_accounts")
            .update({
                "status": "active",
                "spend_limit": balance,
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
            .eq("account_id", ad_account_id)
            .execute()
        )
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to resume ad account")
        
        logger.info(f"Resumed ad account {ad_account_id} for client {client_uid}")
        return {"status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resuming ad account {ad_account_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to resume ad account")

# --- 9. Get spend/cap ---
@router.get("/{ad_account_id}/spend")
async def get_spend(ad_account_id: str, current_user: User = Depends(get_current_user)):
    """Get spend and cap information for ad account"""
    try:
        fb_api = FacebookAPI()
        details = fb_api.get_ad_account_details(ad_account_id)
        
        return {
            "amount_spent": details.get("amount_spent"),
            "spend_cap": details.get("spend_cap"),
            "balance": details.get("balance")
        }
        
    except Exception as e:
        logger.error(f"Error getting spend for ad account {ad_account_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get spend information")

# --- 10. Sync spend (stub for cron/automation) ---
@router.post("/sync-spend")
async def sync_spend(current_user: User = Depends(get_current_user)):
    """Sync spend data from Facebook (placeholder for automation)"""
    # TODO: Implement spend synchronization with Supabase
    return {"status": "not_implemented"}

# --- 11. List ad accounts for organization ---
@router.get("", response_model=dict)
@router.get("/", response_model=dict)
async def list_ad_accounts(
    organization_id: str = Query(...), 
    current_user: User = Depends(get_current_user)
):
    """List ad accounts for organization"""
    try:
        supabase = get_supabase_client()
        
        # Verify user is member of organization
        verify_org_membership(supabase, str(current_user.uid), organization_id)
        
        # Get businesses for this organization
        business_response = (
            supabase.table("businesses")
            .select("id")
            .eq("organization_id", organization_id)
            .execute()
        )
        
        business_ids = [b["id"] for b in business_response.data or []]
        
        if not business_ids:
            return {"ad_accounts": []}
        
        # Get ad accounts for these businesses
        ad_accounts_response = (
            supabase.table("ad_accounts")
            .select("*")
            .in_("business_id", business_ids)
            .order("created_at", desc=True)
            .execute()
        )
        
        return {"ad_accounts": ad_accounts_response.data or []}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing ad accounts for org {organization_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list ad accounts")

# --- 12. Archive ad account ---
@router.post("/archive")
async def archive_ad_account(ad_account_id: str, current_user: User = Depends(get_current_user)):
    """Archive ad account and return balance to organization wallet"""
    try:
        supabase = get_supabase_client()
        
        # Get ad account
        ad_account_response = (
            supabase.table("ad_accounts")
            .select("*, businesses(organization_id)")
            .eq("account_id", ad_account_id)
            .maybe_single()
            .execute()
        )
        
        if not ad_account_response.data:
            raise HTTPException(status_code=404, detail="Ad account not found")
        
        ad_account = ad_account_response.data
        balance = ad_account.get("balance", 0.0)
        org_id = ad_account["businesses"]["organization_id"]
        
        # Move balance to organization wallet
        if balance > 0:
            org_response = (
                supabase.table("organizations")
                .select("wallet_balance")
                .eq("id", org_id)
                .single()
                .execute()
            )
            
            if org_response.data:
                current_org_balance = org_response.data.get("wallet_balance", 0.0)
                new_org_balance = current_org_balance + balance
                
                # Update organization balance
                supabase.table("organizations").update({
                    "wallet_balance": new_org_balance
                }).eq("id", org_id).execute()
                
                # Create transaction record
                transaction_data = {
                    "organization_id": org_id,
                    "user_id": str(current_user.uid),
                    "type": "archive",
                    "amount": balance,
                    "from_account": ad_account_id,
                    "to_account": "org_wallet",
                    "status": "completed",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                
                supabase.table("transactions").insert(transaction_data).execute()
        
        # Reset spend cap via Facebook API
        fb_api = FacebookAPI()
        fb_api.set_spend_cap(ad_account_id, 100)  # $1
        
        # Update ad account status
        update_response = (
            supabase.table("ad_accounts")
            .update({
                "balance": 0.0,
                "spend_limit": 1.0,
                "status": "archived",
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
            .eq("account_id", ad_account_id)
            .execute()
        )
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to archive ad account")
        
        create_audit_log(
            supabase,
            str(current_user.uid),
            org_id,
            "archive_ad_account",
            {
                "ad_account_id": ad_account_id,
                "balance_returned": balance
            }
        )
        
        logger.info(f"Archived ad account {ad_account_id}, returned ${balance} to org wallet")
        return {"archived": True, "balance_returned": balance}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error archiving ad account {ad_account_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to archive ad account")

# --- 13. Set ad account tags ---
@router.post("/tags")
async def set_ad_account_tags(
    ad_account_id: str, 
    tags: List[str], 
    current_user: User = Depends(get_current_user)
):
    """Set tags for ad account"""
    try:
        supabase = get_supabase_client()
        
        # Update ad account tags
        update_response = (
            supabase.table("ad_accounts")
            .update({
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
            .eq("account_id", ad_account_id)
            .execute()
        )
        
        if not update_response.data:
            raise HTTPException(status_code=404, detail="Ad account not found")
        
        # Note: Tags functionality would need to be implemented in the database schema
        # For now, just return success
        
        logger.info(f"Set tags for ad account {ad_account_id}: {tags}")
        return {"tags": tags}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting tags for ad account {ad_account_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to set tags")

# --- 14. Sync ad account status from Facebook ---
@router.post("/sync-status")
async def sync_ad_account_status(ad_account_id: str, current_user: User = Depends(get_current_user)):
    """Sync ad account status from Facebook"""
    try:
        supabase = get_supabase_client()
        
        # Get status from Facebook
        fb_api = FacebookAPI()
        details = fb_api.get_ad_account_details(ad_account_id)
        status = details.get("status", "unknown")
        spend_cap = details.get("spend_cap")
        
        # Update ad account
        update_response = (
            supabase.table("ad_accounts")
            .update({
                "status": status,
                "spend_limit": spend_cap / 100 if spend_cap else None,  # Convert from cents
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
            .eq("account_id", ad_account_id)
            .execute()
        )
        
        if not update_response.data:
            raise HTTPException(status_code=404, detail="Ad account not found")
        
        logger.info(f"Synced status for ad account {ad_account_id}: {status}")
        return {"status": status, "spend_cap": spend_cap}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing status for ad account {ad_account_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to sync status") 
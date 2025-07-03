from fastapi import APIRouter, HTTPException, Depends, Query, Body
from app.core.security import get_current_user
from app.core.supabase_client import get_supabase_client
from app.schemas.user import UserRead as User
from datetime import datetime, timezone
from typing import List, Dict, Optional
from pydantic import BaseModel
import logging
import uuid

router = APIRouter()
logger = logging.getLogger("adhub_app")

class TopupRequest(BaseModel):
    organization_id: str
    amount: float
    idempotency_key: Optional[str] = None

class DistributionItem(BaseModel):
    ad_account_id: str
    amount: float

class DistributeRequest(BaseModel):
    organization_id: str
    distributions: List[DistributionItem]
    idempotency_key: Optional[str] = None

class ConsolidateRequest(BaseModel):
    organization_id: str
    ad_account_ids: List[str]
    idempotency_key: Optional[str] = None

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

def check_idempotency(supabase, org_id: str, idempotency_key: str):
    """Check if transaction with this idempotency key already exists"""
    if not idempotency_key:
        return False
    
    existing = (
        supabase.table("transactions")
        .select("id")
        .eq("organization_id", org_id)
        .eq("idempotency_key", idempotency_key)
        .maybe_single()
        .execute()
    )
    
    return existing.data is not None

@router.post("/topup")
async def topup_org_wallet(
    request: TopupRequest,
    current_user: User = Depends(get_current_user)
):
    """Top up organization wallet"""
    if request.amount <= 0 or request.amount > 1_000_000:
        raise HTTPException(status_code=400, detail="Invalid amount")
    
    supabase = get_supabase_client()
    
    try:
        # Verify user is member of organization
        verify_org_membership(supabase, str(current_user.uid), request.organization_id)
        
        # Check idempotency
        if request.idempotency_key and check_idempotency(supabase, request.organization_id, request.idempotency_key):
            raise HTTPException(status_code=409, detail="Duplicate request")
        
        # Get current organization balance
        org_response = (
            supabase.table("organizations")
            .select("wallet_balance")
            .eq("organization_id", request.organization_id)
            .single()
            .execute()
        )
        
        if not org_response.data:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        current_balance = org_response.data.get("wallet_balance", 0.0)
        
        # Calculate fee (3%)
        FEE_PERCENT = 0.03
        fee = round(request.amount * FEE_PERCENT, 2)
        net_amount = round(request.amount - fee, 2)
        new_balance = current_balance + net_amount
        
        # Update organization balance
        update_response = (
            supabase.table("organizations")
            .update({"wallet_balance": new_balance})
            .eq("organization_id", request.organization_id)
            .execute()
        )
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to update organization balance")
        
        # Create transaction record
        transaction_data = {
            "organization_id": request.organization_id,
            "user_id": str(current_user.uid),
            "type": "topup",
            "amount": net_amount,
            "gross_amount": request.amount,
            "fee": fee,
            "from_account": "external",
            "to_account": "org_wallet",
            "status": "completed",
            "idempotency_key": request.idempotency_key,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        transaction_response = (
            supabase.table("transactions")
            .insert(transaction_data)
            .execute()
        )
        
        if not transaction_response.data:
            logger.error("Failed to create transaction record")
        
        logger.info(f"Topped up org {request.organization_id} with ${net_amount} (fee: ${fee})")
        
        return {
            "balance": new_balance,
            "fee": fee,
            "net_amount": net_amount,
            "transaction_id": transaction_response.data[0]["id"] if transaction_response.data else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error topping up wallet: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process topup")

@router.get("/transactions")
async def get_transactions(
    organization_id: str = Query(...),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    transaction_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
):
    """Get transaction history for organization"""
    supabase = get_supabase_client()
    
    try:
        # Verify user is member of organization
        verify_org_membership(supabase, str(current_user.uid), organization_id)
        
        # Build query
        query = supabase.table("transactions").select("*").eq("organization_id", organization_id)
        
        if transaction_type:
            query = query.eq("type", transaction_type)
        if start_date:
            query = query.gte("created_at", start_date)
        if end_date:
            query = query.lte("created_at", end_date)
        
        # Execute query with pagination
        response = (
            query.order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        
        transactions = response.data or []
        
        return {
            "transactions": transactions,
            "count": len(transactions),
            "offset": offset,
            "limit": limit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching transactions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch transactions")

@router.get("/balance")
async def get_wallet_balance(
    organization_id: str = Query(...),
    current_user: User = Depends(get_current_user)
):
    """Get organization wallet balance"""
    supabase = get_supabase_client()
    
    try:
        # Verify user is member of organization
        verify_org_membership(supabase, str(current_user.uid), organization_id)
        
        # Get organization balance
        org_response = (
            supabase.table("organizations")
            .select("wallet_balance")
            .eq("organization_id", organization_id)
            .single()
            .execute()
        )
        
        if not org_response.data:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        return {
            "balance": org_response.data.get("wallet_balance", 0.0),
            "organization_id": organization_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching wallet balance: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch wallet balance") 
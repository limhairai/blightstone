"""
Access Code API endpoints for AdHub
Handles creation, validation, and management of access codes
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import secrets
import string
from supabase import Client
from app.core.supabase_client import get_supabase_client
from app.core.security import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class AccessCodeCreate(BaseModel):
    organization_id: str
    code_type: str = "user_invite"  # 'user_invite', 'group_invite', 'admin_invite'
    max_uses: int = 1
    expires_hours: int = 24

class AccessCodeResponse(BaseModel):
    id: str
    code: str
    code_type: str
    max_uses: int
    current_uses: int
    expires_at: datetime
    is_active: bool
    created_at: datetime
    organization_id: str

class AccessCodeStats(BaseModel):
    total_codes: int
    active_codes: int
    expired_codes: int
    used_up_codes: int
    total_redemptions: int
    usage_rate: float

def generate_access_code(length: int = 8) -> str:
    """Generate a secure access code like BullX"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

@router.post("/", response_model=AccessCodeResponse)
async def create_access_code(
    code_data: AccessCodeCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new access code"""
    supabase = get_supabase_client()
    try:
        # Verify user has permission for this organization
        org_check = supabase.table("organization_members").select("role").eq("user_id", current_user["id"]).eq("organization_id", code_data.organization_id).single().execute()
        
        if not org_check.data or org_check.data["role"] not in ["owner", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to create access codes for this organization"
            )
        
        # Generate unique access code
        access_code = generate_access_code()
        expires_at = datetime.utcnow() + timedelta(hours=code_data.expires_hours)
        
        # Insert access code
        insert_data = {
            "code": access_code,
            "created_by_user_id": current_user["id"],
            "organization_id": code_data.organization_id,
            "code_type": code_data.code_type,
            "max_uses": code_data.max_uses,
            "current_uses": 0,
            "expires_at": expires_at.isoformat(),
            "is_active": True
        }
        
        response = supabase.table("access_codes").insert(insert_data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create access code"
            )
        
        logger.info(f"Created access code {access_code} for org {code_data.organization_id} by user {current_user['id']}")
        return AccessCodeResponse(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating access code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/", response_model=List[AccessCodeResponse])
async def get_access_codes(
    organization_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get access codes for an organization"""
    supabase = get_supabase_client()
    try:
        # Verify user has permission for this organization
        org_check = supabase.table("organization_members").select("role").eq("user_id", current_user["id"]).eq("organization_id", organization_id).single().execute()
        
        if not org_check.data or org_check.data["role"] not in ["owner", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view access codes for this organization"
            )
        
        # Get access codes
        response = supabase.table("access_codes").select("*").eq("organization_id", organization_id).order("created_at", desc=True).execute()
        
        return [AccessCodeResponse(**code) for code in response.data]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching access codes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.delete("/{code_id}")
async def deactivate_access_code(
    code_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Deactivate an access code"""
    supabase = get_supabase_client()
    try:
        # Get the access code and verify permissions
        code_response = supabase.table("access_codes").select("*, organizations(*)").eq("code_id", code_id).single().execute()
        
        if not code_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Access code not found"
            )
        
        # Verify user has permission for this organization
        org_id = code_response.data["organization_id"]
        org_check = supabase.table("organization_members").select("role").eq("user_id", current_user["id"]).eq("organization_id", org_id).single().execute()
        
        if not org_check.data or org_check.data["role"] not in ["owner", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to deactivate this access code"
            )
        
        # Deactivate the code
        response = supabase.table("access_codes").update({"is_active": False}).eq("code_id", code_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to deactivate access code"
            )
        
        logger.info(f"Deactivated access code {code_id} by user {current_user['id']}")
        return {"message": "Access code deactivated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deactivating access code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/stats/{organization_id}", response_model=AccessCodeStats)
async def get_access_code_stats(
    organization_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get access code statistics for an organization"""
    supabase = get_supabase_client()
    try:
        # Verify user has permission for this organization
        org_check = supabase.table("organization_members").select("role").eq("user_id", current_user["id"]).eq("organization_id", organization_id).single().execute()
        
        if not org_check.data or org_check.data["role"] not in ["owner", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view statistics for this organization"
            )
        
        # Get statistics from view
        response = supabase.table("access_code_stats").select("*").eq("organization_id", organization_id).execute()
        
        if not response.data:
            return AccessCodeStats(
                total_codes=0,
                active_codes=0,
                expired_codes=0,
                used_up_codes=0,
                total_redemptions=0,
                usage_rate=0.0
            )
        
        stats = response.data[0]
        return AccessCodeStats(
            total_codes=stats["total_codes"],
            active_codes=stats["active_codes"],
            expired_codes=stats["expired_codes"],
            used_up_codes=stats["used_up_codes"],
            total_redemptions=stats["total_redemptions"],
            usage_rate=stats["usage_rate"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching access code stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/validate")
async def validate_access_code(
    code: str
):
    """Validate an access code (for bot use)"""
    supabase = get_supabase_client()
    try:
        # Use database function for validation
        response = supabase.rpc("is_access_code_valid", {"code_to_check": code}).execute()
        
        return {"valid": response.data, "code": code.upper()}
        
    except Exception as e:
        logger.error(f"Error validating access code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/redeem")
async def redeem_access_code(
    code: str,
    telegram_id: int
):
    """Redeem an access code (for bot use)"""
    supabase = get_supabase_client()
    try:
        # Use database function for atomic redemption
        response = supabase.rpc("redeem_access_code", {
            "code_to_redeem": code,
            "telegram_user_id": telegram_id
        }).execute()
        
        return response.data
        
    except Exception as e:
        logger.error(f"Error redeeming access code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        ) 
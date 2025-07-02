from fastapi import APIRouter, Depends, HTTPException, status, Body
from app.core.supabase_client import get_supabase_client
from app.core.security import get_current_user
from app.schemas.user import UserRead as User
from pydantic import BaseModel
import pyotp
import qrcode
import io
import base64
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class Enable2FARequest(BaseModel):
    code: str
    secret: str

class Verify2FARequest(BaseModel):
    code: str

@router.post("/generate-secret", status_code=200)
async def generate_2fa_secret(current_user: User = Depends(get_current_user)):
    """Generate 2FA secret and QR code for user"""
    try:
        secret = pyotp.random_base32()
        
        # Generate QR code for authenticator apps
        uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=current_user.email, 
            issuer_name="AdHub"
        )
        
        qr = qrcode.make(uri)
        buf = io.BytesIO()
        qr.save(buf, format="PNG")
        qr_b64 = base64.b64encode(buf.getvalue()).decode()
        
        return {
            "secret": secret, 
            "qr": f"data:image/png;base64,{qr_b64}", 
            "uri": uri
        }
        
    except Exception as e:
        logger.error(f"Error generating 2FA secret: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate 2FA secret")

@router.post("/enable", status_code=200)
async def enable_2fa(data: Enable2FARequest, current_user: User = Depends(get_current_user)):
    """Enable 2FA for user after verifying the code"""
    try:
        supabase = get_supabase_client()
        
        # Verify the 2FA code
        totp = pyotp.TOTP(data.secret)
        if not totp.verify(data.code):
            raise HTTPException(status_code=400, detail="Invalid 2FA code")
        
        # Update user's 2FA settings in auth.users metadata
        # Note: Supabase auth.users table stores user metadata
        # We'll store 2FA settings in a separate user_settings table or user metadata
        
        # For now, we'll assume there's a user_settings table
        # Check if user settings exist
        settings_response = (
            supabase.table("user_settings")
            .select("*")
            .eq("user_id", str(current_user.uid))
            .maybe_single()
            .execute()
        )
        
        settings_data = {
            "user_id": str(current_user.uid),
            "twofa_enabled": True,
            "twofa_secret": data.secret,
            "updated_at": "now()"
        }
        
        if settings_response.data:
            # Update existing settings
            update_response = (
                supabase.table("user_settings")
                .update({
                    "twofa_enabled": True,
                    "twofa_secret": data.secret,
                    "updated_at": "now()"
                })
                .eq("user_id", str(current_user.uid))
                .execute()
            )
            
            if not update_response.data:
                raise HTTPException(status_code=500, detail="Failed to enable 2FA")
        else:
            # Create new settings
            insert_response = (
                supabase.table("user_settings")
                .insert(settings_data)
                .execute()
            )
            
            if not insert_response.data:
                raise HTTPException(status_code=500, detail="Failed to enable 2FA")
        
        logger.info(f"2FA enabled for user {current_user.uid}")
        return {"detail": "2FA enabled"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enabling 2FA: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to enable 2FA")

@router.post("/disable", status_code=200)
async def disable_2fa(current_user: User = Depends(get_current_user)):
    """Disable 2FA for user"""
    try:
        supabase = get_supabase_client()
        
        # Update user's 2FA settings
        update_response = (
            supabase.table("user_settings")
            .update({
                "twofa_enabled": False,
                "twofa_secret": None,
                "updated_at": "now()"
            })
            .eq("user_id", str(current_user.uid))
            .execute()
        )
        
        # It's okay if no settings exist - user didn't have 2FA enabled anyway
        logger.info(f"2FA disabled for user {current_user.uid}")
        return {"detail": "2FA disabled"}
        
    except Exception as e:
        logger.error(f"Error disabling 2FA: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to disable 2FA")

@router.post("/verify", status_code=200)
async def verify_2fa(data: Verify2FARequest, current_user: User = Depends(get_current_user)):
    """Verify 2FA code for user"""
    try:
        supabase = get_supabase_client()
        
        # Get user's 2FA settings
        settings_response = (
            supabase.table("user_settings")
            .select("twofa_enabled, twofa_secret")
            .eq("user_id", str(current_user.uid))
            .maybe_single()
            .execute()
        )
        
        if not settings_response.data:
            raise HTTPException(status_code=400, detail="2FA not enabled")
        
        settings = settings_response.data
        
        if not settings.get("twofa_enabled") or not settings.get("twofa_secret"):
            raise HTTPException(status_code=400, detail="2FA not enabled")
        
        # Verify the code
        totp = pyotp.TOTP(settings["twofa_secret"])
        if not totp.verify(data.code):
            raise HTTPException(status_code=400, detail="Invalid 2FA code")
        
        logger.info(f"2FA code verified for user {current_user.uid}")
        return {"detail": "2FA code valid"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying 2FA: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to verify 2FA")

@router.get("/status", status_code=200)
async def get_2fa_status(current_user: User = Depends(get_current_user)):
    """Get 2FA status for user"""
    try:
        supabase = get_supabase_client()
        
        # Get user's 2FA settings
        settings_response = (
            supabase.table("user_settings")
            .select("twofa_enabled")
            .eq("user_id", str(current_user.uid))
            .maybe_single()
            .execute()
        )
        
        enabled = False
        if settings_response.data:
            enabled = settings_response.data.get("twofa_enabled", False)
        
        return {"enabled": enabled}
        
    except Exception as e:
        logger.error(f"Error getting 2FA status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get 2FA status") 
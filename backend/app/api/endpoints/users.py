from fastapi import APIRouter, Depends, HTTPException, Query, Body
from core.security import require_superuser, get_current_user
from core.supabase_client import get_supabase_client
from schemas.user import UserRead as User
# from core.firebase import get_firestore  # TODO: Migrate to Supabase
from pydantic import BaseModel
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class UserProfile(BaseModel):
    uid: str
    email: str
    name: str = ""
    avatar: str = None
    createdAt: str = None
    role: str = "user"

class OnboardingStep(BaseModel):
    id: str
    title: str
    description: str
    completed: bool
    required: bool

class OnboardingProgress(BaseModel):
    steps: List[OnboardingStep]
    currentStep: int

@router.get("/profile")
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get the current user's profile from Supabase profiles table"""
    supabase = get_supabase_client()
    try:
        # Fetch user profile from profiles table
        response = (
            supabase.table("profiles")
            .select("id, email, name, avatar_url, role, is_superuser")
            .eq("id", str(current_user.uid))
            .single()
            .execute()
        )
        
        if response.data:
            return {
                "id": response.data["id"],
                "email": response.data["email"],
                "name": response.data.get("name"),
                "avatar_url": response.data.get("avatar_url"),
                "role": response.data.get("role", "client"),
                "is_superuser": response.data.get("is_superuser", False)
            }
        else:
            # If no profile exists, return basic info from auth user
            return {
                "id": current_user.uid,
                "email": current_user.email,
                "name": None,
                "avatar_url": None,
                "role": "client",
                "is_superuser": False
            }
    except Exception as e:
        logger.error(f"Error fetching profile for user {current_user.uid}: {e}")
        # Fallback to auth user data
        return {
            "id": current_user.uid,
            "email": current_user.email,
            "name": None,
            "avatar_url": None,
            "role": "client",
            "is_superuser": False
        }

# TODO: Migrate these endpoints to Supabase or remove if not needed
# The following endpoints are deprecated and use Firebase/Firestore

@router.get("")
def list_users(search: str = Query("", alias="search"), current_user=Depends(require_superuser)):
    """DEPRECATED: This endpoint uses Firebase and needs migration to Supabase"""
    raise HTTPException(status_code=501, detail="This endpoint is deprecated. Please use Supabase-based user management.")

@router.post("/{uid}/deactivate")
def deactivate_user(uid: str, current_user=Depends(require_superuser)):
    """DEPRECATED: This endpoint uses Firebase and needs migration to Supabase"""
    raise HTTPException(status_code=501, detail="This endpoint is deprecated. Please use Supabase-based user management.")

@router.post("/{uid}/reactivate")
def reactivate_user(uid: str, current_user=Depends(require_superuser)):
    """DEPRECATED: This endpoint uses Firebase and needs migration to Supabase"""
    raise HTTPException(status_code=501, detail="This endpoint is deprecated. Please use Supabase-based user management.")

@router.post("/{uid}/reset-password")
def reset_password(uid: str, current_user=Depends(require_superuser)):
    """DEPRECATED: This endpoint uses Firebase and needs migration to Supabase"""
    raise HTTPException(status_code=501, detail="This endpoint is deprecated. Please use Supabase auth for password reset.")

@router.post("/{uid}/impersonate")
def impersonate_user(uid: str, current_user=Depends(require_superuser)):
    """DEPRECATED: This endpoint uses Firebase and needs migration to Supabase"""
    raise HTTPException(status_code=501, detail="This endpoint is deprecated. Please implement with Supabase auth.")

@router.post("")
def create_user_profile(profile: UserProfile = Body(...)):
    """DEPRECATED: This endpoint uses Firebase and needs migration to Supabase"""
    raise HTTPException(status_code=501, detail="This endpoint is deprecated. User profiles are now handled by Supabase triggers.")

@router.get("/{uid}")
def get_user_profile(uid: str):
    """DEPRECATED: This endpoint uses Firebase and needs migration to Supabase"""
    raise HTTPException(status_code=501, detail="This endpoint is deprecated. Please use /profile for current user or implement Supabase-based user lookup.")

@router.get("/{uid}/onboarding")
def get_onboarding_progress(uid: str):
    """DEPRECATED: This endpoint uses Firebase and needs migration to Supabase"""
    raise HTTPException(status_code=501, detail="This endpoint is deprecated. Please implement onboarding with Supabase.")

@router.post("/{uid}/onboarding")
def update_onboarding_progress(uid: str, progress: OnboardingProgress):
    """DEPRECATED: This endpoint uses Firebase and needs migration to Supabase"""
    raise HTTPException(status_code=501, detail="This endpoint is deprecated. Please implement onboarding with Supabase.") 
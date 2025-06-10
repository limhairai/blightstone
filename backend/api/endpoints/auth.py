from fastapi import APIRouter, Depends, HTTPException, status, Query, Body, Request
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import create_access_token, get_current_user, get_password_hash
from app.core.config import settings
from app.core.supabase_client import get_supabase_client
from app.schemas.auth import Token
from app.schemas.user import UserCreate, UserRead
from datetime import timedelta
import pyotp
import logging
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    logger.info(f"Login attempt for user: {form_data.username}")
    supabase = get_supabase_client()
    try:
        # Authenticate with Supabase using email and password
        auth_response = supabase.auth.sign_in_with_password({"email": form_data.username, "password": form_data.password})
        
        if not auth_response.user or not auth_response.session:
            logger.warning(f"Supabase authentication failed for {form_data.username}. User or session missing.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        supabase_user = auth_response.user
        logger.info(f"User {form_data.username} authenticated successfully with Supabase. User ID: {supabase_user.id}")

        # 2FA Check (Simplified for migration - needs review for Supabase context)
        # This assumes 2FA secret is stored in your 'profiles' table or Supabase user_metadata
        # and that the client sends '2fa_code' in the form if enabled.
        # This part is highly dependent on how you want to integrate 2FA with Supabase.
        # For now, we will bypass custom 2FA if Supabase auth is successful and let Supabase handle MFA if configured there.
        
        # Fetch user profile to check for custom 2FA fields if you implement them
        # profile_response = supabase.table("profiles").select("twofa_enabled", "twofa_secret").eq("id", supabase_user.id).maybe_single().execute()
        # if profile_response.data and profile_response.data.get("twofa_enabled"):
        #     if not request: # This dependency would need to be added to the function signature
        #         logger.error("Request object not available for 2FA code extraction")
        #         raise HTTPException(status_code=500, detail="Server configuration error for 2FA")
            
        #     form_payload = await request.form()
        #     code = form_payload.get("2fa_code")
        #     if not code:
        #         logger.warning(f"2FA code required for user {form_data.username}")
        #         raise HTTPException(status_code=400, detail="2FA code required.")
            
        #     secret = profile_response.data.get("twofa_secret")
        #     if not secret:
        #         logger.error(f"2FA secret not found for user {form_data.username}")
        #         raise HTTPException(status_code=500, detail="2FA setup incomplete.")

        #     totp = pyotp.TOTP(secret)
        #     if not totp.verify(code):
        #         logger.warning(f"Invalid 2FA code for user {form_data.username}")
        #         raise HTTPException(status_code=400, detail="Invalid 2FA code.")
        #     logger.info(f"2FA successful for {form_data.username}")

        # Create your backend's own access token, with Supabase user ID as 'sub'
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        backend_access_token = create_access_token(
            data={"sub": str(supabase_user.id)}, expires_delta=access_token_expires
        )
        logger.info(f"Backend access token created for Supabase user ID: {supabase_user.id}")
        return {"access_token": backend_access_token, "token_type": "bearer"}

    except HTTPException as e: # Re-raise HTTPExceptions directly
        raise e
    except Exception as e:
        logger.error(f"Error during login for {form_data.username}: {e}", exc_info=True)
        # Generic error for unexpected issues
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during login."
        )

@router.post("/register", response_model=UserRead)
async def register_user(user_in: UserCreate):
    logger.info(f"Registration attempt for email: {user_in.email}")
    supabase = get_supabase_client()

    try:
        # Step 1: Create user in Supabase Auth
        # Supabase handles email uniqueness automatically.
        auth_response = supabase.auth.sign_up({
            "email": user_in.email,
            "password": user_in.password,
            "options": {
                "data": { # This data goes into auth.users.raw_user_meta_data
                    "name": user_in.name,
                    "avatar_url": user_in.avatar # Supabase convention for avatar in user_metadata
                }
            }
        })

        if not auth_response.user:
            # Handle cases like user already exists (though Supabase might raise specific errors)
            # or other signup issues.
            logger.warning(f"Supabase user registration failed for {user_in.email}. Error: {auth_response.error}")
            detail_message = "Email already registered or signup failed."
            if auth_response.error and hasattr(auth_response.error, 'message') and "User already registered" in auth_response.error.message:
                 detail_message = "Email already registered."
            elif auth_response.error and hasattr(auth_response.error, 'message'):
                 detail_message = auth_response.error.message

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=detail_message
            )
        
        new_supabase_user = auth_response.user
        logger.info(f"User {user_in.email} registered in Supabase Auth. User ID: {new_supabase_user.id}")

        # Step 2: Create a corresponding profile in the 'profiles' table
        profile_data = {
            "id": new_supabase_user.id, # Primary key, same as auth.users.id
            "email": new_supabase_user.email,
            "name": user_in.name, # Or from new_supabase_user.user_metadata.get('name')
            "avatar": user_in.avatar, # Or from new_supabase_user.user_metadata.get('avatar_url')
            "role": "client", # Default role
            "is_superuser": False # Default superuser status
            # Add any other fields your 'profiles' table requires
        }
        
        profile_insert_response = supabase.table("profiles").insert(profile_data).execute()

        if profile_insert_response.data:
            logger.info(f"Profile created in Supabase 'profiles' table for user ID: {new_supabase_user.id}")
            # Construct UserRead from the profile data + uid
            # UserRead schema expects 'uid' but our table has 'id' for the user ID
            return UserRead(
                uid=profile_data["id"],
                email=profile_data["email"],
                name=profile_data.get("name"),
                avatar=profile_data.get("avatar"),
                role=profile_data.get("role", "client"),
                is_superuser=profile_data.get("is_superuser", False)
            )
        else:
            # This is a critical error: auth user created, but profile creation failed.
            # May require manual cleanup or a retry mechanism in a real-world scenario.
            # For now, log and raise an error.
            logger.error(f"Failed to create profile in Supabase 'profiles' table for user ID: {new_supabase_user.id}. Error: {profile_insert_response.error}")
            # Potentially try to delete the Supabase auth user to avoid orphaned auth users
            # supabase.auth.admin.delete_user(new_supabase_user.id) # Requires admin privileges for the client
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User registration succeeded but profile creation failed. Please contact support."
            )

    except HTTPException as e: # Re-raise HTTPExceptions directly
        raise e
    except Exception as e:
        logger.error(f"Error during registration for {user_in.email}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERRO,
            detail="An unexpected error occurred during registration."
        )

@router.get("/me", response_model=UserRead)
async def read_users_me(current_user: UserRead = Depends(get_current_user)):
    # This endpoint should now work correctly as get_current_user is refactored for Supabase
    return current_user

@router.put("/me/profile", response_model=UserRead)
async def update_my_profile(
    profile_update_data: UserCreate, # Reusing UserCreate for name/avatar, or create a new schema
    current_user: UserRead = Depends(get_current_user)
):
    logger.info(f"Updating profile for user ID: {current_user.uid}")
    supabase = get_supabase_client()
    update_payload = {}
    if profile_update_data.name is not None:
        update_payload["name"] = profile_update_data.name
    if profile_update_data.avatar is not None:
        update_payload["avatar"] = profile_update_data.avatar
    # email cannot be changed here, it's tied to auth.users
    # is_superuser and role cannot be changed by user themselves here

    if not update_payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided.")

    try:
        response = supabase.table("profiles").update(update_payload).eq("id", current_user.uid).execute()
        if response.data:
            logger.info(f"Profile updated for user ID: {current_user.uid}")
            # Refetch the updated profile to return the full UserRead model
            updated_profile_response = supabase.table("profiles").select("id, email, name, avatar, role, is_superuser").eq("id", current_user.uid).single().execute()
            if updated_profile_response.data:
                profile_data = updated_profile_response.data
                return UserRead(
                    uid=profile_data["id"],
                    email=profile_data["email"],
                    name=profile_data.get("name"),
                    avatar=profile_data.get("avatar"),
                    role=profile_data.get("role", "client"),
                    is_superuser=profile_data.get("is_superuser", False)
                )
            else:
                 logger.error(f"Failed to refetch profile after update for user ID: {current_user.uid}")
                 raise HTTPException(status_code=500, detail="Profile updated but failed to retrieve.")
        else:
            logger.error(f"Error updating profile for user ID {current_user.uid}: {response.error}")
            raise HTTPException(status_code=500, detail="Failed to update profile.")
    except Exception as e:
        logger.error(f"Exception updating profile for user ID {current_user.uid}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while updating profile.")

@router.post("/promote-superuser")
async def promote_superuser(
    uid: Optional[str] = Body(None, description="User ID (UID) of the user to promote."),
    email: Optional[str] = Body(None, description="Email of the user to promote."),
    current_admin_user: UserRead = Depends(get_current_user) # Changed to get_current_user, will be checked by require_superuser logic
):
    # First, ensure the requesting user is themselves a superuser
    if not current_admin_user.is_superuser:
        logger.warning(f"User {current_admin_user.uid} (not superuser) attempted to promote user.")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only superusers can promote others.")

    if not uid and not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Either user ID (uid) or email must be provided.")

    logger.info(f"Superuser promotion attempt by {current_admin_user.uid} for user (UID: {uid}, Email: {email})")
    supabase = get_supabase_client()
    target_user_id = uid

    try:
        if not target_user_id and email:
            # Find user ID by email from 'profiles' table (assuming email is unique there too, or take first)
            # Or, for auth users, you might need supabase.auth.admin.list_users() and filter, but that's heavy.
            # Best if profiles.email is reliably synced with auth.users.email.
            profile_by_email_response = supabase.table("profiles").select("id").eq("email", email).maybe_single().execute()
            if profile_by_email_response.data:
                target_user_id = profile_by_email_response.data["id"]
            else:
                logger.warning(f"Promote superuser: No user found with email {email} in profiles table.")
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User with email {email} not found.")
        
        if not target_user_id:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        # Update is_superuser flag in the 'profiles' table
        update_response = supabase.table("profiles").update({"is_superuser": True}).eq("id", target_user_id).execute()

        if update_response.data:
            logger.info(f"User {target_user_id} successfully promoted to superuser by {current_admin_user.uid}.")
            # Optionally, fetch and return the updated user profile
            # For now, just return success
            return {"success": True, "uid": target_user_id, "message": "User promoted to superuser successfully."}
        else:
            logger.error(f"Failed to promote user {target_user_id} to superuser. Error: {update_response.error}")
            # This could happen if the user ID doesn't exist in profiles, even if found by email search earlier
            # Or due to RLS if the service client doesn't have full access (but it should)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update user superuser status.")
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Exception during superuser promotion: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred during superuser promotion.") 
from datetime import datetime, timedelta
from typing import Optional, Annotated, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from backend.app.core.config import settings
from backend.app.core.supabase_client import get_supabase_client, get_current_user_data_from_token
from backend.app.schemas.user import UserRead
import logging

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> UserRead:
    logger.debug(f"[GET_CURRENT_USER] Received token for validation.")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Remove "Bearer " prefix if present
        if token.lower().startswith("bearer "):
            token = token.split(" ", 1)[1]
        
        # Use Supabase to validate the token directly
        supabase = get_supabase_client()
        
        # Try to get user with the provided token
        try:
            user_response = supabase.auth.get_user(token)
            if not user_response or not user_response.user:
                logger.warning("[GET_CURRENT_USER] Invalid Supabase token - no user returned")
                raise credentials_exception
            
            supabase_user = user_response.user
            user_id = supabase_user.id
            logger.debug(f"[GET_CURRENT_USER] Supabase token verified successfully. User ID: {user_id}")
            
        except Exception as e:
            logger.warning(f"[GET_CURRENT_USER] Error verifying Supabase token: {e}")
            raise credentials_exception from e
            
    except Exception as e:
        logger.warning(f"[GET_CURRENT_USER] Error processing token: {e}")
        raise credentials_exception from e

    # Fetch user profile from profiles table with retry logic
    max_retries = 2
    retry_delay = 1  # seconds
    response = None
    
    for attempt in range(max_retries + 1):
        try:
            response = supabase.table("profiles").select("id, email, name, avatar_url, role, is_superuser").eq("id", user_id).maybe_single().execute()
            break  # Success, exit retry loop
        except Exception as e:
            error_msg = str(e).lower()
            is_timeout = any(keyword in error_msg for keyword in ['timeout', 'handshake', 'ssl', 'connection'])
            
            if attempt < max_retries and is_timeout:
                logger.warning(f"[GET_CURRENT_USER] Attempt {attempt + 1} failed with timeout, retrying in {retry_delay}s: {e}")
                import time
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
                continue
            else:
                # Final attempt failed or non-timeout error
                logger.error(f"[GET_CURRENT_USER] Error fetching profile from Supabase for user ID {user_id}: {e}", exc_info=True)
                raise credentials_exception from e
    
    try:
        if not response or not hasattr(response, 'data') or not response.data:
            logger.warning(f"[GET_CURRENT_USER] No profile found in Supabase 'profiles' table for user ID: {user_id}")
            # Create profile from Supabase user data as fallback
            try:
                profile_data = {
                    "id": supabase_user.id,
                    "email": supabase_user.email,
                    "name": supabase_user.user_metadata.get("full_name") or supabase_user.user_metadata.get("name") or supabase_user.email.split('@')[0],
                    "avatar_url": supabase_user.user_metadata.get("avatar_url"),
                    "role": "client",
                    "is_superuser": False
                }
                
                # Try to create the profile
                create_response = supabase.table("profiles").insert(profile_data).execute()
                if create_response.data:
                    logger.info(f"[GET_CURRENT_USER] Created missing profile for user ID: {user_id}")
                    return UserRead(
                        uid=profile_data["id"],
                        email=profile_data["email"],
                        name=profile_data["name"],
                        avatar=profile_data["avatar_url"],
                        role=profile_data["role"],
                        is_superuser=profile_data["is_superuser"]
                    )
                else:
                    # If profile creation fails, return user data from Supabase auth
                    logger.warning(f"[GET_CURRENT_USER] Failed to create profile, using Supabase auth data")
                    return UserRead(
                        uid=supabase_user.id,
                        email=supabase_user.email,
                        name=supabase_user.user_metadata.get("full_name") or supabase_user.user_metadata.get("name") or "User",
                        avatar=supabase_user.user_metadata.get("avatar_url"),
                        role="client",
                        is_superuser=False
                    )
            except Exception as profile_error:
                logger.error(f"[GET_CURRENT_USER] Error creating profile: {profile_error}")
                # Return user data from Supabase auth as final fallback
                return UserRead(
                    uid=supabase_user.id,
                    email=supabase_user.email,
                    name=supabase_user.user_metadata.get("full_name") or supabase_user.user_metadata.get("name") or "User",
                    avatar=supabase_user.user_metadata.get("avatar_url"),
                    role="client",
                    is_superuser=False
                )

        profile_data = response.data
        logger.debug(f"[GET_CURRENT_USER] Fetched profile from Supabase: {profile_data}")
        
        return UserRead(
            uid=profile_data["id"], 
            email=profile_data["email"],
            name=profile_data.get("name"),
            avatar=profile_data.get("avatar_url"),
            role=profile_data.get("role", "client"),
            is_superuser=profile_data.get("is_superuser", False)
        )
    except Exception as e:
        logger.error(f"[GET_CURRENT_USER] Unexpected error in profile processing: {e}", exc_info=True)
        raise credentials_exception from e

def require_superuser(current_user: UserRead = Depends(get_current_user)) -> UserRead:
    logger.debug(f"[REQUIRE_SUPERUSER] Checking superuser status for UID: {current_user.uid}")
    is_super = getattr(current_user, 'is_superuser', False)
    if not is_super and getattr(current_user, 'role', 'client') != 'admin':
        logger.warning(f"[REQUIRE_SUPERUSER] User {current_user.uid} (role: {getattr(current_user, 'role', 'client')}, is_superuser: {is_super}) is NOT a superuser/admin.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superuser or admin privileges required for this action."
        )
    logger.info(f"[REQUIRE_SUPERUSER] User {current_user.uid} (role: {getattr(current_user, 'role', 'client')}, is_superuser: {is_super}) IS a superuser/admin.")
    return current_user 
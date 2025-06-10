from datetime import datetime, timedelta
from typing import Optional, Annotated, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from core.config import settings
from core.supabase_client import get_supabase_client, get_current_user_data_from_token
from schemas.user import UserRead
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
        # Use the helper function to validate token and get user data
        user_data = get_current_user_data_from_token(token)
        
        if not user_data:
            logger.warning("[GET_CURRENT_USER] Invalid token - no user data returned")
            raise credentials_exception
            
        # Handle both JWT payload format (sub) and user object format (id)
        user_id_from_token = user_data.get("id") or user_data.get("sub")
        if not user_id_from_token:
            logger.warning(f"[GET_CURRENT_USER] Token valid but no user ID found. Available keys: {list(user_data.keys())}")
            raise credentials_exception
            
        logger.debug(f"[GET_CURRENT_USER] Token verified successfully. User ID: {user_id_from_token}")
        
    except Exception as e:
        logger.warning(f"[GET_CURRENT_USER] Error verifying token: {e}")
        raise credentials_exception from e

    supabase = get_supabase_client()
    try:
        response = supabase.table("profiles").select("id, email, name, avatar_url, role, is_superuser").eq("id", user_id_from_token).maybe_single().execute()
        
        if not response or not hasattr(response, 'data') or not response.data:
            logger.warning(f"[GET_CURRENT_USER] No profile found in Supabase 'profiles' table for user ID: {user_id_from_token}")
            # Try to get user from auth.users as fallback
            try:
                auth_user_response = supabase.auth.admin.get_user_by_id(user_id_from_token)
                if auth_user_response and auth_user_response.user:
                    logger.info(f"[GET_CURRENT_USER] User {user_id_from_token} found in auth.users, but no profile. Returning with defaults.")
                    return UserRead(
                        uid=auth_user_response.user.id,
                        email=auth_user_response.user.email,
                        name=auth_user_response.user.user_metadata.get("name", "N/A"),
                        is_superuser=False,
                        role="client"
                    )
                else:
                    logger.error(f"[GET_CURRENT_USER] User {user_id_from_token} not found in auth.users either.")
                    raise credentials_exception
            except Exception as auth_error:
                logger.error(f"[GET_CURRENT_USER] Error fetching from auth.users: {auth_error}")
                raise credentials_exception

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
        logger.error(f"[GET_CURRENT_USER] Error fetching profile from Supabase for user ID {user_id_from_token}: {e}", exc_info=True)
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
from firebase_admin import auth, _auth_utils as firebase_auth_utils
from jose import JWTError, jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session
from fastapi import Request, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated
import os
import time
import requests

from app.core.config import settings
from app.db.session import get_db
from app.schemas.user import UserRead # Assuming UserRead can be created from firebase payload
from app.models.user import User as UserModel # Assuming you have a SQLAlchemy model for User

ALGORITHM = "RS256" 
# JWKS_URL will be fetched dynamically if FIREBASE_AUTH_EMULATOR_HOST is not set
# For the emulator, the Admin SDK handles discovery.

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token") # Adjusted tokenUrl if necessary

# Helper to fetch JWKS from Google
def get_jwks_url():
    try:
        # For live Firebase, get keys from Google's discovery endpoint
        jwks_uri_request = requests.get(settings.FIREBASE_JWKS_DISCOVERY_URL, timeout=10)
        jwks_uri_request.raise_for_status()
        return jwks_uri_request.json()["jwks_uri"]
    except requests.exceptions.RequestException as e:
        print(f"Error fetching JWKS discovery URL: {e}")
        # Fallback or fixed URL if necessary, though dynamic is better
        return "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"


_cached_jwks_url = None
_cached_jwks = None
_jwks_last_fetched_time = 0
JWKS_CACHE_TTL_SECONDS = 3600 # Cache JWKS for 1 hour

def get_jwks():
    global _cached_jwks_url, _cached_jwks, _jwks_last_fetched_time
    current_time = time.time()

    if not _cached_jwks_url:
        _cached_jwks_url = get_jwks_url()

    if not _cached_jwks or (current_time - _jwks_last_fetched_time > JWKS_CACHE_TTL_SECONDS):
        try:
            jwks_request = requests.get(_cached_jwks_url, timeout=10)
            jwks_request.raise_for_status()
            _cached_jwks = jwks_request.json()
            _jwks_last_fetched_time = current_time
            print(f"Successfully fetched and cached JWKS from {_cached_jwks_url}")
        except requests.exceptions.RequestException as e:
            print(f"Error fetching JWKS from {_cached_jwks_url}: {e}")
            # If fetching fails, try to use the cached version if available, otherwise raise
            if not _cached_jwks:
                raise HTTPException(status_code=503, detail="Could not fetch JWKS for token validation.")
    return _cached_jwks


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> UserRead:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print(f"[SECURITY EXEC-TEST] ENTERING get_current_user. Token: {token[:30]}...")
        payload = auth.verify_id_token(token, check_revoked=True)
        if payload is None:
            print("[SECURITY EXEC-TEST] Token verification returned None payload.")
            raise credentials_exception
        
        uid = payload.get("uid")
        email = payload.get("email")
        name = payload.get("name")
        role_from_token = payload.get("role")

        if uid is None or email is None:
            print("[SECURITY EXEC-TEST] UID or Email not in token payload.")
            raise credentials_exception

        print(f"[SECURITY EXEC-TEST] Token verified successfully. UID: {uid}, Email: {email}")
        
        user_data_for_schema = {
            "uid": uid,
            "email": email,
            "name": name,
        }
        if payload.get("avatar") is not None:
            user_data_for_schema["avatar"] = payload.get("avatar")
        if role_from_token is not None:
            user_data_for_schema["role"] = role_from_token
        if "is_superuser" in payload:
             user_data_for_schema["is_superuser"] = bool(payload.get("is_superuser"))

        print(f"[SECURITY EXEC-TEST] Data for UserRead: {user_data_for_schema}")
        created_user_read = UserRead(**user_data_for_schema)
        print(f"[SECURITY EXEC-TEST] Successfully created UserRead: {created_user_read.model_dump_json()}")
        return created_user_read

    except firebase_auth_utils.RevokedIdTokenError:
        print("[SECURITY EXEC-TEST] Token revoked.")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked")
    except firebase_auth_utils.UserDisabledError:
        print("[SECURITY EXEC-TEST] User disabled.")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User disabled")
    except firebase_auth_utils.InvalidIdTokenError as e:
        print(f"[SECURITY EXEC-TEST] Invalid ID token: {e}")
        raise credentials_exception
    except Exception as e:
        print(f"[SECURITY EXEC-TEST] Error in get_current_user (Pydantic or other): {type(e).__name__} - {e}")
        if 'user_data_for_schema' in locals():
            print(f"[SECURITY EXEC-TEST] Data causing error: {user_data_for_schema}")
        raise credentials_exception

# ... (rest of the file, like create_access_token, verify_password, get_password_hash) ... 
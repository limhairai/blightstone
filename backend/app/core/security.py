from datetime import datetime, timedelta
from typing import Optional, Annotated, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings
from app.core.firebase import get_firestore
from firebase_admin import auth as firebase_auth
import os
from app.schemas.user import UserRead

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
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> UserRead:
    print(f"[SECURITY_DEBUG GET_CURRENT_USER] Received token: {token[:20]}...")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if os.getenv("FIREBASE_AUTH_EMULATOR_HOST") and token == "test_token_for_emulator":
        print("[SECURITY_DEBUG GET_CURRENT_USER] Using MOCK user for emulator with test_token_for_emulator")
        mock_user_data_with_firestore_fields = {
            "uid": "dev-uid-from-security-py",
            "email": "dev@example.com",
            "name": "Dev User (Emulator)",
            "role": "admin",
            "is_superuser": True,
            "avatar": None
        }
        try:
            return UserRead(**mock_user_data_with_firestore_fields)
        except Exception as e_mock:
            print(f"[SECURITY_DEBUG GET_CURRENT_USER] Error creating UserRead for MOCK user: {e_mock}")
            raise credentials_exception

    try:
        print("[SECURITY_DEBUG GET_CURRENT_USER] Attempting firebase_auth.verify_id_token(token)")
        decoded_token: dict[str, Any] = firebase_auth.verify_id_token(token)
        
        token_uid = decoded_token.get("uid")
        token_email = decoded_token.get("email")
        token_name = decoded_token.get("name")

        print(f"[SECURITY_DEBUG GET_CURRENT_USER] Token verified successfully. UID from token: {token_uid}")
        if token_uid is None:
            print("[SECURITY_DEBUG GET_CURRENT_USER] UID missing in token after verification.")
            raise credentials_exception

        db = get_firestore()
        user_doc_ref = db.collection("users").document(token_uid)
        user_doc = user_doc_ref.get()

        if user_doc.exists:
            firestore_user_data = user_doc.to_dict()
            print(f"[SECURITY_DEBUG GET_CURRENT_USER] Fetched user from Firestore. UID: {token_uid}, Data: {firestore_user_data}")
            
            user_to_return = UserRead(
                uid=token_uid,
                email=firestore_user_data.get("email", token_email),
                name=firestore_user_data.get("name", token_name),
                avatar=firestore_user_data.get("avatar"),
                role=firestore_user_data.get("role", "client"),
                is_superuser=firestore_user_data.get("is_superuser", False)
            )
            print(f"[SECURITY_DEBUG GET_CURRENT_USER] Returning UserRead populated from Firestore: {user_to_return.model_dump_json()}")
            return user_to_return
        else:
            print(f"[SECURITY_DEBUG GET_CURRENT_USER] WARNING: User UID {token_uid} verified by Firebase, but no profile found in Firestore 'users' collection.")
            user_fallback_data = {
                "uid": token_uid,
                "email": token_email,
                "name": token_name,
                "role": "client",
                "is_superuser": False
            }
            print(f"[SECURITY_DEBUG GET_CURRENT_USER] Returning UserRead populated from TOKEN DATA ONLY (no Firestore record): {UserRead(**user_fallback_data).model_dump_json()}")
            return UserRead(**user_fallback_data)

    except firebase_auth.InvalidIdTokenError as e_invalid_token:
        print(f"[SECURITY_DEBUG GET_CURRENT_USER] Invalid ID token: {e_invalid_token}")
        raise credentials_exception
    except firebase_auth.ExpiredIdTokenError as e_expired_token:
        print(f"[SECURITY_DEBUG GET_CURRENT_USER] Expired ID token: {e_expired_token}")
        raise credentials_exception
    except firebase_auth.RevokedIdTokenError as e_revoked_token:
        print(f"[SECURITY_DEBUG GET_CURRENT_USER] Revoked ID token: {e_revoked_token}")
        raise credentials_exception
    except Exception as e_generic:
        print(f"[SECURITY_DEBUG GET_CURRENT_USER] An unexpected error occurred: {type(e_generic).__name__} - {e_generic}")
        raise credentials_exception

def require_superuser(current_user: UserRead = Depends(get_current_user)):
    print(f"[SECURITY_DEBUG REQUIRE_SUPERUSER] Checking superuser status for UID: {current_user.uid}")
    is_super = getattr(current_user, 'is_superuser', False)
    if not is_super and current_user.role != 'admin':
        print(f"[SECURITY_DEBUG REQUIRE_SUPERUSER] User {current_user.uid} (role: {current_user.role}, is_superuser: {is_super}) is NOT a superuser.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superuser privileges required for this action."
        )
    print(f"[SECURITY_DEBUG REQUIRE_SUPERUSER] User {current_user.uid} (role: {current_user.role}, is_superuser: {is_super}) IS a superuser.")
    return current_user 
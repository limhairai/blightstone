from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.core.security import create_access_token, verify_password, get_current_user, get_password_hash
from app.core.config import settings
from app.core.firebase import get_firestore
from app.schemas.auth import Token
from app.schemas.user import UserCreate, UserRead as User
from datetime import datetime, timedelta
from pydantic import BaseModel
import time
from fastapi import Request
import pyotp
import logging

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
logger = logging.getLogger("adhub_app")

class UserProfile(BaseModel):
    uid: str
    email: str
    name: str = ""
    avatar: str = None
    createdAt: datetime = None
    walletBalance: float = 0
    fbUserId: str = None
    is_superuser: bool = False

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    try:
        db = get_firestore()
        user_ref = db.collection('users').where('email', '==', form_data.username).limit(1).get()
        user = user_ref[0] if user_ref else None
        if not user or not verify_password(form_data.password, user.to_dict()['hashed_password']):
            logger.warning(f"Failed login attempt for {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 2FA check
        user_dict = user.to_dict()
        twofa = user_dict.get("twofa", {})
        if twofa.get("enabled"):
            # Try to get 2fa_code from form_data (extra field)
            # OAuth2PasswordRequestForm only supports username/password, so we need to accept it via request.form()
            async def get_request(request: Request):
                return request
            request = await get_request.__wrapped__(Depends())
            form = await request.form()
            code = form.get("2fa_code")
            if not code:
                raise HTTPException(status_code=400, detail="2FA code required.")
            secret = twofa.get("secret")
            totp = pyotp.TOTP(secret)
            if not totp.verify(code):
                raise HTTPException(status_code=400, detail="Invalid 2FA code.")

        logger.info(f"User {form_data.username} logged in successfully")
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.id}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"Error during login for {form_data.username}: {e}")
        raise

@router.post("/register", response_model=User)
async def register_user(user_in: UserCreate):
    try:
        db = get_firestore()
        user_ref = db.collection('users').where('email', '==', user_in.email).limit(1).get()
        user = user_ref[0] if user_ref else None
        if user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        user_data = user_in.dict()
        user_data['hashed_password'] = get_password_hash(user_in.password)
        del user_data['password']
        user_data['created_at'] = datetime.utcnow()
        user_data['is_superuser'] = False  # Never allow superuser via public registration
        user_ref = db.collection('users').add(user_data)
        user_id = user_ref[1].id if isinstance(user_ref, tuple) else user_ref.id if hasattr(user_ref, 'id') else None
        user_data['uid'] = user_id
        logger.info(f"User registered: {user_in.email}")
        return User(**user_data)
    except Exception as e:
        logger.error(f"Error during registration for {user_in.email}: {e}")
        raise

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/user/profile")
async def create_or_update_user_profile(profile: UserProfile):
    db = get_firestore()
    doc_ref = db.collection("users").document(profile.uid)
    data = profile.dict()
    if not data["createdAt"]:
        data["createdAt"] = datetime.utcnow()
    # Never allow is_superuser to be set via this endpoint
    if "is_superuser" in data:
        del data["is_superuser"]
    doc_ref.set(data, merge=True)
    return {"status": "success", "profile": data}

@router.get("/user/profile")
async def get_user_profile(uid: str = Query(...)):
    db = get_firestore()
    doc_ref = db.collection("users").document(uid)
    doc = doc_ref.get()
    if not doc.exists:
        return {"status": "not_found", "profile": None}
    return {"status": "success", "profile": doc.to_dict()}

@router.post("/promote-superuser")
async def promote_superuser(
    uid: str = Body(None),
    email: str = Body(None),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Only superusers can promote others to superuser.")
    db = get_firestore()
    # Find user by uid or email
    user_doc = None
    if uid:
        user_doc = db.collection("users").document(uid).get()
    elif email:
        user_ref = db.collection("users").where("email", "==", email).limit(1).get()
        user_doc = user_ref[0] if user_ref else None
    if not user_doc or not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found.")
    user_data = user_doc.to_dict()
    db.collection("users").document(user_doc.id).update({"is_superuser": True})
    return {"success": True, "uid": user_doc.id, "email": user_data.get("email")} 
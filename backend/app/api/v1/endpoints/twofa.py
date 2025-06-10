from fastapi import APIRouter, Depends, HTTPException, status, Body
# from app.core.firebase import get_firestore  # TODO: Migrate to Supabase
from app.core.security import get_current_user
from pydantic import BaseModel
import pyotp
import qrcode
import io
import base64

router = APIRouter()

class Enable2FARequest(BaseModel):
    code: str
    secret: str

class Verify2FARequest(BaseModel):
    code: str

@router.post("/generate-secret", status_code=200)
async def generate_2fa_secret(current_user=Depends(get_current_user)):
    db = get_firestore()
    user_doc = db.collection("users").document(current_user.uid)
    secret = pyotp.random_base32()
    # Generate QR code for authenticator apps
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=current_user.email, issuer_name="AdHub")
    qr = qrcode.make(uri)
    buf = io.BytesIO()
    qr.save(buf, format="PNG")
    qr_b64 = base64.b64encode(buf.getvalue()).decode()
    return {"secret": secret, "qr": f"data:image/png;base64,{qr_b64}", "uri": uri}

@router.post("/enable", status_code=200)
async def enable_2fa(data: Enable2FARequest, current_user=Depends(get_current_user)):
    db = get_firestore()
    totp = pyotp.TOTP(data.secret)
    if not totp.verify(data.code):
        raise HTTPException(status_code=400, detail="Invalid 2FA code.")
    user_ref = db.collection("users").document(current_user.uid)
    user_ref.update({"twofa": {"enabled": True, "secret": data.secret}})
    return {"detail": "2FA enabled."}

@router.post("/disable", status_code=200)
async def disable_2fa(current_user=Depends(get_current_user)):
    db = get_firestore()
    user_ref = db.collection("users").document(current_user.uid)
    user_ref.update({"twofa": {"enabled": False, "secret": None}})
    return {"detail": "2FA disabled."}

@router.post("/verify", status_code=200)
async def verify_2fa(data: Verify2FARequest, current_user=Depends(get_current_user)):
    db = get_firestore()
    user_doc = db.collection("users").document(current_user.uid).get()
    user = user_doc.to_dict()
    twofa = user.get("twofa", {})
    if not twofa.get("enabled") or not twofa.get("secret"):
        raise HTTPException(status_code=400, detail="2FA not enabled.")
    totp = pyotp.TOTP(twofa["secret"])
    if not totp.verify(data.code):
        raise HTTPException(status_code=400, detail="Invalid 2FA code.")
    return {"detail": "2FA code valid."} 
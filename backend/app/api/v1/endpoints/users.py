from fastapi import APIRouter, Depends, HTTPException, Query, Body
from app.core.security import require_superuser
from app.core.firebase import get_firestore
from pydantic import BaseModel
from typing import List, Optional

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

@router.get("")
def list_users(search: str = Query("", alias="search"), current_user=Depends(require_superuser)):
    db = get_firestore()
    users_ref = db.collection("users")
    if search:
        # Simple search by email or displayName
        users = [doc.to_dict() | {"uid": doc.id} for doc in users_ref.stream() if search.lower() in (doc.to_dict().get("email", "") + doc.to_dict().get("displayName", "")).lower()]
    else:
        users = [doc.to_dict() | {"uid": doc.id} for doc in users_ref.stream()]
    return {"users": users}

@router.post("/{uid}/deactivate")
def deactivate_user(uid: str, current_user=Depends(require_superuser)):
    db = get_firestore()
    user_ref = db.collection("users").document(uid)
    user_ref.update({"active": False})
    return {"success": True}

@router.post("/{uid}/reactivate")
def reactivate_user(uid: str, current_user=Depends(require_superuser)):
    db = get_firestore()
    user_ref = db.collection("users").document(uid)
    user_ref.update({"active": True})
    return {"success": True}

@router.post("/{uid}/reset-password")
def reset_password(uid: str, current_user=Depends(require_superuser)):
    # In a real app, trigger password reset email via Firebase Admin SDK
    return {"success": True, "message": "Password reset email sent (stub)"}

@router.post("/{uid}/impersonate")
def impersonate_user(uid: str, current_user=Depends(require_superuser)):
    # In a real app, set a session/cookie to impersonate the user
    return {"success": True, "message": f"Now impersonating {uid} (stub)"}

@router.post("")
def create_user_profile(profile: UserProfile = Body(...)):
    db = get_firestore()
    print(f"[BACKEND users.py] Received request to create profile for UID: {profile.uid}")
    doc_ref = db.collection("users").document(profile.uid)
    data = profile.dict()
    try:
        print(f"[BACKEND users.py] Attempting to set user profile in Firestore for UID: {profile.uid} with data: {data}")
        doc_ref.set(data, merge=True) # merge=True is fine, acts as upsert
        print(f"[BACKEND users.py] Firestore set call completed for UID: {profile.uid}")
        
        # === ADD READ-AFTER-WRITE CHECK ===
        print(f"[BACKEND users.py] Attempting to read back profile for UID: {profile.uid} immediately after set.")
        try:
            # Use a new DocumentReference for the read, or re-fetch the document snapshot
            # It's generally safer to re-fetch if state might have changed or to confirm persistence
            # For emulator, a direct get() on the same ref should be fine for immediate check
            written_doc = doc_ref.get() # Get the document snapshot
            if written_doc.exists:
                print(f"[BACKEND users.py] SUCCESS: Read-after-write for UID {profile.uid}. Data: {written_doc.to_dict()}")
            else:
                print(f"[BACKEND users.py] FAILURE: Read-after-write for UID {profile.uid}. Document does NOT exist after set!")
        except Exception as read_e:
            print(f"[BACKEND users.py] ERROR during read-after-write for UID {profile.uid}: {read_e}")
        # === END READ-AFTER-WRITE CHECK ===
            
        return {"status": "success", "profile": data}
    except Exception as e:
        print(f"[BACKEND users.py] Firestore ERROR for UID {profile.uid}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{uid}")
def get_user_profile(uid: str):
    db = get_firestore()
    doc_ref = db.collection("users").document(uid)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    return doc.to_dict() | {"uid": doc.id}

@router.get("/{uid}/onboarding")
def get_onboarding_progress(uid: str):
    db = get_firestore()
    doc_ref = db.collection("users").document(uid)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    onboarding = doc.to_dict().get("onboarding")
    if not onboarding:
        return {"steps": [], "currentStep": 0}
    return onboarding

@router.post("/{uid}/onboarding")
def update_onboarding_progress(uid: str, progress: OnboardingProgress):
    db = get_firestore()
    doc_ref = db.collection("users").document(uid)
    doc_ref.set({"onboarding": progress.dict()}, merge=True)
    return {"status": "success", "onboarding": progress.dict()} 
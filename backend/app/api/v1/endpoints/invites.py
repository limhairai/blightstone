from fastapi import APIRouter, HTTPException, status, Depends, Request, Body
from pydantic import BaseModel, EmailStr
# from app.core.firebase import get_firestore  # TODO: Migrate to Supabase
from app.core.security import get_current_user
from datetime import datetime, timedelta
import uuid

router = APIRouter()

class InviteCreate(BaseModel):
    email: EmailStr
    role: str
    orgId: str

INVITE_EXPIRY_DAYS = 7

@router.post("/invite", status_code=201)
async def create_invite(invite: InviteCreate, request: Request, current_user=Depends(get_current_user)):
    db = get_firestore()
    # Check if user is owner or admin in org
    org_user_doc = db.collection("organization_users").document(f"{invite.orgId}_{current_user.uid}").get()
    if not org_user_doc.exists:
        raise HTTPException(status_code=403, detail="Not a member of this organization.")
    user_role = org_user_doc.to_dict().get("role")
    if user_role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to invite users.")
    # Create invite
    token = str(uuid.uuid4())
    invite_data = {
        "email": invite.email,
        "role": invite.role,
        "orgId": invite.orgId,
        "token": token,
        "status": "pending",
        "createdAt": datetime.utcnow(),
        "expiresAt": datetime.utcnow() + timedelta(days=INVITE_EXPIRY_DAYS),
    }
    db.collection("invites").document(token).set(invite_data)
    # Send email (placeholder)
    invite_link = f"{request.base_url}accept-invite?token={token}"
    print(f"Send invite to {invite.email} with link: {invite_link}")
    return {"detail": "Invite sent."}

@router.get("/invites/{org_id}")
async def list_invites(org_id: str, current_user=Depends(get_current_user)):
    db = get_firestore()
    # Only owner/admin can view invites
    org_user_doc = db.collection("organization_users").document(f"{org_id}_{current_user.uid}").get()
    if not org_user_doc.exists:
        raise HTTPException(status_code=403, detail="Not a member of this organization.")
    user_role = org_user_doc.to_dict().get("role")
    if user_role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to view invites.")
    invites = db.collection("invites").where("orgId", "==", org_id).where("status", "==", "pending").stream()
    return [{"email": i.to_dict()["email"], "role": i.to_dict()["role"], "createdAt": i.to_dict()["createdAt"], "expiresAt": i.to_dict()["expiresAt"]} for i in invites]

class AcceptInviteRequest(BaseModel):
    token: str
    name: str
    password: str

@router.post("/accept-invite")
async def accept_invite(data: AcceptInviteRequest):
    db = get_firestore()
    invite_doc = db.collection("invites").document(data.token).get()
    if not invite_doc.exists:
        raise HTTPException(status_code=404, detail="Invite not found.")
    invite = invite_doc.to_dict()
    if invite["status"] != "pending" or invite["expiresAt"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invite expired or already used.")
    # Create user (placeholder, integrate with your user creation logic)
    # user_id = create_user(data.email, data.name, data.password)
    user_id = str(uuid.uuid4())
    # Add user to org
    db.collection("organization_users").document(f"{invite['orgId']}_{user_id}").set({
        "orgId": invite["orgId"],
        "userId": user_id,
        "role": invite["role"],
        "joinedAt": datetime.utcnow(),
    })
    # Mark invite as used
    db.collection("invites").document(data.token).update({"status": "accepted", "acceptedAt": datetime.utcnow()})
    return {"detail": "Invite accepted. Account created.", "userId": user_id}

class UpdateInviteRoleRequest(BaseModel):
    token: str
    new_role: str
    orgId: str

@router.post("/resend", status_code=200)
async def resend_invite(token: str = Body(...), orgId: str = Body(...), current_user=Depends(get_current_user)):
    db = get_firestore()
    # Only owner/admin can resend
    org_user_doc = db.collection("organization_users").document(f"{orgId}_{current_user.uid}").get()
    if not org_user_doc.exists or org_user_doc.to_dict()["role"] not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized.")
    invite_doc = db.collection("invites").document(token).get()
    if not invite_doc.exists:
        raise HTTPException(status_code=404, detail="Invite not found.")
    invite = invite_doc.to_dict()
    if invite["status"] != "pending":
        raise HTTPException(status_code=400, detail="Only pending invites can be resent.")
    # Simulate sending email (replace with real email logic)
    print(f"Resending invite to {invite['email']} for org {invite['orgId']} as {invite['role']}")
    return {"detail": "Invite resent."}

@router.post("/cancel", status_code=200)
async def cancel_invite(token: str = Body(...), orgId: str = Body(...), current_user=Depends(get_current_user)):
    db = get_firestore()
    # Only owner/admin can cancel
    org_user_doc = db.collection("organization_users").document(f"{orgId}_{current_user.uid}").get()
    if not org_user_doc.exists or org_user_doc.to_dict()["role"] not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized.")
    invite_ref = db.collection("invites").document(token)
    invite_doc = invite_ref.get()
    if not invite_doc.exists:
        raise HTTPException(status_code=404, detail="Invite not found.")
    invite = invite_doc.to_dict()
    if invite["status"] != "pending":
        raise HTTPException(status_code=400, detail="Only pending invites can be cancelled.")
    invite_ref.update({"status": "cancelled"})
    return {"detail": "Invite cancelled."}

@router.post("/change-role", status_code=200)
async def change_invite_role(data: UpdateInviteRoleRequest, current_user=Depends(get_current_user)):
    db = get_firestore()
    # Only owner/admin can change role
    org_user_doc = db.collection("organization_users").document(f"{data.orgId}_{current_user.uid}").get()
    if not org_user_doc.exists or org_user_doc.to_dict()["role"] not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized.")
    invite_ref = db.collection("invites").document(data.token)
    invite_doc = invite_ref.get()
    if not invite_doc.exists:
        raise HTTPException(status_code=404, detail="Invite not found.")
    invite = invite_doc.to_dict()
    if invite["status"] != "pending":
        raise HTTPException(status_code=400, detail="Only pending invites can be updated.")
    invite_ref.update({"role": data.new_role})
    return {"detail": "Invite role updated."} 
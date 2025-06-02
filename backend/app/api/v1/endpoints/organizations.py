from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.concurrency import run_in_threadpool
from app.core.firebase import get_firestore
from app.core.security import get_current_user
from app.schemas.user import UserRead as User
from datetime import datetime
from pydantic import BaseModel
from typing import Any, Dict, Annotated
import inspect

router = APIRouter()

class OrganizationOnboarding(BaseModel):
    name: str
    adSpend: Dict[str, Any]
    supportChannel: Dict[str, Any]

@router.post("", status_code=201)
async def create_organization(
    org_payload: OrganizationOnboarding,
    current_user: User = Depends(get_current_user)
):
    db = get_firestore()
    print(f"[BACKEND organizations.py] create_organization called by UID: {current_user.uid} for org name: {org_payload.name}")
    
    org_data_to_create = {
        "name": org_payload.name,
        "createdBy": current_user.uid,
        "owner_uid": current_user.uid,
        "createdAt": datetime.utcnow(),
        "planId": "bronze",
        "onboarding_details": {
            "adSpend": org_payload.adSpend,
            "supportChannel": org_payload.supportChannel,
        },
    }
    
    try:
        def _create_org_in_db():
            print(f"[BACKEND organizations.py] THREAD: Attempting to add organization to Firestore with data: {org_data_to_create}")
            _update_time, _org_doc_ref = db.collection("organizations").add(org_data_to_create)
            _org_id = _org_doc_ref.id
            print(f"[BACKEND organizations.py] THREAD: Organization added with ID: {_org_id}. Timestamp: {_update_time}")

            _org_user_doc_id = f"{_org_id}_{current_user.uid}"
            print(f"[BACKEND organizations.py] THREAD: Attempting to link user {current_user.uid} to org {_org_id} in organization_users")
            db.collection("organization_users").document(_org_user_doc_id).set({
                "orgId": _org_id,
                "userId": current_user.uid,
                "role": "owner",
                "joinedAt": datetime.utcnow(),
            })
            print(f"[BACKEND organizations.py] THREAD: User linked to organization.")
            return _org_id

        org_id = await run_in_threadpool(_create_org_in_db)
        print(f"[BACKEND organizations.py] org_id from threadpool: {org_id}")

        def _get_created_org(_org_id):
            print(f"[BACKEND organizations.py] THREAD: Attempting to fetch created org ID: {_org_id}")
            _created_org_doc = db.collection("organizations").document(_org_id).get()
            if not _created_org_doc.exists:
                print(f"[BACKEND organizations.py] THREAD: Failed to retrieve created org ID: {_org_id}")
                return None
            _response_data = _created_org_doc.to_dict()
            _response_data["id"] = _org_id
            print(f"[BACKEND organizations.py] THREAD: Successfully fetched created org: {_response_data}")
            return _response_data
        
        response_data = await run_in_threadpool(_get_created_org, org_id)

        if response_data is None:
             print(f"[BACKEND organizations.py] Raising HTTPException because response_data is None for org_id: {org_id}")
             raise HTTPException(status_code=500, detail="Failed to retrieve created organization after creation.")

        print(f"[BACKEND organizations.py] Successfully created and retrieved org: {response_data}")
        return response_data

    except Exception as e:
        print(f"[BACKEND organizations.py] Error during organization creation for UID {current_user.uid}: {e}")
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {str(e)}")

@router.get("/", status_code=200)
async def list_organizations(current_user: User = Depends(get_current_user)):
    db = get_firestore()
    org_user_docs = db.collection("organization_users").where("userId", "==", current_user.uid).stream()
    orgs = []
    for org_user in org_user_docs:
        org_user_data = org_user.to_dict()
        org_id = org_user_data["orgId"]
        role = org_user_data.get("role", "member")
        # Fetch org info
        org_doc = db.collection("organizations").document(org_id).get()
        if org_doc.exists:
            org_data = org_doc.to_dict()
            plan_id = org_data.get("planId") or org_data.get("plan") or "bronze"
            orgs.append({
                "id": org_id,
                "name": org_data.get("name"),
                "avatar": org_data.get("avatar"),
                "role": role,
                "planId": plan_id,
            })
    return {"organizations": orgs}

@router.get("/members", status_code=200)
async def list_members(orgId: str, current_user=Depends(get_current_user)):
    db = get_firestore()
    # Only members of org can view
    org_user_doc = db.collection("organization_users").document(f"{orgId}_{current_user.uid}").get()
    if not org_user_doc.exists:
        raise HTTPException(status_code=403, detail="Not a member of this organization.")
    # List all members
    org_users = db.collection("organization_users").where("orgId", "==", orgId).stream()
    members = []
    for u in org_users:
        d = u.to_dict()
        # Optionally fetch user email from users collection
        user_doc = db.collection("users").document(d["userId"]).get()
        email = user_doc.to_dict()["email"] if user_doc.exists else None
        members.append({
            "userId": d["userId"],
            "email": email,
            "role": d["role"],
            "joinedAt": d["joinedAt"],
        })
    return members

class RemoveMemberRequest(BaseModel):
    userId: str
    orgId: str

@router.post("/remove-member", status_code=200)
async def remove_member(data: RemoveMemberRequest, current_user=Depends(get_current_user)):
    db = get_firestore()
    # Only owner/admin can remove, cannot remove self, cannot remove last owner
    org_user_doc = db.collection("organization_users").document(f"{data.orgId}_{current_user.uid}").get()
    if not org_user_doc.exists:
        raise HTTPException(status_code=403, detail="Not a member of this organization.")
    role = org_user_doc.to_dict()["role"]
    if role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to remove members.")
    if data.userId == current_user.uid:
        raise HTTPException(status_code=400, detail="You cannot remove yourself.")
    # Prevent removing last owner
    if role == "owner":
        owners = db.collection("organization_users").where("orgId", "==", data.orgId).where("role", "==", "owner").stream()
        owner_count = sum(1 for _ in owners)
        target_doc = db.collection("organization_users").document(f"{data.orgId}_{data.userId}").get()
        if target_doc.exists and target_doc.to_dict()["role"] == "owner" and owner_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot remove the last owner.")
    db.collection("organization_users").document(f"{data.orgId}_{data.userId}").delete()
    return {"detail": "Member removed."}

@router.get("", status_code=200)
async def list_organizations_noslash(current_user: User = Depends(get_current_user)):
    return await list_organizations(current_user)

@router.get("/{org_id}/members", status_code=200)
async def get_organization_members(org_id: str, current_user=Depends(get_current_user)):
    db = get_firestore()
    # Only members of org can view
    org_user_doc = db.collection("organization_users").document(f"{org_id}_{current_user.uid}").get()
    if not org_user_doc.exists:
        raise HTTPException(status_code=403, detail="Not a member of this organization.")
    # List all members
    org_users = db.collection("organization_users").where("orgId", "==", org_id).stream()
    members = []
    for u in org_users:
        d = u.to_dict()
        # Optionally fetch user email from users collection
        user_doc = db.collection("users").document(d["userId"]).get()
        email = user_doc.to_dict()["email"] if user_doc.exists else None
        members.append({
            "userId": d["userId"],
            "email": email,
            "role": d["role"],
            "joinedAt": d["joinedAt"],
        })
    return members

class LeaveOrganizationRequest(BaseModel):
    orgId: str

@router.post("/leave", status_code=200)
async def leave_organization(data: LeaveOrganizationRequest, current_user=Depends(get_current_user)):
    db = get_firestore()
    org_user_doc = db.collection("organization_users").document(f"{data.orgId}_{current_user.uid}").get()
    if not org_user_doc.exists:
        raise HTTPException(status_code=403, detail="Not a member of this organization.")
    role = org_user_doc.to_dict()["role"]
    # Prevent last owner from leaving
    if role == "owner":
        owners = db.collection("organization_users").where("orgId", "==", data.orgId).where("role", "==", "owner").stream()
        owner_count = sum(1 for _ in owners)
        if owner_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot leave as the last owner. Transfer ownership or promote another member first.")
    db.collection("organization_users").document(f"{data.orgId}_{current_user.uid}").delete()
    return {"detail": "Left organization."}

class DeleteOrganizationRequest(BaseModel):
    orgId: str

@router.post("/delete", status_code=200)
async def delete_organization(data: DeleteOrganizationRequest, current_user=Depends(get_current_user)):
    db = get_firestore()
    org_user_doc = db.collection("organization_users").document(f"{data.orgId}_{current_user.uid}").get()
    if not org_user_doc.exists:
        raise HTTPException(status_code=403, detail="Not a member of this organization.")
    role = org_user_doc.to_dict()["role"]
    if role != "owner":
        raise HTTPException(status_code=403, detail="Only the owner can delete the organization.")
    org_doc = db.collection("organizations").document(data.orgId).get()
    if not org_doc.exists:
        raise HTTPException(status_code=404, detail="Organization not found.")
    org_data = org_doc.to_dict()
    if org_data.get("balance", 0) > 0:
        raise HTTPException(status_code=400, detail="Organization balance must be zero before deletion. Withdraw or consolidate funds first.")
    # Delete all organization_users
    org_users = db.collection("organization_users").where("orgId", "==", data.orgId).stream()
    for u in org_users:
        db.collection("organization_users").document(u.id).delete()
    # Mark ad accounts as available inventory (not deleted)
    ad_accounts = db.collection("adAccounts").where("orgId", "==", data.orgId).stream()
    for ad in ad_accounts:
        db.collection("adAccounts").document(ad.id).update({"orgId": None, "status": "available"})
    # Delete the organization
    db.collection("organizations").document(data.orgId).delete()
    return {"detail": "Organization deleted."}

@router.get("/{org_id}", status_code=200)
async def get_organization(org_id: str, current_user: User = Depends(get_current_user)):
    db = get_firestore()
    # Check if user is a member of the org
    org_user_doc = db.collection("organization_users").document(f"{org_id}_{current_user.uid}").get()
    if not org_user_doc.exists:
        raise HTTPException(status_code=403, detail="Not a member of this organization.")
    org_doc = db.collection("organizations").document(org_id).get()
    if not org_doc.exists:
        raise HTTPException(status_code=404, detail="Organization not found.")
    org_data = org_doc.to_dict()
    org_data["id"] = org_id
    return org_data 
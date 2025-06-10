from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.role import Role
from app.dependencies import get_current_admin_user, get_current_user
from app.db import firestore_db

router = APIRouter()

@router.get("/roles", response_model=List[dict])
def get_roles(org_id: str, current_user=Depends(get_current_user)):
    # Only allow users in the org to view roles
    roles = firestore_db.collection("roles").where("org_id", "==", org_id).stream()
    return [doc.to_dict() for doc in roles]

@router.post("/roles")
def set_role(org_id: str, user_id: str, role: str, permissions: List[str] = None, current_user=Depends(get_current_admin_user)):
    # Only admins can set roles
    role_obj = Role(org_id=org_id, user_id=user_id, role=role, permissions=permissions)
    firestore_db.collection("roles").document(f"{org_id}_{user_id}").set(role_obj.to_dict())
    return {"success": True} 
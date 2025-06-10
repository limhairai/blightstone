from fastapi import APIRouter, HTTPException, Depends, Query
# from app.core.firebase import get_firestore  # TODO: Migrate to Supabase
from app.schemas.group import GroupCreate, GroupUpdate, GroupRead
from app.schemas.user import UserRead as User
from app.core.security import get_current_user
from typing import List
from datetime import datetime

router = APIRouter()

@router.get("", response_model=List[GroupRead])
@router.get("/", response_model=List[GroupRead])
async def list_groups(orgId: str = Query(...), status: str = Query(None), current_user: User = Depends(get_current_user)):
    db = get_firestore()
    query_ref = db.collection("groups").where("orgId", "==", orgId)
    if status:
        query_ref = query_ref.where("status", "==", status)
    docs = query_ref.stream()
    groups = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        groups.append(GroupRead(**data))
    return groups

@router.post("", response_model=GroupRead)
@router.post("/", response_model=GroupRead)
async def create_group(group: GroupCreate, current_user: User = Depends(get_current_user)):
    db = get_firestore()
    now = datetime.utcnow()
    data = group.dict()
    data["createdAt"] = now
    data["updatedAt"] = now
    data["status"] = "pending"  # Always set to pending on creation
    doc_ref = db.collection("groups").document()
    doc_ref.set(data)
    data["id"] = doc_ref.id
    return GroupRead(**data)

@router.put("/{group_id}", response_model=GroupRead)
async def update_group(group_id: str, group: GroupUpdate, current_user: User = Depends(get_current_user)):
    db = get_firestore()
    doc_ref = db.collection("groups").document(group_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Group not found")
    update_data = {k: v for k, v in group.dict(exclude_unset=True).items()}
    update_data["updatedAt"] = datetime.utcnow()
    doc_ref.update(update_data)
    data = doc_ref.get().to_dict()
    data["id"] = group_id
    return GroupRead(**data)

@router.delete("/{group_id}")
async def delete_group(group_id: str, current_user: User = Depends(get_current_user)):
    db = get_firestore()
    doc_ref = db.collection("groups").document(group_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Group not found")
    doc_ref.delete()
    return {"status": "success"}

@router.post("/{group_id}/add-ad-account")
async def add_ad_account_to_group(group_id: str, ad_account_id: str, current_user: User = Depends(get_current_user)):
    db = get_firestore()
    doc_ref = db.collection("groups").document(group_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Group not found")
    data = doc.to_dict()
    adAccountIds = set(data.get("adAccountIds", []))
    adAccountIds.add(ad_account_id)
    doc_ref.update({"adAccountIds": list(adAccountIds), "updatedAt": datetime.utcnow()})
    return {"status": "success"}

@router.post("/{group_id}/remove-ad-account")
async def remove_ad_account_from_group(group_id: str, ad_account_id: str, current_user: User = Depends(get_current_user)):
    db = get_firestore()
    doc_ref = db.collection("groups").document(group_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Group not found")
    data = doc.to_dict()
    adAccountIds = set(data.get("adAccountIds", []))
    adAccountIds.discard(ad_account_id)
    doc_ref.update({"adAccountIds": list(adAccountIds), "updatedAt": datetime.utcnow()})
    return {"status": "success"}

@router.put("/{group_id}/approve", response_model=GroupRead)
async def approve_group(group_id: str, current_user: User = Depends(get_current_user)):
    db = get_firestore()
    doc_ref = db.collection("groups").document(group_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Group not found")
    doc_ref.update({"status": "approved", "updatedAt": datetime.utcnow()})
    data = doc_ref.get().to_dict()
    data["id"] = group_id
    return GroupRead(**data)

@router.put("/{group_id}/reject", response_model=GroupRead)
async def reject_group(group_id: str, current_user: User = Depends(get_current_user)):
    db = get_firestore()
    doc_ref = db.collection("groups").document(group_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Group not found")
    doc_ref.update({"status": "rejected", "updatedAt": datetime.utcnow()})
    data = doc_ref.get().to_dict()
    data["id"] = group_id
    return GroupRead(**data) 
from fastapi import APIRouter, Depends, HTTPException, Query
# from app.core.firebase import get_firestore  # TODO: Migrate to Supabase

router = APIRouter()

@router.get("/orgs")
def list_orgs(search: str = Query("", alias="search"), current_user=Depends(get_current_admin_user)):
    db = get_firestore()
    orgs_ref = db.collection("organizations")
    if search:
        orgs = [doc.to_dict() | {"id": doc.id} for doc in orgs_ref.stream() if search.lower() in doc.to_dict().get("name", "").lower()]
    else:
        orgs = [doc.to_dict() | {"id": doc.id} for doc in orgs_ref.stream()]
    return {"orgs": orgs}

@router.get("/orgs/{org_id}/members")
def get_org_members(org_id: str, current_user=Depends(get_current_admin_user)):
    db = get_firestore()
    org_ref = db.collection("organizations").document(org_id)
    org_doc = org_ref.get()
    if not org_doc.exists:
        raise HTTPException(status_code=404, detail="Org not found")
    org = org_doc.to_dict()
    members = org.get("members", [])
    # Optionally fetch user details for each member
    return {"members": members}

@router.post("/orgs/{org_id}")
def edit_org(org_id: str, data: dict, current_user=Depends(get_current_admin_user)):
    db = get_firestore()
    org_ref = db.collection("organizations").document(org_id)
    org_ref.update(data)
    return {"success": True}

@router.post("/orgs/{org_id}/transfer-ownership")
def transfer_ownership(org_id: str, data: dict, current_user=Depends(get_current_admin_user)):
    db = get_firestore()
    org_ref = db.collection("organizations").document(org_id)
    org_ref.update({"ownerId": data["newOwnerId"]})
    return {"success": True}

@router.post("/orgs/{org_id}/deactivate")
def deactivate_org(org_id: str, current_user=Depends(get_current_admin_user)):
    db = get_firestore()
    org_ref = db.collection("organizations").document(org_id)
    org_ref.update({"active": False})
    return {"success": True} 
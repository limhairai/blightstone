from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from datetime import datetime
from models import AuditLog
from dependencies import get_current_admin_user
from db import firestore_db

router = APIRouter()

@router.get("/audit-logs", response_model=List[dict])
def get_audit_logs(
    org_id: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    current_user=Depends(get_current_admin_user),
):
    # Build Firestore query
    query = firestore_db.collection("audit_logs")
    if org_id:
        query = query.where("org_id", "==", org_id)
    if user_id:
        query = query.where("user_id", "==", user_id)
    if action:
        query = query.where("action", "==", action)
    if start_date:
        query = query.where("timestamp", ">=", start_date)
    if end_date:
        query = query.where("timestamp", "<=", end_date)
    # Order and paginate
    query = query.order_by("timestamp", direction="DESCENDING").offset(skip).limit(limit)
    docs = query.stream()
    logs = [doc.to_dict() for doc in docs]
    return logs 
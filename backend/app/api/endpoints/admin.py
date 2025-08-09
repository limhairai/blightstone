from fastapi import APIRouter, Depends, HTTPException, status
# from app.core.firebase import get_firestore  # TODO: Migrate to Supabase
from app.core.security import get_current_user, require_superuser
from app.schemas.user import UserRead as User
from app.core.supabase_client import get_supabase_client
import logging
from datetime import datetime

router = APIRouter()
logger = logging.getLogger("blightstone_app")

# Legacy endpoint - replaced by Supabase-based admin functionality
# @router.get("/stats")
# async def get_admin_stats(current_user: User = Depends(require_superuser)):
#     # This endpoint has been replaced by the new admin dashboard functionality
#     pass

# Legacy endpoints - replaced by Supabase-based admin functionality
# All admin functionality is now handled through the new Supabase-based endpoints
# and frontend API routes in /frontend/src/app/api/admin/

# @router.get("/clients")
# @router.get("/requests") 
# @router.get("/organizations")
# @router.get("/transactions")
# @router.get("/activity")
# These endpoints have been replaced by the new admin dashboard functionality

# Legacy endpoint - functionality moved to frontend API routes
# This endpoint has been replaced by the new application fulfillment system
# in /frontend/src/app/api/admin/ and the ApplicationAssetBindingDialog component

# @router.post("/fulfill-additional-accounts")
# This functionality is now handled through the new Supabase-based system

# Legacy endpoints - functionality moved to frontend API routes
# These endpoints have been replaced by the new application management system
# in /frontend/src/app/api/admin/ 

# @router.get("/organizations/{organization_id}/business-managers")
# @router.post("/applications/{application_id}/approve")
# @router.post("/applications/{application_id}/reject")
# All application management is now handled through the new Supabase-based system

# Note: All admin functionality is now handled through:
# 1. Frontend API routes in /frontend/src/app/api/admin/
# 2. Dolphin assets endpoints in /backend/app/api/endpoints/dolphin_assets.py
# 3. Admin dashboard components in /frontend/src/components/admin/ 
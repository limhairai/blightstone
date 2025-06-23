"""
Application request endpoints for ad account workflow
Handles client requests for new ad accounts and admin approval process
"""

from fastapi import APIRouter, HTTPException, Depends, Query, status
from backend.app.core.security import get_current_user, require_superuser
from backend.app.core.supabase_client import get_supabase_client
from backend.app.schemas.user import UserRead as User
from backend.app.schemas.application import (
    ApplicationCreate,
    ApplicationRead,
    ApplicationUpdate,
    ApplicationReview,
    ApplicationStats
)
from datetime import datetime, timezone
from typing import List, Optional
import logging
import uuid

router = APIRouter()
logger = logging.getLogger("adhub_app")

# --- Client Endpoints ---

@router.post("", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
async def submit_application_endpoint(
    application: ApplicationCreate,
    current_user: User = Depends(get_current_user)
):
    """Submit a new ad account application"""
    logger.info(f"User {current_user.uid} submitting application for business {application.business_id}")
    supabase = get_supabase_client()
    
    try:
        # Verify user has access to the business
        business_check = (
            supabase.table("businesses")
            .select("id, organization_id, organization_members!inner(user_id)")
            .eq("id", str(application.business_id))
            .eq("organization_members.user_id", str(current_user.uid))
            .maybe_single()
            .execute()
        )
        
        if not business_check.data:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No access to this business")
        
        # Prepare application data
        app_data = application.model_dump(exclude_unset=True)
        app_data["user_id"] = str(current_user.uid)
        app_data["organization_id"] = business_check.data["organization_id"]
        app_data["status"] = "pending"
        
        # Insert application
        app_response = supabase.table("ad_account_applications").insert(app_data).execute()
        
        if not app_response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to submit application")
        
        logger.info(f"Application {app_response.data[0]['id']} submitted successfully")
        return ApplicationRead(**app_response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting application: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to submit application")

@router.get("", response_model=List[ApplicationRead])
async def list_my_applications_endpoint(
    current_user: User = Depends(get_current_user),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """List current user's applications"""
    logger.info(f"User {current_user.uid} listing applications")
    supabase = get_supabase_client()
    
    try:
        query = (
            supabase.table("ad_account_applications")
            .select("*")
            .eq("user_id", str(current_user.uid))
        )
        
        if status_filter:
            query = query.eq("status", status_filter)
        
        query = query.order("submitted_at", desc=True).limit(limit).offset(offset)
        
        response = query.execute()
        
        applications = [ApplicationRead(**app) for app in response.data]
        logger.info(f"Found {len(applications)} applications for user {current_user.uid}")
        return applications
        
    except Exception as e:
        logger.error(f"Error listing applications: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list applications")

@router.get("/{application_id}", response_model=ApplicationRead)
async def get_application_endpoint(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_user)
):
    """Get application details"""
    logger.info(f"User {current_user.uid} fetching application {application_id}")
    supabase = get_supabase_client()
    
    try:
        # Get application and verify access
        app_response = (
            supabase.table("ad_account_applications")
            .select("*")
            .eq("id", str(application_id))
            .eq("user_id", str(current_user.uid))
            .maybe_single()
            .execute()
        )
        
        if not app_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
        
        return ApplicationRead(**app_response.data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching application {application_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch application")

@router.put("/{application_id}", response_model=ApplicationRead)
async def update_application_endpoint(
    application_id: uuid.UUID,
    application_update: ApplicationUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update application (only if pending)"""
    logger.info(f"User {current_user.uid} updating application {application_id}")
    supabase = get_supabase_client()
    
    try:
        # Check if application exists and is pending
        app_check = (
            supabase.table("ad_account_applications")
            .select("status")
            .eq("id", str(application_id))
            .eq("user_id", str(current_user.uid))
            .maybe_single()
            .execute()
        )
        
        if not app_check.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
        
        if app_check.data["status"] != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot update non-pending application")
        
        # Update application
        update_data = application_update.model_dump(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            update_response = (
                supabase.table("ad_account_applications")
                .update(update_data)
                .eq("id", str(application_id))
                .execute()
            )
            
            if not update_response.data:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update application")
            
            return ApplicationRead(**update_response.data[0])
        
        # No changes, return current application
        return ApplicationRead(**app_check.data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating application {application_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update application")

@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application_endpoint(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_user)
):
    """Delete application (only if pending)"""
    logger.info(f"User {current_user.uid} deleting application {application_id}")
    supabase = get_supabase_client()
    
    try:
        # Check if application exists and is pending
        app_check = (
            supabase.table("ad_account_applications")
            .select("status")
            .eq("id", str(application_id))
            .eq("user_id", str(current_user.uid))
            .maybe_single()
            .execute()
        )
        
        if not app_check.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
        
        if app_check.data["status"] != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete non-pending application")
        
        # Delete application
        delete_response = (
            supabase.table("ad_account_applications")
            .delete()
            .eq("id", str(application_id))
            .execute()
        )
        
        if not delete_response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete application")
        
        logger.info(f"Application {application_id} deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting application {application_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete application")

# --- Admin Endpoints ---

@router.get("/admin/all", response_model=List[ApplicationRead], dependencies=[Depends(require_superuser)])
async def admin_list_applications_endpoint(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Admin: List all applications"""
    logger.info("Admin listing all applications")
    supabase = get_supabase_client()
    
    try:
        query = (
            supabase.table("ad_account_applications")
            .select("*, profiles(email, full_name), businesses(name), organizations(name)")
        )
        
        if status_filter:
            query = query.eq("status", status_filter)
        
        query = query.order("submitted_at", desc=True).limit(limit).offset(offset)
        
        response = query.execute()
        
        applications = []
        for app in response.data:
            app_data = ApplicationRead(**app)
            # Add user and business info
            if app.get("profiles"):
                app_data.user_email = app["profiles"].get("email")
                app_data.user_name = app["profiles"].get("full_name")
            if app.get("businesses"):
                app_data.business_name = app["businesses"].get("name")
            if app.get("organizations"):
                app_data.organization_name = app["organizations"].get("name")
            applications.append(app_data)
        
        logger.info(f"Admin found {len(applications)} applications")
        return applications
        
    except Exception as e:
        logger.error(f"Admin error listing applications: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list applications")

@router.put("/admin/{application_id}/review", response_model=ApplicationRead, dependencies=[Depends(require_superuser)])
async def admin_review_application_endpoint(
    application_id: uuid.UUID,
    review: ApplicationReview,
    current_user: User = Depends(get_current_user)
):
    """Admin: Review application (approve/reject)"""
    logger.info(f"Admin {current_user.uid} reviewing application {application_id}")
    supabase = get_supabase_client()
    
    try:
        # Get current application
        app_response = (
            supabase.table("ad_account_applications")
            .select("*")
            .eq("id", str(application_id))
            .maybe_single()
            .execute()
        )
        
        if not app_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
        
        # Prepare update data
        update_data = {
            "status": review.status,
            "admin_notes": review.admin_notes,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if review.status == "approved":
            update_data["approved_by"] = str(current_user.uid)
            update_data["approved_at"] = datetime.now(timezone.utc).isoformat()
            if review.assigned_account_id:
                update_data["assigned_account_id"] = review.assigned_account_id
        elif review.status == "rejected":
            update_data["rejected_by"] = str(current_user.uid)
            update_data["rejected_at"] = datetime.now(timezone.utc).isoformat()
            update_data["rejection_reason"] = review.rejection_reason
        
        # Update application
        update_response = (
            supabase.table("ad_account_applications")
            .update(update_data)
            .eq("id", str(application_id))
            .execute()
        )
        
        if not update_response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update application")
        
        logger.info(f"Application {application_id} reviewed: {review.status}")
        return ApplicationRead(**update_response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin error reviewing application {application_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to review application")

@router.get("/admin/stats", response_model=ApplicationStats, dependencies=[Depends(require_superuser)])
async def admin_get_application_stats_endpoint():
    """Admin: Get application statistics"""
    logger.info("Admin fetching application statistics")
    supabase = get_supabase_client()
    
    try:
        # Use the database view for statistics
        stats_response = supabase.table("application_stats").select("*").maybe_single().execute()
        
        if not stats_response.data:
            # Return empty stats if no data
            return ApplicationStats(
                total_applications=0,
                pending_applications=0,
                under_review_applications=0,
                approved_applications=0,
                rejected_applications=0,
                approval_rate=0.0,
                avg_processing_hours=0.0
            )
        
        stats = stats_response.data
        return ApplicationStats(
            total_applications=stats.get("total_applications", 0),
            pending_applications=stats.get("pending_applications", 0),
            under_review_applications=stats.get("under_review_applications", 0),
            approved_applications=stats.get("approved_applications", 0),
            rejected_applications=stats.get("rejected_applications", 0),
            approval_rate=float(stats.get("approval_rate", 0.0)),
            avg_processing_hours=float(stats.get("avg_processing_hours", 0.0))
        )
        
    except Exception as e:
        logger.error(f"Admin error fetching stats: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch statistics")

# --- Notification Endpoints ---

@router.get("/notifications", response_model=List[dict])
async def get_application_notifications_endpoint(
    current_user: User = Depends(get_current_user),
    unread_only: bool = Query(False, description="Only return unread notifications"),
    limit: int = Query(20, ge=1, le=50)
):
    """Get application notifications for current user"""
    logger.info(f"User {current_user.uid} fetching notifications")
    supabase = get_supabase_client()
    
    try:
        query = (
            supabase.table("application_notifications")
            .select("*")
            .eq("user_id", str(current_user.uid))
        )
        
        if unread_only:
            query = query.eq("read", False)
        
        query = query.order("created_at", desc=True).limit(limit)
        
        response = query.execute()
        
        notifications = response.data
        logger.info(f"Found {len(notifications)} notifications for user {current_user.uid}")
        return notifications
        
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch notifications")

@router.put("/notifications/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_notification_read_endpoint(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user)
):
    """Mark notification as read"""
    logger.info(f"User {current_user.uid} marking notification {notification_id} as read")
    supabase = get_supabase_client()
    
    try:
        update_response = (
            supabase.table("application_notifications")
            .update({"read": True})
            .eq("id", str(notification_id))
            .eq("user_id", str(current_user.uid))
            .execute()
        )
        
        if not update_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
        
        logger.info(f"Notification {notification_id} marked as read")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to mark notification as read") 
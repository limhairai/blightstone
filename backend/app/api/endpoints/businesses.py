from fastapi import APIRouter, Depends, HTTPException, status, Query
from backend.app.core.security import get_current_user, require_superuser
from backend.app.core.supabase_client import get_supabase_client
from backend.app.schemas.user import UserRead as User
from backend.app.schemas.business import (
    BusinessCreate,
    BusinessUpdate, 
    BusinessRead,
    BusinessStatusUpdate,
    BusinessDeleteResponse,
    BusinessManagerAssignment,
    BusinessManagerAssignmentResponse
)
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("", response_model=List[BusinessRead])
async def list_businesses(
    organization_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """List businesses for the current user, optionally filtered by organization and status"""
    logger.info(f"Listing businesses for user {current_user.uid}")
    supabase = get_supabase_client()
    
    try:
        # Build query
        query = supabase.table("businesses").select("*")
        
        if organization_id:
            # Verify user is member of the organization
            member_check = (
                supabase.table("organization_members")
                .select("user_id")
                .eq("organization_id", organization_id)
                .eq("user_id", str(current_user.uid))
                .maybe_single()
                .execute()
            )
            
            if not member_check.data:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not a member of this organization"
                )
            
            query = query.eq("organization_id", organization_id)
        else:
            # Get businesses from all organizations the user is a member of
            user_orgs = (
                supabase.table("organization_members")
                .select("organization_id")
                .eq("user_id", str(current_user.uid))
                .execute()
            )
            
            if not user_orgs.data:
                return []
            
            org_ids = [org["organization_id"] for org in user_orgs.data]
            query = query.in_("organization_id", org_ids)
        
        if status:
            query = query.eq("status", status)
        
        response = query.order("created_at", desc=True).execute()
        
        businesses = [BusinessRead(**business) for business in response.data or []]
        logger.info(f"Found {len(businesses)} businesses for user {current_user.uid}")
        return businesses
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing businesses: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list businesses"
        )

@router.post("", response_model=BusinessRead, status_code=status.HTTP_201_CREATED)
async def create_business(
    business: BusinessCreate,
    organization_id: str = Query(...),
    current_user: User = Depends(get_current_user)
):
    """Create a new business"""
    logger.info(f"Creating business '{business.name}' for user {current_user.uid}")
    supabase = get_supabase_client()
    
    try:
        # Verify user is admin/owner of the organization
        member_check = (
            supabase.table("organization_members")
            .select("role")
            .eq("organization_id", organization_id)
            .eq("user_id", str(current_user.uid))
            .maybe_single()
            .execute()
        )
        
        if not member_check.data or member_check.data["role"] not in ["owner", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to create business"
            )
        
        # Prepare business data
        business_data = business.model_dump(exclude_unset=True)
        business_data.update({
            "user_id": str(current_user.uid),
            "organization_id": organization_id,
            "status": "In Review"
        })
        
        # Insert business
        response = supabase.table("businesses").insert(business_data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create business"
            )
        
        created_business = BusinessRead(**response.data[0])
        logger.info(f"Created business {created_business.id}")
        return created_business
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating business: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create business"
        )

@router.get("/{business_id}", response_model=BusinessRead)
async def get_business(
    business_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific business by ID"""
    logger.info(f"Getting business {business_id} for user {current_user.uid}")
    supabase = get_supabase_client()
    
    try:
        # Get business and verify access
        response = (
            supabase.table("businesses")
            .select("*")
            .eq("id", business_id)
            .single()
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_data = response.data
        
        # Verify user has access to this business's organization
        member_check = (
            supabase.table("organization_members")
            .select("user_id")
            .eq("organization_id", business_data["organization_id"])
            .eq("user_id", str(current_user.uid))
            .maybe_single()
            .execute()
        )
        
        if not member_check.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return BusinessRead(**business_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting business {business_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get business"
        )

@router.put("/{business_id}", response_model=BusinessRead)
async def update_business(
    business_id: str,
    business_update: BusinessUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a business"""
    logger.info(f"Updating business {business_id} for user {current_user.uid}")
    supabase = get_supabase_client()
    
    try:
        # Get business and verify access
        business_response = (
            supabase.table("businesses")
            .select("*")
            .eq("id", business_id)
            .single()
            .execute()
        )
        
        if not business_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_data = business_response.data
        
        # Verify user is admin/owner of the organization
        member_check = (
            supabase.table("organization_members")
            .select("role")
            .eq("organization_id", business_data["organization_id"])
            .eq("user_id", str(current_user.uid))
            .maybe_single()
            .execute()
        )
        
        if not member_check.data or member_check.data["role"] not in ["owner", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to update business"
            )
        
        # Prepare update data
        update_data = business_update.model_dump(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            # Update business
            response = (
                supabase.table("businesses")
                .update(update_data)
                .eq("id", business_id)
                .execute()
            )
            
            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update business"
                )
            
            return BusinessRead(**response.data[0])
        
        return BusinessRead(**business_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating business {business_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update business"
        )

@router.delete("/{business_id}", response_model=BusinessDeleteResponse)
async def delete_business(
    business_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a business"""
    logger.info(f"Deleting business {business_id} for user {current_user.uid}")
    supabase = get_supabase_client()
    
    try:
        # Get business and verify access
        business_response = (
            supabase.table("businesses")
            .select("*")
            .eq("id", business_id)
            .single()
            .execute()
        )
        
        if not business_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_data = business_response.data
        
        # Verify user is admin/owner of the organization
        member_check = (
            supabase.table("organization_members")
            .select("role")
            .eq("organization_id", business_data["organization_id"])
            .eq("user_id", str(current_user.uid))
            .maybe_single()
            .execute()
        )
        
        if not member_check.data or member_check.data["role"] not in ["owner", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to delete business"
            )
        
        # Delete business (cascade will handle related records)
        response = (
            supabase.table("businesses")
            .delete()
            .eq("id", business_id)
            .execute()
        )
        
        logger.info(f"Deleted business {business_id}")
        return BusinessDeleteResponse()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting business {business_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete business"
        )

# Admin endpoints
@router.get("/admin/all", response_model=List[BusinessRead], dependencies=[Depends(require_superuser)])
async def admin_list_all_businesses(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Admin endpoint to list all businesses"""
    logger.info("Admin listing all businesses")
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("businesses").select("*")
        
        if status:
            query = query.eq("status", status)
        
        response = (
            query.order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        
        businesses = [BusinessRead(**business) for business in response.data or []]
        logger.info(f"Admin found {len(businesses)} businesses")
        return businesses
        
    except Exception as e:
        logger.error(f"Admin error listing businesses: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list businesses"
        )

@router.put("/admin/{business_id}/status", response_model=BusinessRead, dependencies=[Depends(require_superuser)])
async def admin_update_business_status(
    business_id: str,
    status_update: BusinessStatusUpdate
):
    """Admin endpoint to update business status"""
    logger.info(f"Admin updating business {business_id} status")
    supabase = get_supabase_client()
    
    try:
        # Prepare update data
        update_data = status_update.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid status or verification provided"
            )
        
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        response = (
            supabase.table("businesses")
            .update(update_data)
            .eq("id", business_id)
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        logger.info(f"Admin updated business {business_id} status")
        return BusinessRead(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin error updating business {business_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update business status"
        )

# Business Manager assignment endpoints
@router.post("/{business_id}/assign-business-manager", response_model=BusinessManagerAssignmentResponse)
async def assign_business_manager(
    business_id: str,
    assignment: BusinessManagerAssignment,
    current_user: User = Depends(get_current_user)
):
    """Assign a Facebook Business Manager to a business"""
    logger.info(f"Assigning BM {assignment.facebook_business_manager_id} to business {business_id}")
    supabase = get_supabase_client()
    
    try:
        # Get business and verify access
        business_response = (
            supabase.table("businesses")
            .select("*")
            .eq("id", business_id)
            .single()
            .execute()
        )
        
        if not business_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_data = business_response.data
        
        # Verify user is admin/owner of the organization OR superuser
        is_superuser = (
            supabase.table("profiles")
            .select("is_superuser")
            .eq("id", str(current_user.uid))
            .single()
            .execute()
        )
        
        member_check = (
            supabase.table("organization_members")
            .select("role")
            .eq("organization_id", business_data["organization_id"])
            .eq("user_id", str(current_user.uid))
            .maybe_single()
            .execute()
        )
        
        has_permission = (
            (is_superuser.data and is_superuser.data.get("is_superuser", False)) or
            (member_check.data and member_check.data["role"] in ["owner", "admin"])
        )
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to assign Business Manager"
            )
        
        # Check if BM is already assigned to another business
        existing_assignment = (
            supabase.table("businesses")
            .select("id, name")
            .eq("facebook_business_manager_id", assignment.facebook_business_manager_id)
            .neq("id", business_id)
            .maybe_single()
            .execute()
        )
        
        if existing_assignment.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Business Manager {assignment.facebook_business_manager_id} is already assigned to business '{existing_assignment.data['name']}'"
            )
        
        # Assign Business Manager
        assigned_at = datetime.now(timezone.utc)
        update_data = {
            "facebook_business_manager_id": assignment.facebook_business_manager_id,
            "facebook_business_manager_name": assignment.facebook_business_manager_name,
            "facebook_business_manager_assigned_at": assigned_at.isoformat(),
            "facebook_business_manager_assigned_by": str(current_user.uid),
            "updated_at": assigned_at.isoformat()
        }
        
        response = (
            supabase.table("businesses")
            .update(update_data)
            .eq("id", business_id)
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to assign Business Manager"
            )
        
        logger.info(f"Successfully assigned BM {assignment.facebook_business_manager_id} to business {business_id}")
        return BusinessManagerAssignmentResponse(
            business_id=business_id,
            facebook_business_manager_id=assignment.facebook_business_manager_id,
            facebook_business_manager_name=assignment.facebook_business_manager_name,
            assigned_at=assigned_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning BM to business {business_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign Business Manager"
        )

@router.delete("/{business_id}/business-manager", response_model=dict)
async def remove_business_manager(
    business_id: str,
    current_user: User = Depends(get_current_user)
):
    """Remove Business Manager assignment from a business"""
    logger.info(f"Removing BM assignment from business {business_id}")
    supabase = get_supabase_client()
    
    try:
        # Get business and verify access (same permission logic as assign)
        business_response = (
            supabase.table("businesses")
            .select("*")
            .eq("id", business_id)
            .single()
            .execute()
        )
        
        if not business_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_data = business_response.data
        
        # Verify permissions
        is_superuser = (
            supabase.table("profiles")
            .select("is_superuser")
            .eq("id", str(current_user.uid))
            .single()
            .execute()
        )
        
        member_check = (
            supabase.table("organization_members")
            .select("role")
            .eq("organization_id", business_data["organization_id"])
            .eq("user_id", str(current_user.uid))
            .maybe_single()
            .execute()
        )
        
        has_permission = (
            (is_superuser.data and is_superuser.data.get("is_superuser", False)) or
            (member_check.data and member_check.data["role"] in ["owner", "admin"])
        )
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to remove Business Manager"
            )
        
        # Remove Business Manager assignment
        update_data = {
            "facebook_business_manager_id": None,
            "facebook_business_manager_name": None,
            "facebook_business_manager_assigned_at": None,
            "facebook_business_manager_assigned_by": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        response = (
            supabase.table("businesses")
            .update(update_data)
            .eq("id", business_id)
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to remove Business Manager"
            )
        
        logger.info(f"Successfully removed BM assignment from business {business_id}")
        return {"status": "success", "message": "Business Manager removed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing BM from business {business_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove Business Manager"
        ) 
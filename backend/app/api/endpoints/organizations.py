from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from fastapi.concurrency import run_in_threadpool
# from backend.app.core.firebase import get_firestore  # TODO: Migrate to Supabase
from backend.app.core.security import get_current_user, require_superuser
from backend.app.core.supabase_client import get_supabase_client
from backend.app.schemas.user import UserRead as User
from backend.app.schemas.organization import (
    OrganizationCreate, 
    OrganizationRead, 
    OrganizationUpdate,
    OrganizationMemberRead,
    UserOrganizationLink # Used for list_organizations response
)
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Any, Dict, Annotated, List, Optional
import inspect
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class OrganizationOnboarding(BaseModel):
    name: str
    adSpend: Dict[str, Any]
    supportChannel: Dict[str, Any]

@router.post("", response_model=OrganizationRead, status_code=status.HTTP_201_CREATED)
async def create_organization_endpoint(
    org_payload: OrganizationCreate,
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Attempting to create organization '{org_payload.name}' by user {current_user.uid}")
    supabase = get_supabase_client()

    # Prepare organization data for insertion
    org_data_to_create = org_payload.model_dump(exclude_unset=True)
    
    # Ensure owner_id is set correctly from current_user if creator_user_id isn't explicitly in payload
    # (though creator_user_id in schema is usually set to current_user.uid by calling code or default in endpoint)
    # The DB column is owner_id.
    if org_payload.creator_user_id:
        org_data_to_create["owner_id"] = str(org_payload.creator_user_id)
    else:
        # This case should ideally not be hit if creator_user_id is always populated by endpoint/service layer
        org_data_to_create["owner_id"] = str(current_user.uid) 
    
    # Remove creator_user_id if it was a DTO-only field and owner_id is the target DB column
    if "creator_user_id" in org_data_to_create:
        del org_data_to_create["creator_user_id"]

    org_data_to_create["verification_status"] = "pending_review" # Default status

    # Fields from OrganizationBase (now in OrganizationCreate) that map directly to DB columns:
    # name is already included by model_dump if set
    # landing_page_url, industry, description, ad_spend_monthly, support_channel_type, 
    # support_channel_contact, avatar_url, plan_id are also included if set in org_payload
    # and present in org_data_to_create due to model_dump(exclude_unset=True).
    # No specific mapping needed here IF Pydantic schema field names match DB column names.
    
    # Ensure all required DB fields are present or have defaults in DB.
    # Supabase typically handles created_at/updated_at with defaults or triggers.

    try:
        # Insert into 'organizations' table
        org_insert_response = supabase.table("organizations").insert(org_data_to_create).execute()

        if not org_insert_response.data:
            logger.error(f"Failed to insert organization into DB. Payload: {org_data_to_create}, Error: {org_insert_response.error}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not create organization.")
        
        created_org_data = org_insert_response.data[0]
        org_id = created_org_data["id"]
        logger.debug(f"Organization '{org_payload.name}' created with ID: {org_id} by user {current_user.uid}")

        # Link the creator as the owner in 'organization_members' junction table
        org_user_data = {
            "organization_id": str(org_id),
            "user_id": str(current_user.uid),
            "role": "owner",
            # "joined_at": datetime.now(timezone.utc) # Supabase can default this
        }
        org_user_insert_response = supabase.table("organization_members").insert(org_user_data).execute()

        if not org_user_insert_response.data:
            logger.error(f"Failed to link owner {current_user.uid} to new organization {org_id}. Error: {org_user_insert_response.error}")
            # Potentially rollback organization creation or mark for cleanup
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Organization created, but failed to assign owner.")
        
        logger.debug(f"User {current_user.uid} linked as owner to organization {org_id}")
        
        # Return the created organization data using OrganizationRead schema
        # The 'created_org_data' from insert might not have all fields or correct types for OrganizationRead
        # (e.g., created_at might be a string). It's safer to re-fetch or carefully map.
        # For simplicity here, we'll assume the insert response is sufficient if keys match.
        # A more robust approach is to fetch the newly created org by its ID.

        return OrganizationRead(**created_org_data) # Ensure all fields for OrganizationRead are present

    except HTTPException as e:
        raise e # Re-raise FastAPI HTTP exceptions
    except Exception as e:
        logger.error(f"Unexpected error creating organization '{org_payload.name}' for user {current_user.uid}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An internal server error occurred: {str(e)}")

@router.get("", response_model=List[UserOrganizationLink])
async def list_my_organizations_endpoint(current_user: User = Depends(get_current_user)):
    logger.debug(f"Fetching organizations for user: {current_user.uid}")
    supabase = get_supabase_client()
    try:
        # Fetch organization memberships for the current user from 'organization_members'
        # Then join with 'organizations' table to get organization names
        # The RPC call `get_user_organizations` simplifies this if it exists and does the join.
        # Direct query:
        response = (
            supabase.table("organization_members")
            .select("role, organizations(id, name)") # Supabase join syntax
            .eq("user_id", str(current_user.uid))
            .execute()
        )

        user_org_links = []
        if response.data:
            for item in response.data:
                if item.get('organizations'): # Check if the joined organization data exists
                    org_data = item['organizations'] # This will be an object if one-to-one, or list if many
                    if isinstance(org_data, dict): # Ensure it's a dict (single org)
                        user_org_links.append(UserOrganizationLink(
                            organization_id=org_data['id'],
                            organization_name=org_data['name'],
                            user_role_in_org=item['role']
                        ))
                    # If 'organizations' could be a list (e.g. if relationship was misdefined as many-to-many from user perspective)
                    # you might need to iterate or adjust the query.
                    # For typical org_users, this join should yield one org per membership record.
        
        logger.debug(f"Found {len(user_org_links)} organizations for user {current_user.uid}")
        return user_org_links

    except Exception as e:
        logger.error(f"Unexpected error fetching organizations for user {current_user.uid}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")

@router.get("/{org_id}", response_model=OrganizationRead)
async def get_organization_details_endpoint(
    org_id: uuid.UUID, 
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Fetching details for organization {org_id} by user {current_user.uid}")
    supabase = get_supabase_client()
    try:
        # First, verify the current user is a member of this organization
        member_check_response = (
            supabase.table("organization_members")
            .select("user_id")
            .eq("organization_id", str(org_id))
            .eq("user_id", str(current_user.uid))
            .maybe_single() # Expect one or none
            .execute()
        )

        if not member_check_response.data:
            logger.warning(f"User {current_user.uid} attempted to access org {org_id} but is not a member.")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization or organization does not exist.")

        # If member, fetch organization details
        org_response = (
            supabase.table("organizations")
            .select("*" ) # Select all columns or specify for OrganizationRead
            .eq("id", str(org_id))
            .single() # Expect exactly one
            .execute()
        )

        if not org_response.data:
            logger.warning(f"Organization {org_id} not found, though user {current_user.uid} is listed as member (potential data inconsistency).")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")
        
        logger.info(f"Successfully fetched details for organization {org_id}")
        return OrganizationRead(**org_response.data)

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error fetching organization {org_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")

# --- Admin Endpoints for Organization Management ---

class AdminOrganizationFilterParams(BaseModel):
    verification_status: Optional[str] = Query(None, description="Filter by verification status (e.g., 'pending_review', 'approved', 'rejected')")
    limit: int = Query(50, ge=1, le=100)
    offset: int = Query(0, ge=0)

@router.get("/admin/all", response_model=List[OrganizationRead], dependencies=[Depends(require_superuser)])
async def admin_list_all_organizations_endpoint(
    filters: AdminOrganizationFilterParams = Depends() # Use Pydantic model for query params
):
    logger.info(f"Admin request to list organizations with filters: {filters}")
    supabase = get_supabase_client()
    try:
        query = supabase.table("organizations").select("*") # Adjust columns as needed for OrganizationRead
        
        if filters.verification_status:
            query = query.eq("verification_status", filters.verification_status)
        
        query = query.limit(filters.limit).offset(filters.offset).order("created_at", desc=True)
        
        response = query.execute()

        if response.error:
            logger.error(f"Admin: Error fetching organizations: {response.error.message}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch organizations.")
        
        orgs = [OrganizationRead(**org_data) for org_data in response.data]
        logger.info(f"Admin: Successfully fetched {len(orgs)} organizations.")
        return orgs

    except Exception as e:
        logger.error(f"Admin: Unexpected error fetching organizations: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")

class OrganizationStatusUpdatePayload(BaseModel):
    verification_status: str # e.g., "approved", "rejected"
    # admin_notes: Optional[str] = None # Example: if you want to store reason for status change

@router.put("/admin/{org_id}/status", response_model=OrganizationRead, dependencies=[Depends(require_superuser)])
async def admin_update_organization_status_endpoint(
    org_id: uuid.UUID,
    payload: OrganizationStatusUpdatePayload,
):
    logger.info(f"Admin request to update status of organization {org_id} to '{payload.verification_status}'")
    supabase = get_supabase_client()

    # Validate verification_status value if needed
    allowed_statuses = ["pending_review", "approved", "rejected", "needs_more_info"]
    if payload.verification_status not in allowed_statuses:
        logger.warning(f"Admin: Invalid verification status provided: {payload.verification_status}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status. Must be one of {allowed_statuses}")

    try:
        update_data = {"verification_status": payload.verification_status, "updated_at": datetime.now(timezone.utc).isoformat()}
        # if payload.admin_notes: update_data["admin_notes"] = payload.admin_notes

        response = (
            supabase.table("organizations")
            .update(update_data)
            .eq("id", str(org_id))
            .execute()
        )

        if not response.data: # Update returns data on success
            logger.error(f"Admin: Failed to update status for organization {org_id}. Error: {getattr(response.error, 'message', 'Unknown error')}")
            # Check if org exists before claiming update failed
            check_org = supabase.table("organizations").select("id").eq("id", str(org_id)).maybe_single().execute()
            if not check_org.data:
                 raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Organization with ID {org_id} not found.")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update organization status.")

        updated_org_data = response.data[0]
        logger.info(f"Admin: Successfully updated status for organization {org_id} to {payload.verification_status}")
        return OrganizationRead(**updated_org_data)

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Admin: Unexpected error updating status for org {org_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")

# Placeholder for Member Management - these would need similar refactoring
# For example:
# @router.post("/{org_id}/members", response_model=OrganizationMemberRead, status_code=status.HTTP_201_CREATED)
# async def add_member_to_organization(org_id: uuid.UUID, member_payload: OrganizationMemberCreate, current_user: UserRead = Depends(get_current_user)):
#     # Check if current_user is admin/owner of org_id
#     # Add member to organization_members table
#     pass

# @router.delete("/{org_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def remove_member_from_organization(org_id: uuid.UUID, user_id: uuid.UUID, current_user: UserRead = Depends(get_current_user)):
#     # Check if current_user is admin/owner of org_id
#     # Check constraints (not last owner, not self if not allowed)
#     # Remove member from organization_members table
#     pass

# Note: The old catch-all OrganizationOnboarding model is replaced by OrganizationCreate.
# Other specific request models like RemoveMemberRequest can be defined here or in schemas/organization.py 

# --- Financial Management Endpoints ---

@router.get("/{org_id}/balance", response_model=Dict[str, Any])
async def get_organization_balance_endpoint(
    org_id: uuid.UUID,
    current_user: User = Depends(get_current_user)
):
    """Get organization balance and financial summary"""
    logger.info(f"Fetching balance for organization {org_id} by user {current_user.uid}")
    supabase = get_supabase_client()
    
    try:
        # Verify user is member of organization
        member_check = (
            supabase.table("organization_members")
            .select("role")
            .eq("organization_id", str(org_id))
            .eq("user_id", str(current_user.uid))
            .maybe_single()
            .execute()
        )
        
        if not member_check.data:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization")
        
        # Get financial summary using the database function
        summary_response = supabase.rpc('get_organization_financial_summary', {'org_id': str(org_id)}).execute()
        
        if not summary_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
        
        summary = summary_response.data[0]
        
        return {
            "organization_id": str(org_id),
            "balance": float(summary.get('balance', 0)),
            "total_spent": float(summary.get('total_spent', 0)),
            "monthly_spent": float(summary.get('monthly_spent', 0)),
            "total_accounts": summary.get('total_accounts', 0),
            "active_accounts": summary.get('active_accounts', 0),
            "total_account_balance": float(summary.get('total_account_balance', 0))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching balance for org {org_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch balance")

class BalanceUpdateRequest(BaseModel):
    amount: float
    operation: str = "add"  # "add" or "subtract"
    description: Optional[str] = None

@router.post("/{org_id}/balance/update", response_model=Dict[str, Any])
async def update_organization_balance_endpoint(
    org_id: uuid.UUID,
    request: BalanceUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update organization balance (admin only)"""
    logger.info(f"Updating balance for organization {org_id} by user {current_user.uid}")
    supabase = get_supabase_client()
    
    try:
        # Verify user is admin/owner of organization
        member_check = (
            supabase.table("organization_members")
            .select("role")
            .eq("organization_id", str(org_id))
            .eq("user_id", str(current_user.uid))
            .execute()
        )
        
        if not member_check.data or member_check.data[0]['role'] not in ['owner', 'admin']:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
        
        # Update balance using database function
        new_balance_response = supabase.rpc('update_organization_balance', {
            'org_id': str(org_id),
            'amount': request.amount,
            'operation': request.operation
        }).execute()
        
        if new_balance_response.error:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(new_balance_response.error.message))
        
        new_balance = new_balance_response.data
        
        # Log the transaction
        transaction_data = {
            "organization_id": str(org_id),
            "amount": request.amount if request.operation == "add" else -request.amount,
            "type": "manual_adjustment",
            "description": request.description or f"Manual balance {request.operation}",
            "status": "completed",
            "processed_by": str(current_user.uid)
        }
        
        supabase.table("transactions").insert(transaction_data).execute()
        
        return {
            "organization_id": str(org_id),
            "new_balance": float(new_balance),
            "operation": request.operation,
            "amount": request.amount,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating balance for org {org_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update balance")

# --- Member Management Endpoints ---

class AddMemberRequest(BaseModel):
    email: str
    role: str = "member"  # "owner", "admin", "member"

@router.post("/{org_id}/members", response_model=OrganizationMemberRead)
async def add_member_to_organization_endpoint(
    org_id: uuid.UUID,
    request: AddMemberRequest,
    current_user: User = Depends(get_current_user)
):
    """Add a member to organization (admin/owner only)"""
    logger.info(f"Adding member {request.email} to organization {org_id}")
    supabase = get_supabase_client()
    
    try:
        # Check if current user is admin/owner
        member_check = (
            supabase.table("organization_members")
            .select("role")
            .eq("organization_id", str(org_id))
            .eq("user_id", str(current_user.uid))
            .execute()
        )
        
        if not member_check.data or member_check.data[0]['role'] not in ['owner', 'admin']:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
        
        # Find user by email
        user_response = (
            supabase.table("profiles")
            .select("id, email, full_name")
            .eq("email", request.email)
            .maybe_single()
            .execute()
        )
        
        if not user_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        user_to_add = user_response.data
        
        # Check if user is already a member
        existing_member = (
            supabase.table("organization_members")
            .select("id")
            .eq("organization_id", str(org_id))
            .eq("user_id", user_to_add['id'])
            .maybe_single()
            .execute()
        )
        
        if existing_member.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a member")
        
        # Add member
        member_data = {
            "organization_id": str(org_id),
            "user_id": user_to_add['id'],
            "role": request.role
        }
        
        member_response = supabase.table("organization_members").insert(member_data).execute()
        
        if not member_response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to add member")
        
        return OrganizationMemberRead(
            id=member_response.data[0]['id'],
            user_id=user_to_add['id'],
            organization_id=str(org_id),
            role=request.role,
            user_email=user_to_add['email'],
            user_name=user_to_add.get('full_name', ''),
            joined_at=member_response.data[0]['joined_at']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding member to org {org_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to add member")

@router.get("/{org_id}/members", response_model=List[OrganizationMemberRead])
async def list_organization_members_endpoint(
    org_id: uuid.UUID,
    current_user: User = Depends(get_current_user)
):
    """List organization members"""
    logger.info(f"Listing members for organization {org_id}")
    supabase = get_supabase_client()
    
    try:
        # Verify user is member
        member_check = (
            supabase.table("organization_members")
            .select("role")
            .eq("organization_id", str(org_id))
            .eq("user_id", str(current_user.uid))
            .maybe_single()
            .execute()
        )
        
        if not member_check.data:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization")
        
        # Get all members with user details
        members_response = (
            supabase.table("organization_members")
            .select("id, user_id, role, joined_at, profiles(email, full_name)")
            .eq("organization_id", str(org_id))
            .execute()
        )
        
        members = []
        for member in members_response.data:
            profile = member.get('profiles', {})
            members.append(OrganizationMemberRead(
                id=member['id'],
                user_id=member['user_id'],
                organization_id=str(org_id),
                role=member['role'],
                user_email=profile.get('email', ''),
                user_name=profile.get('full_name', ''),
                joined_at=member['joined_at']
            ))
        
        return members
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing members for org {org_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list members")

@router.delete("/{org_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member_from_organization_endpoint(
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user)
):
    """Remove member from organization (admin/owner only)"""
    logger.info(f"Removing member {user_id} from organization {org_id}")
    supabase = get_supabase_client()
    
    try:
        # Check if current user is admin/owner
        member_check = (
            supabase.table("organization_members")
            .select("role")
            .eq("organization_id", str(org_id))
            .eq("user_id", str(current_user.uid))
            .execute()
        )
        
        if not member_check.data or member_check.data[0]['role'] not in ['owner', 'admin']:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
        
        # Check if target user is a member
        target_member = (
            supabase.table("organization_members")
            .select("role")
            .eq("organization_id", str(org_id))
            .eq("user_id", str(user_id))
            .maybe_single()
            .execute()
        )
        
        if not target_member.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
        
        # Prevent removing the last owner
        if target_member.data['role'] == 'owner':
            owner_count = (
                supabase.table("organization_members")
                .select("id")
                .eq("organization_id", str(org_id))
                .eq("role", "owner")
                .execute()
            )
            
            if len(owner_count.data) <= 1:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove the last owner")
        
        # Remove member
        remove_response = (
            supabase.table("organization_members")
            .delete()
            .eq("organization_id", str(org_id))
            .eq("user_id", str(user_id))
            .execute()
        )
        
        if not remove_response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to remove member")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing member {user_id} from org {org_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to remove member")

# --- Organization Update Endpoint ---

@router.put("/{org_id}", response_model=OrganizationRead)
async def update_organization_endpoint(
    org_id: uuid.UUID,
    org_update: OrganizationUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update organization details (admin/owner only)"""
    logger.info(f"Updating organization {org_id} by user {current_user.uid}")
    supabase = get_supabase_client()
    
    try:
        # Check if current user is admin/owner
        member_check = (
            supabase.table("organization_members")
            .select("role")
            .eq("organization_id", str(org_id))
            .eq("user_id", str(current_user.uid))
            .execute()
        )
        
        if not member_check.data or member_check.data[0]['role'] not in ['owner', 'admin']:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
        
        # Prepare update data
        update_data = org_update.model_dump(exclude_unset=True)
        if update_data:
            update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
            
            # Update organization
            update_response = (
                supabase.table("organizations")
                .update(update_data)
                .eq("id", str(org_id))
                .execute()
            )
            
            if not update_response.data:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update organization")
            
            return OrganizationRead(**update_response.data[0])
        else:
            # No changes, return current org
            org_response = (
                supabase.table("organizations")
                .select("*")
                .eq("id", str(org_id))
                .single()
                .execute()
            )
            return OrganizationRead(**org_response.data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating org {org_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update organization") 
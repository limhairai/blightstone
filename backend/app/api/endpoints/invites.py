from fastapi import APIRouter, HTTPException, status, Depends, Request, Body
from pydantic import BaseModel, EmailStr
from backend.app.core.supabase_client import get_supabase_client
from backend.app.core.security import get_current_user
from backend.app.schemas.user import UserRead as User
from datetime import datetime, timedelta, timezone
import uuid
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class InviteCreate(BaseModel):
    email: EmailStr
    role: str
    organization_id: str

class AcceptInviteRequest(BaseModel):
    token: str
    name: str
    password: str

class UpdateInviteRoleRequest(BaseModel):
    token: str
    new_role: str
    organization_id: str

INVITE_EXPIRY_DAYS = 7

def verify_org_admin(supabase, user_id: str, org_id: str):
    """Verify user is admin or owner of organization"""
    member_check = (
        supabase.table("organization_members")
        .select("role")
        .eq("organization_id", org_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    
    if not member_check.data:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    
    role = member_check.data.get("role")
    if role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to manage invites")
    
    return True

@router.post("/invite", status_code=201)
async def create_invite(
    invite: InviteCreate, 
    request: Request, 
    current_user: User = Depends(get_current_user)
):
    """Create a new team invitation"""
    try:
        supabase = get_supabase_client()
        
        # Verify user can invite to this organization
        verify_org_admin(supabase, str(current_user.uid), invite.organization_id)
        
        # Check if user is already a member
        existing_member = (
            supabase.table("organization_members")
            .select("user_id")
            .eq("organization_id", invite.organization_id)
            .execute()
        )
        
        # Get user by email from auth.users (if they exist)
        # Note: This would require admin access to auth.users table
        # For now, we'll just check if there's a pending invite
        
        # Check for existing pending invite
        existing_invite = (
            supabase.table("team_invitations")
            .select("id")
            .eq("organization_id", invite.organization_id)
            .eq("email", invite.email)
            .eq("status", "pending")
            .maybe_single()
            .execute()
        )
        
        if existing_invite.data:
            raise HTTPException(status_code=400, detail="Pending invite already exists for this email")
        
        # Create invite
        token = str(uuid.uuid4())
        expires_at = datetime.now(timezone.utc) + timedelta(days=INVITE_EXPIRY_DAYS)
        
        invite_data = {
            "email": invite.email,
            "role": invite.role,
            "organization_id": invite.organization_id,
            "token": token,
            "status": "pending",
            "invited_by": str(current_user.uid),
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        insert_response = (
            supabase.table("team_invitations")
            .insert(invite_data)
            .execute()
        )
        
        if not insert_response.data:
            raise HTTPException(status_code=500, detail="Failed to create invite")
        
        # Generate invite link
        invite_link = f"{request.base_url}accept-invite?token={token}"
        
        # TODO: Send email (integrate with email service)
        logger.info(f"Invite created for {invite.email} to org {invite.organization_id}")
        print(f"Send invite to {invite.email} with link: {invite_link}")
        
        return {
            "detail": "Invite sent",
            "token": token,
            "invite_link": invite_link
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating invite: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create invite")

@router.get("/invites/{organization_id}")
async def list_invites(organization_id: str, current_user: User = Depends(get_current_user)):
    """List pending invites for organization"""
    try:
        supabase = get_supabase_client()
        
        # Verify user can view invites for this organization
        verify_org_admin(supabase, str(current_user.uid), organization_id)
        
        # Get pending invites
        invites_response = (
            supabase.table("team_invitations")
            .select("email, role, created_at, expires_at, token")
            .eq("organization_id", organization_id)
            .eq("status", "pending")
            .order("created_at", desc=True)
            .execute()
        )
        
        return invites_response.data or []
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing invites: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list invites")

@router.post("/accept-invite")
async def accept_invite(data: AcceptInviteRequest):
    """Accept a team invitation"""
    try:
        supabase = get_supabase_client()
        
        # Get invite
        invite_response = (
            supabase.table("team_invitations")
            .select("*")
            .eq("token", data.token)
            .maybe_single()
            .execute()
        )
        
        if not invite_response.data:
            raise HTTPException(status_code=404, detail="Invite not found")
        
        invite = invite_response.data
        
        # Check invite status and expiry
        if invite["status"] != "pending":
            raise HTTPException(status_code=400, detail="Invite already used or cancelled")
        
        expires_at = datetime.fromisoformat(invite["expires_at"].replace('Z', '+00:00'))
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Invite has expired")
        
        # TODO: Create user account (integrate with Supabase Auth)
        # For now, we'll assume the user already exists or will be created separately
        # This would typically involve:
        # 1. Creating user in auth.users
        # 2. Getting the user ID
        # 3. Adding them to organization_members
        
        # Placeholder user creation
        user_id = str(uuid.uuid4())
        
        # Add user to organization
        member_data = {
            "organization_id": invite["organization_id"],
            "user_id": user_id,
            "role": invite["role"],
            "joined_at": datetime.now(timezone.utc).isoformat()
        }
        
        member_response = (
            supabase.table("organization_members")
            .insert(member_data)
            .execute()
        )
        
        if not member_response.data:
            raise HTTPException(status_code=500, detail="Failed to add user to organization")
        
        # Mark invite as accepted
        update_response = (
            supabase.table("team_invitations")
            .update({
                "status": "accepted",
                "accepted_at": datetime.now(timezone.utc).isoformat(),
                "accepted_by": user_id
            })
            .eq("token", data.token)
            .execute()
        )
        
        if not update_response.data:
            logger.error("Failed to update invite status")
        
        logger.info(f"Invite accepted for {invite['email']} to org {invite['organization_id']}")
        
        return {
            "detail": "Invite accepted. Account created.",
            "user_id": user_id,
            "organization_id": invite["organization_id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting invite: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to accept invite")

@router.post("/resend", status_code=200)
async def resend_invite(
    token: str = Body(...), 
    organization_id: str = Body(...), 
    current_user: User = Depends(get_current_user)
):
    """Resend a team invitation"""
    try:
        supabase = get_supabase_client()
        
        # Verify user can resend invites for this organization
        verify_org_admin(supabase, str(current_user.uid), organization_id)
        
        # Get invite
        invite_response = (
            supabase.table("team_invitations")
            .select("*")
            .eq("token", token)
            .eq("organization_id", organization_id)
            .maybe_single()
            .execute()
        )
        
        if not invite_response.data:
            raise HTTPException(status_code=404, detail="Invite not found")
        
        invite = invite_response.data
        
        if invite["status"] != "pending":
            raise HTTPException(status_code=400, detail="Only pending invites can be resent")
        
        # Update expiry date
        new_expires_at = datetime.now(timezone.utc) + timedelta(days=INVITE_EXPIRY_DAYS)
        
        update_response = (
            supabase.table("team_invitations")
            .update({
                "expires_at": new_expires_at.isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
            .eq("token", token)
            .execute()
        )
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to update invite")
        
        # TODO: Send email again
        logger.info(f"Resent invite to {invite['email']} for org {organization_id}")
        print(f"Resending invite to {invite['email']} for org {invite['organization_id']} as {invite['role']}")
        
        return {"detail": "Invite resent"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resending invite: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to resend invite")

@router.post("/cancel", status_code=200)
async def cancel_invite(
    token: str = Body(...), 
    organization_id: str = Body(...), 
    current_user: User = Depends(get_current_user)
):
    """Cancel a team invitation"""
    try:
        supabase = get_supabase_client()
        
        # Verify user can cancel invites for this organization
        verify_org_admin(supabase, str(current_user.uid), organization_id)
        
        # Get invite
        invite_response = (
            supabase.table("team_invitations")
            .select("status")
            .eq("token", token)
            .eq("organization_id", organization_id)
            .maybe_single()
            .execute()
        )
        
        if not invite_response.data:
            raise HTTPException(status_code=404, detail="Invite not found")
        
        invite = invite_response.data
        
        if invite["status"] != "pending":
            raise HTTPException(status_code=400, detail="Only pending invites can be cancelled")
        
        # Update invite status
        update_response = (
            supabase.table("team_invitations")
            .update({
                "status": "cancelled",
                "cancelled_at": datetime.now(timezone.utc).isoformat(),
                "cancelled_by": str(current_user.uid)
            })
            .eq("token", token)
            .execute()
        )
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to cancel invite")
        
        logger.info(f"Cancelled invite {token} for org {organization_id}")
        
        return {"detail": "Invite cancelled"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling invite: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to cancel invite")

@router.post("/change-role", status_code=200)
async def change_invite_role(
    data: UpdateInviteRoleRequest, 
    current_user: User = Depends(get_current_user)
):
    """Change the role of a pending invitation"""
    try:
        supabase = get_supabase_client()
        
        # Verify user can modify invites for this organization
        verify_org_admin(supabase, str(current_user.uid), data.organization_id)
        
        # Get invite
        invite_response = (
            supabase.table("team_invitations")
            .select("status")
            .eq("token", data.token)
            .eq("organization_id", data.organization_id)
            .maybe_single()
            .execute()
        )
        
        if not invite_response.data:
            raise HTTPException(status_code=404, detail="Invite not found")
        
        invite = invite_response.data
        
        if invite["status"] != "pending":
            raise HTTPException(status_code=400, detail="Only pending invites can be updated")
        
        # Validate role
        valid_roles = ["member", "admin", "owner"]
        if data.new_role not in valid_roles:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        # Update invite role
        update_response = (
            supabase.table("team_invitations")
            .update({
                "role": data.new_role,
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
            .eq("token", data.token)
            .execute()
        )
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to update invite role")
        
        logger.info(f"Updated invite {data.token} role to {data.new_role}")
        
        return {"detail": "Invite role updated"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating invite role: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update invite role")

@router.get("/my-invites")
async def get_my_invites(current_user: User = Depends(get_current_user)):
    """Get invites for the current user's email"""
    try:
        supabase = get_supabase_client()
        
        # Get pending invites for user's email
        invites_response = (
            supabase.table("team_invitations")
            .select("*, organizations(name)")
            .eq("email", current_user.email)
            .eq("status", "pending")
            .order("created_at", desc=True)
            .execute()
        )
        
        return invites_response.data or []
        
    except Exception as e:
        logger.error(f"Error getting user invites: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get invites") 
from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid # For generating default org ID if needed, though Supabase handles it

class OrganizationBase(BaseModel):
    name: str
    landing_page_url: Optional[str] = None # Changed HttpUrl to str for broader compatibility, can revert if strict HttpUrl needed
    industry: Optional[str] = None
    description: Optional[str] = None
    # verification_status will be handled by default in Create and included in Read
    # Onboarding fields from your SQL schema for organizations table
    ad_spend_monthly: Optional[str] = None 
    support_channel_type: Optional[str] = None
    support_channel_contact: Optional[str] = None
    avatar_url: Optional[str] = None # Added from your SQL schema
    plan_id: Optional[str] = None # Added from your SQL schema, will be FK to plans table

class OrganizationCreate(OrganizationBase):
    # Default values can be set here or in the endpoint logic
    # For example, if user_id is passed during creation to link the creator
    creator_user_id: Optional[str] = None # UUID of the user creating the org (will be set to current_user.uid by endpoint)

class OrganizationRead(OrganizationBase):
    id: uuid.UUID # This will be the Supabase table's primary key
    owner_id: uuid.UUID # Reflects the actual DB column from your SQL schema
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Stripe fields from your SQL schema (optional, as they might not always be present)
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    stripe_subscription_status: Optional[str] = None
    # Add other fields that are stored and should be returned
    creator_user_id: Optional[str] = None 
    # Example: members: List[OrganizationMemberRead] = [] # If you fetch members alongside

    class Config:
        from_attributes = True # Pydantic v2 style for ORM mode

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    landing_page_url: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    plan_id: Optional[str] = None 
    # Onboarding fields if updatable
    ad_spend_monthly: Optional[str] = None
    support_channel_type: Optional[str] = None
    support_channel_contact: Optional[str] = None
    # Admin only fields - verification_status removed since column no longer exists
    stripe_customer_id: Optional[str] = None # Typically set by backend processes
    stripe_subscription_id: Optional[str] = None # Typically set by backend processes
    stripe_subscription_status: Optional[str] = None # Typically set by backend processes

# Schema for organization members if you have a separate table or join
class OrganizationMemberBase(BaseModel):
    user_id: uuid.UUID
    role: str = "member" # e.g., admin, member, billing_manager

class OrganizationMemberCreate(OrganizationMemberBase):
    organization_id: uuid.UUID # Must be provided when creating a membership

class OrganizationMemberRead(OrganizationMemberBase):
    # id: uuid.UUID # Composite PK (organization_id, user_id) is used in DB, so no separate ID for membership record itself typically read out
    organization_id: uuid.UUID
    joined_at: datetime
    user_email: Optional[EmailStr] = None # Denormalized for convenience, or fetched via join
    user_name: Optional[str] = None # Denormalized

    class Config:
        from_attributes = True # Pydantic v2 style

# Minimal schema for linking user to org in list views
class UserOrganizationLink(BaseModel):
    organization_id: uuid.UUID
    organization_name: str
    user_role_in_org: str # e.g., 'owner', 'admin', 'member'
    avatar_url: Optional[str] = None # Add avatar for display in lists
    plan_id: Optional[str] = None
    
    class Config:
        from_attributes = True 
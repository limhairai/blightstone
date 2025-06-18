from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

# Base Application Schema
class ApplicationBase(BaseModel):
    business_id: uuid.UUID = Field(..., description="Business ID for the application")
    account_name: str = Field(..., min_length=1, max_length=100, description="Desired ad account name")
    spend_limit: Optional[float] = Field(5000.00, ge=0, description="Monthly spend limit in USD")
    landing_page_url: Optional[str] = Field(None, description="Landing page URL")
    facebook_page_url: Optional[str] = Field(None, description="Facebook page URL")
    campaign_description: Optional[str] = Field(None, description="Campaign description")
    notes: Optional[str] = Field(None, description="Additional notes")

# Request Schemas
class ApplicationCreate(ApplicationBase):
    """Schema for creating a new application"""
    pass

class ApplicationUpdate(BaseModel):
    """Schema for updating an application (only pending applications)"""
    account_name: Optional[str] = Field(None, min_length=1, max_length=100)
    spend_limit: Optional[float] = Field(None, ge=0)
    landing_page_url: Optional[str] = None
    facebook_page_url: Optional[str] = None
    campaign_description: Optional[str] = None
    notes: Optional[str] = None

class ApplicationReview(BaseModel):
    """Schema for admin review of applications"""
    status: str = Field(..., description="New status: approved, rejected, under_review")
    admin_notes: Optional[str] = Field(None, description="Admin notes")
    assigned_account_id: Optional[str] = Field(None, description="Assigned ad account ID (for approved)")
    rejection_reason: Optional[str] = Field(None, description="Rejection reason (for rejected)")

# Response Schemas
class ApplicationRead(ApplicationBase):
    """Schema for reading application data"""
    id: uuid.UUID
    user_id: uuid.UUID
    organization_id: uuid.UUID
    status: str = Field(..., description="Application status")
    
    # Admin review fields
    assigned_account_id: Optional[str] = None
    approved_by: Optional[uuid.UUID] = None
    approved_at: Optional[datetime] = None
    rejected_by: Optional[uuid.UUID] = None
    rejected_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    admin_notes: Optional[str] = None
    
    # Timestamps
    submitted_at: datetime
    created_at: datetime
    updated_at: datetime
    
    # Additional fields (populated by joins)
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    business_name: Optional[str] = None
    organization_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class ApplicationStats(BaseModel):
    """Schema for application statistics"""
    total_applications: int
    pending_applications: int
    under_review_applications: int
    approved_applications: int
    rejected_applications: int
    approval_rate: float = Field(..., description="Approval rate as percentage")
    avg_processing_hours: float = Field(..., description="Average processing time in hours")

# Legacy schemas for backward compatibility (if needed)
class AdAccountApplicationRequest(ApplicationBase):
    """Legacy schema - use ApplicationCreate instead"""
    pass

class ApplicationApprovalRequest(BaseModel):
    """Legacy schema - use ApplicationReview instead"""
    application_id: str
    assigned_account_id: str
    notes: Optional[str] = None

class ApplicationRejectionRequest(BaseModel):
    """Legacy schema - use ApplicationReview instead"""
    application_id: str
    rejection_reason: str 
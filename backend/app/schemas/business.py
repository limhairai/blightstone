from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone

class BusinessBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    business_id: Optional[str] = Field(None, description="Facebook Business Manager ID")
    landing_page: Optional[str] = Field(None, description="Business landing page URL")
    website: Optional[str] = Field(None, description="Business website URL")
    timezone: str = Field(default="America/New_York", description="Business timezone")

class BusinessCreate(BusinessBase):
    """Schema for creating a new business"""
    pass

class BusinessUpdate(BaseModel):
    """Schema for updating a business"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    business_id: Optional[str] = Field(None, description="Facebook Business Manager ID")
    landing_page: Optional[str] = Field(None, description="Business landing page URL")
    website: Optional[str] = Field(None, description="Business website URL")
    timezone: Optional[str] = Field(None, description="Business timezone")
    status: Optional[str] = Field(None, description="Business status")

class BusinessRead(BaseModel):
    """Schema for reading business data"""
    id: str
    user_id: str
    organization_id: str
    name: str
    business_id: Optional[str] = None
    status: str
    landing_page: Optional[str] = None
    website: Optional[str] = None
    timezone: str
    # Business Manager mapping fields
    facebook_business_manager_id: Optional[str] = None
    facebook_business_manager_name: Optional[str] = None
    facebook_business_manager_assigned_at: Optional[datetime] = None
    facebook_business_manager_assigned_by: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class BusinessStatusUpdate(BaseModel):
    """Schema for admin status updates"""
    status: Optional[str] = Field(None, description="Business status: In Review, Processing, Ready, Active, Rejected")

class BusinessWithAdAccounts(BusinessRead):
    """Business with associated ad accounts"""
    ad_accounts: Optional[List[dict]] = Field(default_factory=list, description="Associated ad accounts")

# Response schemas
class BusinessListResponse(BaseModel):
    """Response schema for listing businesses"""
    businesses: List[BusinessRead]
    total: int
    page: int
    per_page: int

class BusinessDeleteResponse(BaseModel):
    """Response schema for business deletion"""
    status: str = "success"
    message: str = "Business deleted successfully"

# Business Manager assignment schemas
class BusinessManagerAssignment(BaseModel):
    """Schema for assigning Business Manager to a business"""
    facebook_business_manager_id: str = Field(..., description="Facebook Business Manager ID")
    facebook_business_manager_name: Optional[str] = Field(None, description="Facebook Business Manager display name")

class BusinessManagerAssignmentResponse(BaseModel):
    """Response schema for BM assignment"""
    status: str = "success"
    message: str = "Business Manager assigned successfully"
    business_id: str
    facebook_business_manager_id: str
    facebook_business_manager_name: Optional[str] = None
    assigned_at: datetime 
from pydantic import BaseModel, EmailStr
from typing import Optional

# ============================================================================
# USER SCHEMAS
# ============================================================================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    avatar: Optional[str] = None

class UserRead(BaseModel):
    uid: str
    email: EmailStr
    name: Optional[str] = None
    avatar: Optional[str] = None
    role: Optional[str] = "client"
    is_superuser: bool = False

# ============================================================================
# AUTH SCHEMAS
# ============================================================================

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    uid: Optional[str] = None
    email: Optional[str] = None

# ============================================================================
# CAMPAIGN SCHEMAS
# ============================================================================

class Campaign(BaseModel):
    id: Optional[str] = None
    name: str
    status: Optional[str] = None

class CampaignCreate(BaseModel):
    name: str

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None 
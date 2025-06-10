from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class GroupBase(BaseModel):
    name: str
    websiteUrl: str
    status: str = "pending"
    adAccountIds: List[str] = []
    allowedUsers: List[str] = []
    limit: Optional[float] = None
    orgId: str

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    websiteUrl: Optional[str] = None
    status: Optional[str] = None
    adAccountIds: Optional[List[str]] = None
    allowedUsers: Optional[List[str]] = None
    limit: Optional[float] = None

class GroupRead(GroupBase):
    id: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None 
from pydantic import BaseModel
from typing import Optional

class Campaign(BaseModel):
    id: Optional[str] = None
    name: str
    status: Optional[str] = None

class CampaignCreate(BaseModel):
    name: str

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None 
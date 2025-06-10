from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class User(BaseModel):
    uid: str
    email: str
    name: Optional[str] = None
    avatar: Optional[str] = None
    role: Optional[str] = "client"
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    is_superuser: bool = False 
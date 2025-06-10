from pydantic import BaseModel, EmailStr
from typing import Optional

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
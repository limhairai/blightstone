from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# ============================================================================
# USER MODELS
# ============================================================================

class User(BaseModel):
    uid: str
    email: str
    name: Optional[str] = None
    avatar: Optional[str] = None
    role: Optional[str] = "client"
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    is_superuser: bool = False

# ============================================================================
# ROLE MODELS
# ============================================================================

class Role:
    def __init__(self, org_id, user_id, role, permissions=None):
        self.org_id = org_id
        self.user_id = user_id
        self.role = role
        self.permissions = permissions or []

    def to_dict(self):
        return {
            "org_id": self.org_id,
            "user_id": self.user_id,
            "role": self.role,
            "permissions": self.permissions,
        }

# ============================================================================
# AUDIT LOG MODELS
# ============================================================================

class AuditLog:
    def __init__(self, user_id, org_id, action, before_state=None, after_state=None, ip=None, details=None):
        self.user_id = user_id
        self.org_id = org_id
        self.action = action
        self.timestamp = datetime.utcnow()
        self.before_state = before_state
        self.after_state = after_state
        self.ip = ip
        self.details = details

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "org_id": self.org_id,
            "action": self.action,
            "timestamp": self.timestamp.isoformat(),
            "before_state": self.before_state,
            "after_state": self.after_state,
            "ip": self.ip,
            "details": self.details,
        } 
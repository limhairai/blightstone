from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Float, JSON, Text, Date, Integer, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
import uuid

# SQLAlchemy Base for ORM models
Base = declarative_base()

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

class DolphinAsset(Base):
    """
    Master registry of all assets discovered from Dolphin Cloud
    These are your centralized FB assets that can be assigned to clients
    """
    __tablename__ = "dolphin_assets"
    
    id = Column(String, primary_key=True, default=lambda: f"dolphin_{uuid.uuid4().hex[:12]}")
    
    # Asset Type
    asset_type = Column(String, nullable=False)  # 'business_manager', 'ad_account', 'profile'
    
    # Facebook/Dolphin IDs
    facebook_id = Column(String, nullable=False, unique=True)  # FB BM ID or Ad Account ID
    dolphin_profile_id = Column(String, nullable=False)  # Which Dolphin profile manages this
    dolphin_team_id = Column(String)  # Team within profile
    
    # Asset Details
    name = Column(String, nullable=False)
    status = Column(String, default="active")  # active, restricted, suspended
    
    # Hierarchy (for ad accounts)
    parent_business_manager_id = Column(String)  # Links ad accounts to BMs
    
    # Assignment Status
    is_assigned = Column(Boolean, default=False)
    assigned_to_organization_id = Column(String)
    assigned_to_business_id = Column(String)
    assigned_at = Column(DateTime)
    assigned_by = Column(String)  # Admin user ID
    
    # Sync & Health
    discovered_at = Column(DateTime, default=datetime.utcnow)
    last_sync_at = Column(DateTime)
    health_status = Column(String, default="healthy")  # healthy, warning, critical
    sync_errors = Column(JSON)
    
    # Metadata from Dolphin Cloud
    asset_metadata = Column(JSON)  # Store additional FB/Dolphin data
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ClientAssetBinding(Base):
    """
    Binding configuration between clients and their assigned Dolphin assets
    This controls what clients can see and do with their assigned assets
    """
    __tablename__ = "client_asset_bindings"
    
    id = Column(String, primary_key=True, default=lambda: f"binding_{uuid.uuid4().hex[:12]}")
    
    # Client Info
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    business_id = Column(String, ForeignKey("businesses.id"))
    
    # Asset Assignment
    dolphin_asset_id = Column(String, ForeignKey("dolphin_assets.id"), nullable=False)
    
    # Permissions & Limits
    permissions = Column(JSON, default=lambda: {
        "can_view_insights": True,
        "can_create_campaigns": False,
        "can_edit_budgets": False,
        "can_manage_pages": False,
        "can_access_audiences": False
    })
    
    # Spend Limits (your controls based on client payments)
    spend_limits = Column(JSON, default=lambda: {
        "daily": 0,
        "monthly": 0,
        "total": 0
    })
    
    # Client Top-up Tracking
    client_topped_up_total = Column(Float, default=0.0)  # Total client has paid you
    your_fee_percentage = Column(Float, default=0.05)  # Your fee (5%)
    
    # Assignment Details
    assigned_at = Column(DateTime, default=datetime.utcnow)
    assigned_by = Column(String, nullable=False)  # Admin user ID
    notes = Column(Text)
    
    # Status
    is_active = Column(Boolean, default=True)
    deactivated_at = Column(DateTime)
    deactivated_by = Column(String)
    deactivation_reason = Column(String)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DolphinSyncLog(Base):
    """
    Track synchronization events with Dolphin Cloud
    """
    __tablename__ = "dolphin_sync_logs"
    
    id = Column(String, primary_key=True, default=lambda: f"sync_{uuid.uuid4().hex[:12]}")
    
    # Sync Details
    sync_type = Column(String, nullable=False)  # 'full_discovery', 'asset_update', 'spend_sync'
    dolphin_profile_id = Column(String)
    assets_discovered = Column(Integer, default=0)
    assets_updated = Column(Integer, default=0)
    errors_count = Column(Integer, default=0)
    
    # Results
    status = Column(String, nullable=False)  # 'success', 'partial', 'failed'
    sync_data = Column(JSON)  # Store sync results
    error_details = Column(JSON)
    
    # Timing
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    duration_seconds = Column(Float)
    
    # Triggered by
    triggered_by = Column(String)  # 'admin', 'cron', 'webhook'
    triggered_by_user_id = Column(String)


class ClientSpendTracking(Base):
    """
    Track client spending and top-ups for accurate budget calculations
    """
    __tablename__ = "client_spend_tracking"
    
    id = Column(String, primary_key=True, default=lambda: f"spend_{uuid.uuid4().hex[:12]}")
    
    # Client & Asset
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    business_id = Column(String, ForeignKey("businesses.id"))
    dolphin_asset_id = Column(String, ForeignKey("dolphin_assets.id"), nullable=False)
    facebook_account_id = Column(String, nullable=False)  # FB Ad Account ID
    
    # Financial Data
    amount_spent = Column(Float, default=0.0)  # From Dolphin Cloud
    spend_limit = Column(Float, default=0.0)  # Your imposed limit
    client_balance = Column(Float, default=0.0)  # Calculated remaining budget
    
    # Top-up History
    total_topped_up = Column(Float, default=0.0)  # Total client payments
    fee_collected = Column(Float, default=0.0)  # Your fees collected
    
    # Sync Data
    last_dolphin_sync = Column(DateTime)
    daily_spend_average = Column(Float, default=0.0)
    days_remaining_estimate = Column(Float)
    
    # Timestamps
    date = Column(Date, default=date.today)  # Daily tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 
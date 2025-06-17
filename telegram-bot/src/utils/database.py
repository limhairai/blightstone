from typing import List, Dict, Optional
from datetime import datetime, timedelta
import json

# Mock data for now - replace with actual database queries later
MOCK_APPLICATIONS = [
    {
        "id": "app_001",
        "client_name": "John Smith",
        "business_name": "Smith Marketing LLC",
        "type": "new_business",
        "stage": "under_review",
        "priority": "high",
        "team": "team1",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-16T14:20:00Z",
        "documents": {
            "business_license": True,
            "tax_id": False,
            "bank_statement": False
        },
        "notes": "Waiting for tax ID and bank statement"
    },
    {
        "id": "app_002", 
        "client_name": "Sarah Johnson",
        "business_name": "Johnson Consulting",
        "type": "ad_account",
        "stage": "document_prep",
        "priority": "medium",
        "team": "team1",
        "created_at": "2024-01-16T09:15:00Z",
        "updated_at": "2024-01-16T09:15:00Z",
        "documents": {
            "business_license": True,
            "tax_id": True,
            "bank_statement": False
        },
        "notes": "Business license and tax ID received"
    },
    {
        "id": "app_003",
        "client_name": "Mike Wilson",
        "business_name": "Wilson Tech Solutions",
        "type": "new_business", 
        "stage": "approved",
        "priority": "low",
        "team": "team2",
        "created_at": "2024-01-14T16:45:00Z",
        "updated_at": "2024-01-16T11:30:00Z",
        "documents": {
            "business_license": True,
            "tax_id": True,
            "bank_statement": True
        },
        "notes": "Application approved and processed"
    },
    {
        "id": "app_004",
        "client_name": "Lisa Chen",
        "business_name": "Chen Digital Agency",
        "type": "ad_account",
        "stage": "received",
        "priority": "urgent",
        "team": "team2",
        "created_at": "2024-01-16T15:20:00Z",
        "updated_at": "2024-01-16T15:20:00Z",
        "documents": {
            "business_license": False,
            "tax_id": False,
            "bank_statement": False
        },
        "notes": "New application received"
    }
]

MOCK_BUSINESSES = [
    {
        "id": "biz_001",
        "name": "Smith Marketing LLC",
        "client_id": "client_001",
        "status": "active",
        "verification_status": "verified",
        "ad_account_count": 3,
        "total_spend": 45000,
        "monthly_spend": 12000
    },
    {
        "id": "biz_002",
        "name": "Johnson Consulting", 
        "client_id": "client_002",
        "status": "pending",
        "verification_status": "pending",
        "ad_account_count": 1,
        "total_spend": 8500,
        "monthly_spend": 2800
    }
]

MOCK_CLIENTS = [
    {
        "id": "client_001",
        "name": "John Smith",
        "email": "john@smithmarketing.com",
        "company": "Smith Marketing LLC",
        "status": "active",
        "tier": "premium"
    },
    {
        "id": "client_002", 
        "name": "Sarah Johnson",
        "email": "sarah@johnsonconsulting.com", 
        "company": "Johnson Consulting",
        "status": "active",
        "tier": "standard"
    }
]

async def get_applications(limit: Optional[int] = None, team: Optional[str] = None) -> List[Dict]:
    """Get applications from database"""
    applications = MOCK_APPLICATIONS.copy()
    
    # Filter by team if specified
    if team:
        applications = [app for app in applications if app.get("team") == team]
    
    # Sort by created_at (newest first)
    applications.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    # Apply limit if specified
    if limit:
        applications = applications[:limit]
    
    return applications

async def get_team_applications(team_name: str) -> List[Dict]:
    """Get applications assigned to a specific team"""
    return await get_applications(team=team_name)

async def get_application_by_id(app_id: str) -> Optional[Dict]:
    """Get a specific application by ID"""
    for app in MOCK_APPLICATIONS:
        if app.get("id") == app_id:
            return app.copy()
    return None

async def update_application_status(app_id: str, new_status: str, updated_by: int) -> bool:
    """Update application status"""
    # TODO: Implement actual database update
    # For now, just simulate success
    
    valid_statuses = ['received', 'document_prep', 'submitted', 'under_review', 'approved', 'rejected', 'need_documents']
    
    if new_status not in valid_statuses:
        return False
    
    # Find and update the application in mock data
    for app in MOCK_APPLICATIONS:
        if app.get("id") == app_id:
            app["stage"] = new_status
            app["updated_at"] = datetime.now().isoformat() + "Z"
            return True
    
    return False

async def add_application_note(app_id: str, note: str, added_by: int) -> bool:
    """Add a note to an application"""
    # TODO: Implement actual database update
    for app in MOCK_APPLICATIONS:
        if app.get("id") == app_id:
            app["notes"] = note
            app["updated_at"] = datetime.now().isoformat() + "Z"
            return True
    return False

async def get_businesses(limit: Optional[int] = None) -> List[Dict]:
    """Get businesses from database"""
    businesses = MOCK_BUSINESSES.copy()
    
    if limit:
        businesses = businesses[:limit]
    
    return businesses

async def get_clients(limit: Optional[int] = None) -> List[Dict]:
    """Get clients from database"""
    clients = MOCK_CLIENTS.copy()
    
    if limit:
        clients = clients[:limit]
    
    return clients

async def get_application_stats() -> Dict:
    """Get application statistics"""
    applications = MOCK_APPLICATIONS
    
    total = len(applications)
    pending = len([a for a in applications if a.get('stage') in ['received', 'document_prep', 'submitted', 'under_review']])
    approved = len([a for a in applications if a.get('stage') == 'approved'])
    rejected = len([a for a in applications if a.get('stage') == 'rejected'])
    
    # Calculate today's approvals
    today = datetime.now().strftime('%Y-%m-%d')
    approved_today = len([a for a in applications if a.get('stage') == 'approved' and a.get('updated_at', '').startswith(today)])
    
    return {
        "total": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "approved_today": approved_today
    }

async def get_team_stats(team_name: str) -> Dict:
    """Get team-specific statistics"""
    team_apps = [app for app in MOCK_APPLICATIONS if app.get("team") == team_name]
    
    total = len(team_apps)
    completed_this_week = len([app for app in team_apps if app.get('stage') in ['approved', 'rejected']])
    approval_rate = 0
    
    if total > 0:
        approved = len([app for app in team_apps if app.get('stage') == 'approved'])
        approval_rate = round((approved / total) * 100, 1)
    
    return {
        "total_applications": total,
        "completed_this_week": completed_this_week,
        "approval_rate": approval_rate,
        "avg_processing_time": 3.2,
        "pending_count": len([app for app in team_apps if app.get('stage') in ['received', 'document_prep', 'submitted', 'under_review']]),
        "overdue_count": 1  # TODO: Calculate based on actual dates
    }

async def create_application(client_name: str, business_name: str, app_type: str, team: str) -> str:
    """Create a new application"""
    # Generate new application ID
    app_id = f"app_{len(MOCK_APPLICATIONS) + 1:03d}"
    
    new_app = {
        "id": app_id,
        "client_name": client_name,
        "business_name": business_name,
        "type": app_type,
        "stage": "received",
        "priority": "medium",
        "team": team,
        "created_at": datetime.now().isoformat() + "Z",
        "updated_at": datetime.now().isoformat() + "Z",
        "documents": {
            "business_license": False,
            "tax_id": False,
            "bank_statement": False
        },
        "notes": "New application created"
    }
    
    MOCK_APPLICATIONS.append(new_app)
    return app_id

async def assign_application_to_team(app_id: str, team_name: str) -> bool:
    """Assign an application to a team"""
    for app in MOCK_APPLICATIONS:
        if app.get("id") == app_id:
            app["team"] = team_name
            app["updated_at"] = datetime.now().isoformat() + "Z"
            return True
    return False

async def get_overdue_applications(days: int = 7) -> List[Dict]:
    """Get applications that are overdue"""
    cutoff_date = datetime.now() - timedelta(days=days)
    overdue = []
    
    for app in MOCK_APPLICATIONS:
        if app.get('stage') in ['received', 'document_prep', 'submitted', 'under_review']:
            created_date = datetime.fromisoformat(app.get('created_at', '').replace('Z', '+00:00'))
            if created_date < cutoff_date:
                overdue.append(app)
    
    return overdue

# Database connection helpers (for future implementation)
async def init_database():
    """Initialize database connection"""
    # TODO: Initialize actual database connection
    pass

async def close_database():
    """Close database connection"""
    # TODO: Close actual database connection
    pass 
from typing import List, Dict
from datetime import datetime

def format_stats(stats: Dict) -> str:
    """Format system statistics for display"""
    return (
        f"📊 <b>System Statistics</b>\n\n"
        f"👥 <b>Clients:</b> {stats.get('total_clients', 0):,}\n"
        f"🏢 <b>Businesses:</b> {stats.get('total_businesses', 0):,}\n"
        f"📋 <b>Applications:</b> {stats.get('total_applications', 0):,}\n"
        f"⏳ <b>Pending:</b> {stats.get('pending_applications', 0):,}\n"
        f"✅ <b>Approved Today:</b> {stats.get('approved_today', 0):,}\n"
        f"🟢 <b>Active Businesses:</b> {stats.get('active_businesses', 0):,}\n"
        f"📈 <b>Total Ad Accounts:</b> {stats.get('total_ad_accounts', 0):,}\n\n"
        f"⏰ <b>Last Updated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )

def format_application_list(applications: List[Dict], detailed: bool = False, show_team: bool = True) -> str:
    """Format application list for display"""
    if not applications:
        return "📋 No applications found"
    
    message = f"📋 <b>Applications ({len(applications)})</b>\n\n"
    
    for app in applications:
        stage_emoji = {
            'received': '📥',
            'document_prep': '📝',
            'submitted': '📤',
            'under_review': '🔍',
            'approved': '✅',
            'rejected': '❌',
            'need_documents': '📋'
        }
        
        priority_emoji = {
            'urgent': '🔴',
            'high': '🟠',
            'medium': '🟡',
            'low': '🟢'
        }
        
        emoji = stage_emoji.get(app.get('stage', ''), '📊')
        priority = priority_emoji.get(app.get('priority', 'medium'), '🟡')
        
        message += f"{emoji} <b>{app.get('id', 'N/A')}</b>\n"
        message += f"👤 {app.get('client_name', 'N/A')} - {app.get('business_name', 'N/A')}\n"
        message += f"📊 {app.get('stage', 'N/A').replace('_', ' ').title()} {priority}\n"
        
        if show_team:
            message += f"👥 Team: {app.get('team', 'N/A').title()}\n"
        
        if detailed:
            created = app.get('created_at', '')
            if created:
                try:
                    date = datetime.fromisoformat(created.replace('Z', '+00:00'))
                    message += f"📅 {date.strftime('%m/%d %H:%M')}\n"
                except:
                    pass
            
            if app.get('notes'):
                notes = app.get('notes', '')[:50]
                if len(app.get('notes', '')) > 50:
                    notes += "..."
                message += f"💬 {notes}\n"
        
        message += "\n"
    
    return message

def format_team_stats(team_name: str, stats: Dict) -> str:
    """Format team statistics for display"""
    return (
        f"📊 <b>{team_name.title()} Statistics</b>\n\n"
        f"📋 <b>Total Applications:</b> {stats.get('total_applications', 0)}\n"
        f"✅ <b>Completed This Week:</b> {stats.get('completed_this_week', 0)}\n"
        f"📈 <b>Approval Rate:</b> {stats.get('approval_rate', 0)}%\n"
        f"⏱️ <b>Avg Processing Time:</b> {stats.get('avg_processing_time', 0)} days\n"
        f"⏳ <b>Pending:</b> {stats.get('pending_count', 0)}\n"
        f"🔴 <b>Overdue:</b> {stats.get('overdue_count', 0)}\n\n"
        f"⏰ <b>Updated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    )

def format_application_details(app: Dict) -> str:
    """Format detailed application information"""
    stage_emoji = {
        'received': '📥',
        'document_prep': '📝', 
        'submitted': '📤',
        'under_review': '🔍',
        'approved': '✅',
        'rejected': '❌',
        'need_documents': '📋'
    }
    
    priority_emoji = {
        'urgent': '🔴',
        'high': '🟠',
        'medium': '🟡',
        'low': '🟢'
    }
    
    emoji = stage_emoji.get(app.get('stage', ''), '📊')
    priority = priority_emoji.get(app.get('priority', 'medium'), '🟡')
    
    message = f"{emoji} <b>Application Details</b>\n\n"
    message += f"🆔 <b>ID:</b> {app.get('id', 'N/A')}\n"
    message += f"👤 <b>Client:</b> {app.get('client_name', 'N/A')}\n"
    message += f"🏢 <b>Business:</b> {app.get('business_name', 'N/A')}\n"
    message += f"📊 <b>Stage:</b> {app.get('stage', 'N/A').replace('_', ' ').title()}\n"
    message += f"⚡ <b>Priority:</b> {app.get('priority', 'N/A').title()} {priority}\n"
    message += f"🏷️ <b>Type:</b> {app.get('type', 'N/A').replace('_', ' ').title()}\n"
    message += f"👥 <b>Team:</b> {app.get('team', 'N/A').title()}\n"
    
    # Format dates
    created = app.get('created_at', '')
    updated = app.get('updated_at', '')
    
    if created:
        try:
            date = datetime.fromisoformat(created.replace('Z', '+00:00'))
            message += f"📅 <b>Created:</b> {date.strftime('%Y-%m-%d %H:%M')}\n"
        except:
            pass
    
    if updated and updated != created:
        try:
            date = datetime.fromisoformat(updated.replace('Z', '+00:00'))
            message += f"🔄 <b>Updated:</b> {date.strftime('%Y-%m-%d %H:%M')}\n"
        except:
            pass
    
    # Document status
    documents = app.get('documents', {})
    if documents:
        message += f"\n📝 <b>Documents:</b>\n"
        for doc_type, status in documents.items():
            status_icon = "✅" if status else "❌"
            doc_name = doc_type.replace('_', ' ').title()
            message += f"• {doc_name} {status_icon}\n"
    
    # Notes
    notes = app.get('notes', '')
    if notes:
        message += f"\n💬 <b>Notes:</b>\n{notes}\n"
    
    return message

def format_user_info(user_id: int, user_data: Dict) -> str:
    """Format user information for display"""
    role_emoji = {
        'admin': '👑',
        'team_lead': '👨‍💼',
        'team_member': '👨‍💻'
    }
    
    role = user_data.get('role', 'unknown')
    emoji = role_emoji.get(role, '👤')
    
    message = f"{emoji} <b>User Information</b>\n\n"
    message += f"🆔 <b>ID:</b> {user_id}\n"
    message += f"👤 <b>Name:</b> {user_data.get('name', 'Unknown')}\n"
    message += f"🏷️ <b>Role:</b> {role.replace('_', ' ').title()}\n"
    message += f"👥 <b>Team:</b> {user_data.get('team', 'N/A').title()}\n"
    
    return message

def format_currency(amount: float) -> str:
    """Format currency amount"""
    return f"${amount:,.2f}"

def format_percentage(value: float) -> str:
    """Format percentage value"""
    return f"{value:.1f}%"

def format_date(date_string: str) -> str:
    """Format date string for display"""
    try:
        date = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        return date.strftime('%Y-%m-%d %H:%M')
    except:
        return date_string

def format_age(date_string: str) -> str:
    """Format application age"""
    try:
        date = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        age = datetime.now(date.tzinfo) - date
        
        if age.days > 0:
            return f"{age.days} days"
        elif age.seconds > 3600:
            hours = age.seconds // 3600
            return f"{hours} hours"
        else:
            minutes = age.seconds // 60
            return f"{minutes} minutes"
    except:
        return "Unknown"

def truncate_text(text: str, max_length: int = 50) -> str:
    """Truncate text with ellipsis"""
    if len(text) <= max_length:
        return text
    return text[:max_length-3] + "..."

def format_workload_status(utilization: float) -> str:
    """Format workload status with appropriate emoji"""
    if utilization >= 90:
        return "🔴 High Load"
    elif utilization >= 75:
        return "🟡 Medium Load"
    elif utilization >= 50:
        return "🟢 Normal Load"
    else:
        return "⚪ Light Load" 
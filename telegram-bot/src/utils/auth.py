from typing import Dict, List
from config import bot_settings

# User roles and team assignments
USER_ROLES = {
    # Admin users (can access all commands)
    123456789: {"role": "admin", "team": "admin", "name": "Admin User"},
    # Add your Telegram user ID here (get it from @userinfobot)
    7723014090: {"role": "admin", "team": "admin", "name": "Lim"},
    
    # Team leads (can manage their team's applications)
    987654321: {"role": "team_lead", "team": "team1", "name": "Team 1 Lead"},
    876543210: {"role": "team_lead", "team": "team2", "name": "Team 2 Lead"},
    765432109: {"role": "team_lead", "team": "team3", "name": "Team 3 Lead"},
    654321098: {"role": "team_lead", "team": "team4", "name": "Team 4 Lead"},
    
    # Team members (can view their applications)
    543210987: {"role": "team_member", "team": "team1", "name": "Team 1 Member 1"},
    432109876: {"role": "team_member", "team": "team1", "name": "Team 1 Member 2"},
    321098765: {"role": "team_member", "team": "team2", "name": "Team 2 Member 1"},
    210987654: {"role": "team_member", "team": "team2", "name": "Team 2 Member 2"},
}

# Team information
TEAMS = {
    "team1": {
        "name": "Meta Specialists",
        "description": "Facebook/Meta advertising specialists",
        "capacity": 20,
        "members": ["Team 1 Lead", "Team 1 Member 1", "Team 1 Member 2"]
    },
    "team2": {
        "name": "Growth Team", 
        "description": "Growth and scaling specialists",
        "capacity": 20,
        "members": ["Team 2 Lead", "Team 2 Member 1", "Team 2 Member 2"]
    },
    "team3": {
        "name": "Enterprise Team",
        "description": "Large enterprise client specialists", 
        "capacity": 15,
        "members": ["Team 3 Lead"]
    },
    "team4": {
        "name": "International Team",
        "description": "International market specialists",
        "capacity": 15, 
        "members": ["Team 4 Lead"]
    }
}

def is_admin(user_id: int) -> bool:
    """Check if user is an admin"""
    user = USER_ROLES.get(user_id)
    return user and user.get("role") == "admin"

def is_team_lead(user_id: int) -> bool:
    """Check if user is a team lead"""
    user = USER_ROLES.get(user_id)
    return user and user.get("role") == "team_lead"

def is_team_member(user_id: int) -> bool:
    """Check if user is a team member"""
    user = USER_ROLES.get(user_id)
    return user and user.get("role") in ["team_member", "team_lead"]

def get_user_role(user_id: int) -> str:
    """Get user role"""
    user = USER_ROLES.get(user_id)
    return user.get("role", "unauthorized") if user else "unauthorized"

def get_user_team(user_id: int) -> str:
    """Get user's team"""
    user = USER_ROLES.get(user_id)
    return user.get("team", "") if user else ""

def get_user_name(user_id: int) -> str:
    """Get user's name"""
    user = USER_ROLES.get(user_id)
    return user.get("name", "Unknown User") if user else "Unknown User"

def is_authorized(user_id: int) -> bool:
    """Check if user is authorized to use the bot"""
    return user_id in USER_ROLES

def get_team_info(team_name: str) -> Dict:
    """Get team information"""
    return TEAMS.get(team_name, {})

def get_team_capacity(team_name: str) -> int:
    """Get team capacity"""
    team = TEAMS.get(team_name, {})
    return team.get("capacity", 0)

def add_user(user_id: int, role: str, team: str, name: str) -> bool:
    """Add a new user (admin only functionality)"""
    if role not in ["admin", "team_lead", "team_member"]:
        return False
    
    if team not in TEAMS and role != "admin":
        return False
    
    USER_ROLES[user_id] = {
        "role": role,
        "team": team,
        "name": name
    }
    return True

def remove_user(user_id: int) -> bool:
    """Remove a user (admin only functionality)"""
    if user_id in USER_ROLES:
        del USER_ROLES[user_id]
        return True
    return False

def get_all_users() -> Dict:
    """Get all users (admin only)"""
    return USER_ROLES.copy()

def get_team_members(team_name: str) -> List[Dict]:
    """Get all members of a specific team"""
    return [
        {"user_id": user_id, **user_info}
        for user_id, user_info in USER_ROLES.items()
        if user_info.get("team") == team_name
    ]

def can_access_command(user_id: int, command: str) -> bool:
    """Check if user can access a specific command"""
    from config import ADMIN_COMMANDS, TEAM_LEAD_COMMANDS, USER_COMMANDS
    
    role = get_user_role(user_id)
    
    if role == "admin":
        return True  # Admins can access all commands
    elif role == "team_lead":
        return command in TEAM_LEAD_COMMANDS + USER_COMMANDS
    elif role == "team_member":
        return command in USER_COMMANDS
    else:
        return False 
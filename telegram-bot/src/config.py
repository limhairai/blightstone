import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator

class BotSettings(BaseSettings):
    # Telegram Bot Token (get from @BotFather)
    TELEGRAM_BOT_TOKEN: str
    
    # Bot Configuration
    BOT_NAME: str = "AdHub Bot"
    LOG_LEVEL: str = "INFO"
    
    # Admin User IDs (Telegram user IDs who can use admin commands)
    ADMIN_USER_IDS: Optional[str] = None
    
    # Team Lead User IDs (can manage applications and assignments)  
    TEAM_LEAD_USER_IDS: Optional[str] = None
    
    # Database connection
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    
    # Dolphin Cloud API
    DOLPHIN_CLOUD_BASE_URL: str = "https://cloud.dolphin.tech"
    DOLPHIN_CLOUD_TOKEN: Optional[str] = None
    
    # Payment Configuration
    PAYMENT_CREDENTIAL_ID: Optional[str] = None
    
    # Alert Configuration
    DEFAULT_CRITICAL_THRESHOLD_DAYS: int = 1
    DEFAULT_WARNING_THRESHOLD_DAYS: int = 3
    
    # Webhook settings (for production)
    WEBHOOK_URL: Optional[str] = None
    WEBHOOK_PORT: int = 8443
    
    class Config:
        env_file = ".env"
        extra = "ignore"
    
    def get_admin_user_ids(self) -> List[int]:
        """Parse admin user IDs from comma-separated string"""
        if not self.ADMIN_USER_IDS:
            return []
        try:
            return [int(uid.strip()) for uid in self.ADMIN_USER_IDS.split(',') if uid.strip()]
        except ValueError:
            return []
    
    def get_team_lead_user_ids(self) -> List[int]:
        """Parse team lead user IDs from comma-separated string"""
        if not self.TEAM_LEAD_USER_IDS:
            return []
        try:
            return [int(uid.strip()) for uid in self.TEAM_LEAD_USER_IDS.split(',') if uid.strip()]
        except ValueError:
            return []

# Global settings instance
bot_settings = BotSettings()

# Bot commands and permissions
ADMIN_COMMANDS = [
    "admin_stats", "admin_users", "admin_alerts", 
    "admin_organizations", "admin_system"
]

USER_COMMANDS = [
    "start", "help", "link", "whoami", "organizations",
    "businesses", "accounts", "wallet", "balance", "topup", "sync"
] 
"""
🔒 Telegram Bot Configuration
PRODUCTION-READY configuration with environment-based settings
"""

import os
from typing import Optional

class Config:
    """Telegram bot configuration with environment-based URLs"""
    
    # ✅ SECURE: Environment detection
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    
    # ✅ SECURE: Telegram configuration
    BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
    WEBHOOK_URL = os.getenv("TELEGRAM_WEBHOOK_URL", "")
    
    # ✅ SECURE: Backend URL (environment-based, no hardcoded localhost)
    BACKEND_URL = _get_backend_url()
    
    # ✅ SECURE: Database configuration
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///telegram_bot.db")
    
    # ✅ SECURE: Security settings
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    API_KEY = os.getenv("API_KEY", "")
    
    # ✅ SECURE: Rate limiting
    RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "30"))
    RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
    
    # ✅ SECURE: Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

def _get_backend_url() -> str:
    """Get backend URL based on environment"""
    # Check explicit environment variable first
    if os.getenv("BACKEND_URL"):
        return os.getenv("BACKEND_URL")
    
    environment = os.getenv("ENVIRONMENT", "development")
    
    if environment == "production":
        return "https://api.adhub.com"
    elif environment == "staging":
        return "https://api-staging.adhub.tech"
    else:
        return "http://localhost:8000"

# ✅ SECURE: Create config instance
config = Config()

# 🎯 Development logging
if config.ENVIRONMENT == "development":
    print(f"🤖 Telegram Bot Configuration:")
    print(f"  Environment: {config.ENVIRONMENT}")
    print(f"  Backend URL: {config.BACKEND_URL}")
    print(f"  Debug: {config.DEBUG}")
    print(f"  Bot Token: {'Set' if config.BOT_TOKEN else 'Not Set'}")

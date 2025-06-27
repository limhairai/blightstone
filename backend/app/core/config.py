"""
🔒 Backend Configuration
PRODUCTION-READY configuration with environment-based settings
"""

import os
from typing import List, Optional
from pydantic import validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment-based configuration"""
    
    # ✅ SECURE: Environment detection
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    
    # ✅ SECURE: Database configuration
    DATABASE_URL: str = "sqlite:///./adhub.db"
    
    # ✅ SECURE: API configuration
    API_URL: str = "http://localhost:8000"
    WS_API_URL: str = "ws://localhost:8000"
    
    # ✅ SECURE: CORS origins
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # ✅ SECURE: Security settings
    SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_SECRET: str = "your-jwt-secret-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # ✅ SECURE: External services
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    
    # ✅ SECURE: Supabase configuration
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    
    # ✅ SECURE: Dolphin API configuration
    DOLPHIN_API_URL: str = ""
    DOLPHIN_API_KEY: str = ""
    
    # ✅ SECURE: Rate limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 3600
    
    # ✅ SECURE: Logging
    LOG_LEVEL: str = "INFO"
    
    @validator("ALLOWED_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    class Config:
        env_file = "backend/.env"  # Path from project root
        case_sensitive = True
        extra = "ignore"  # Allow extra environment variables


# ✅ SECURE: Create settings instance
settings = Settings()

# 🎯 Development logging
if settings.ENVIRONMENT == "development":
    print(f"🔧 Backend Configuration:")
    print(f"  Environment: {settings.ENVIRONMENT}")
    print(f"  API URL: {settings.API_URL}")
    print(f"  Allowed Origins: {settings.ALLOWED_ORIGINS}")
    print(f"  Debug: {settings.DEBUG}")

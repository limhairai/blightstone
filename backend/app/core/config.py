"""
🔒 Backend Configuration
PRODUCTION-READY configuration with environment-based settings
"""

import os
from typing import List, Optional, Union
from pydantic import field_validator, Field
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
    ALLOWED_ORIGINS: Union[str, List[str]] = Field(default="http://localhost:3000,http://127.0.0.1:3000")
    
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
    
    @field_validator("ALLOWED_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str) and v:
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    class Config:
        env_file = ".env"  # Path from backend directory (where uvicorn runs)
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
    print(f"  Supabase URL: {'✅ Set' if settings.SUPABASE_URL else '❌ Not set'}")
    print(f"  Supabase Service Key: {'✅ Set' if settings.SUPABASE_SERVICE_ROLE_KEY else '❌ Not set'}")
    print(f"  Supabase JWT Secret: {'✅ Set' if settings.SUPABASE_JWT_SECRET else '❌ Not set'}")

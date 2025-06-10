import os
import json
from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic_settings import BaseSettings
from pydantic import Field

class Mode(str, Enum):
    DEV = "development"
    STAGING = "staging"
    PROD = "production"

def get_env_file() -> str:
    """Determine which .env file to load based on environment."""
    mode = os.environ.get("MODE", os.environ.get("ENVIRONMENT", os.environ.get("NODE_ENV", "development"))).lower()
    
    # Map common environment names to our file names
    env_mapping = {
        "development": ".env.development",
        "dev": ".env.development", 
        "local": ".env.development",
        "staging": ".env.staging",
        "stage": ".env.staging",
        "production": ".env.production",
        "prod": ".env.production",
    }
    
    env_file = env_mapping.get(mode, ".env.development")
    
    # Check if the specific env file exists, fallback to .env
    if os.path.exists(env_file):
        print(f"Loading environment from: {env_file}")
        return env_file
    elif os.path.exists(".env"):
        print(f"Environment file {env_file} not found, falling back to .env")
        return ".env"
    else:
        print(f"No environment file found, using system environment variables")
        return ""

class Settings(BaseSettings):
    # Environment - support both MODE and ENVIRONMENT variables
    MODE: Mode = Mode.DEV
    ENVIRONMENT: Optional[str] = None  # Allow ENVIRONMENT variable
    DEBUG: bool = Field(default=True)
    
    # API Configuration
    API_URL: str = "http://localhost:8000"
    WS_API_URL: str = "ws://localhost:8000"
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AdHub"
    VERSION: str = "1.0.0"
    
    # CORS Configuration - to be loaded from env var primarily
    CORS_ORIGINS_STRING: Optional[str] = None
    
    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        default_origins = [
            "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003",
            "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:3002", "http://127.0.0.1:3003",
        ]
        if self.CORS_ORIGINS_STRING:
            return [origin.strip() for origin in self.CORS_ORIGINS_STRING.split(",")]
        return default_origins
        
    # Security
    # For production, set SECRET_KEY as an environment variable.
    # Generate a strong key, e.g., using: openssl rand -hex 32
    SECRET_KEY: str = "a_very_insecure_default_dev_key_please_change_for_prod_or_set_env_var"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Supabase Configuration
    SUPABASE_URL: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_JWT_SECRET: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    
    # Meta API
    META_APP_ID: Optional[str] = None
    META_APP_SECRET: Optional[str] = None
    META_API_VERSION: str = "v19.0"
    FB_ACCESS_TOKEN: Optional[str] = None
    HOST_BM_ID: Optional[str] = None
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Cache
    REDIS_URL: Optional[str] = None
    
    # Database
    DATABASE_URL: str = "sqlite:///./adhub.db"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # If ENVIRONMENT is set but MODE is not, sync them
        if self.ENVIRONMENT and not kwargs.get('MODE'):
            env_to_mode = {
                "development": Mode.DEV,
                "staging": Mode.STAGING,
                "production": Mode.PROD
            }
            if self.ENVIRONMENT.lower() in env_to_mode:
                self.MODE = env_to_mode[self.ENVIRONMENT.lower()]
    
    class Config:
        case_sensitive = True
        env_file = get_env_file()
        env_file_encoding = 'utf-8'
        extra = 'ignore'  # Allow extra fields without validation errors

settings = Settings()

# Helper functions
def is_dev() -> bool:
    return settings.MODE == Mode.DEV

def is_prod() -> bool:
    return settings.MODE == Mode.PROD

def is_staging() -> bool:
    return settings.MODE == Mode.STAGING

__all__ = [
    "Settings",
    "settings",
    "is_dev",
    "is_prod",
    "is_staging",
] 
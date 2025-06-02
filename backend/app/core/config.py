import os
import json
from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic_settings import BaseSettings
from pydantic import Field

# Firebase Credentials Handling
FIREBASE_ADMIN_CREDENTIALS = None
_emulator_host_firestore = os.environ.get("FIRESTORE_EMULATOR_HOST")
_emulator_host_auth = os.environ.get("FIREBASE_AUTH_EMULATOR_HOST")

# Consider emulators active if either Firestore or Auth emulator host is set
_using_emulators = _emulator_host_firestore or _emulator_host_auth

if not _using_emulators:
    print("[CONFIG] Not using Firebase emulators. Attempting to load production Firebase credentials.")
    _firebase_admin_creds_json_env = os.environ.get("FIREBASE_ADMIN_CREDENTIALS_JSON")
    if _firebase_admin_creds_json_env:
        print("[CONFIG] Loading Firebase credentials from FIREBASE_ADMIN_CREDENTIALS_JSON env var.")
        try:
            FIREBASE_ADMIN_CREDENTIALS = json.loads(_firebase_admin_creds_json_env)
        except json.JSONDecodeError as e:
            print(f"[CONFIG] ERROR: Failed to parse FIREBASE_ADMIN_CREDENTIALS_JSON: {e}")
            # Potentially raise an error or exit if creds are vital for prod
    else:
        _firebase_admin_creds_path_env = os.environ.get("FIREBASE_ADMIN_CREDENTIALS_PATH")
        if _firebase_admin_creds_path_env:
            print(f"[CONFIG] Loading Firebase credentials from FIREBASE_ADMIN_CREDENTIALS_PATH env var: {_firebase_admin_creds_path_env}")
            try:
                with open(_firebase_admin_creds_path_env) as f:
                    FIREBASE_ADMIN_CREDENTIALS = json.load(f)
            except Exception as e:
                print(f"[CONFIG] ERROR: Failed to load Firebase credentials from path {_firebase_admin_creds_path_env}: {e}")
        else:
            print("[CONFIG] WARNING: No Firebase production credentials provided (env var JSON content or path) and not using emulators. Live Firebase connection will likely fail or use default ADC if available.")
else:
    print(f"[CONFIG] Using Firebase Emulators (FIRESTORE_EMULATOR_HOST: {_emulator_host_firestore}, FIREBASE_AUTH_EMULATOR_HOST: {_emulator_host_auth}). Skipping production Firebase credential loading.")


class Mode(str, Enum):
    DEV = "dev"
    STAGING = "staging"
    PROD = "prod"

class Settings(BaseSettings):
    # Environment
    MODE: Mode = Mode.DEV if os.environ.get("DEBUG", "True").lower() == "true" else Mode.PROD
    DEBUG: bool = Field(default_factory=lambda: os.environ.get("DEBUG", "True").lower() == "true")
    
    # API Configuration
    API_URL: str = os.environ.get("API_URL", "http://localhost:8000")
    WS_API_URL: str = os.environ.get("WS_API_URL", "ws://localhost:8000")
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AdHub"
    VERSION: str = "1.0.0"
    
    # CORS Configuration - to be loaded from env var primarily
    CORS_ORIGINS_STRING: Optional[str] = os.environ.get("CORS_ORIGINS_STRING") 
    
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
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "a_very_insecure_default_dev_key_please_change_for_prod_or_set_env_var") 
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.environ.get("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # Firebase Configuration
    FIREBASE_ADMIN_CREDENTIALS: Optional[Dict[str, Any]] = FIREBASE_ADMIN_CREDENTIALS
    
    # Meta API
    META_APP_ID: Optional[str] = os.environ.get("META_APP_ID")
    META_APP_SECRET: Optional[str] = os.environ.get("META_APP_SECRET")
    META_API_VERSION: str = os.environ.get("META_API_VERSION", "v19.0")
    FB_ACCESS_TOKEN: Optional[str] = os.environ.get("FB_ACCESS_TOKEN")
    HOST_BM_ID: Optional[str] = os.environ.get("HOST_BM_ID")
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = int(os.environ.get("RATE_LIMIT_PER_MINUTE", "60"))
    
    # Cache
    REDIS_URL: Optional[str] = os.environ.get("REDIS_URL")
    
    # Database
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite:///./adhub.db")
    
    class Config:
        case_sensitive = True
        # env_file = ".env" # Pydantic-settings handles .env loading by default if python-dotenv is installed
        # env_file_encoding = 'utf-8' # Optional if needed

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
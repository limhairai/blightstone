import os
from pathlib import Path
from dotenv import load_dotenv
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api import api_router
import asyncio
import logging

# Import the auto-sync scheduler
try:
    import sys
    import os
    backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if backend_root not in sys.path:
        sys.path.insert(0, backend_root)
    from tasks.background import auto_sync_scheduler
except ImportError as e:
    logger.error(f"Failed to import auto_sync_scheduler: {e}")
    auto_sync_scheduler = None

logger = logging.getLogger(__name__)

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# Initialize Sentry (before FastAPI app creation)
sentry_dsn = os.getenv("SENTRY_DSN")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        integrations=[FastApiIntegration()],
        traces_sample_rate=1.0 if os.getenv("ENVIRONMENT") != "production" else 0.1,
        environment=os.getenv("SENTRY_ENVIRONMENT", "development"),
        # Add data like request headers and IP for users,
        # see https://docs.sentry.io/platforms/python/data-management/data-collected/ for more info
        send_default_pii=True,
    )

app = FastAPI(title="AdHub API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api")

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Start background tasks on application startup"""
    logger.info("🚀 Starting AdHub API...")
    
    # Start the auto-sync scheduler in the background
    if auto_sync_scheduler:
        try:
            asyncio.create_task(auto_sync_scheduler.start_scheduler())
            logger.info("🔄 Auto-sync scheduler started successfully")
        except Exception as e:
            logger.error(f"🔄 Failed to start auto-sync scheduler: {str(e)}")
    else:
        logger.warning("🔄 Auto-sync scheduler not available - skipping")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up background tasks on application shutdown"""
    logger.info("🛑 Shutting down AdHub API...")
    
    # Stop the auto-sync scheduler
    if auto_sync_scheduler:
        try:
            await auto_sync_scheduler.stop_scheduler()
            logger.info("🔄 Auto-sync scheduler stopped successfully")
        except Exception as e:
            logger.error(f"🔄 Failed to stop auto-sync scheduler: {str(e)}")
    else:
        logger.info("🔄 Auto-sync scheduler was not running")

@app.get("/")
async def root():
    return {"message": "AdHub API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Sentry test endpoint (for development/testing)
@app.get("/sentry-debug")
async def trigger_error():
    """Test endpoint to trigger a Sentry error"""
    division_by_zero = 1 / 0
    return {"message": "This should not be reached"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 

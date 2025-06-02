print("!!!!!!!!!!!! HELLO FROM THE VERY LATEST APP.MAIN.PY VERSION 12345 !!!!!!!!!!!!")
import sys
import os
from dotenv import load_dotenv
import logging

# Attempt to aggressively clear app.core.security from sys.modules
# This is a debugging step to combat potential stale module caching issues.
if 'app.core.security' in sys.modules:
    print("[BACKEND app.main.py] Attempting to remove 'app.core.security' from sys.modules")
    del sys.modules['app.core.security']
if 'app.core' in sys.modules: # also try to remove the parent package to be thorough
    print("[BACKEND app.main.py] Attempting to remove 'app.core' from sys.modules")
    del sys.modules['app.core']

# Log the Python executable and sys.path at the very beginning
print(f"[BACKEND app.main.py] Python Executable: {sys.executable}")
print(f"[BACKEND app.main.py] sys.path: {sys.path}")
print(f"[BACKEND app.main.py] CWD: {os.getcwd()}")

load_dotenv()
from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("adhub_app") 
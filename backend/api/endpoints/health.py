from fastapi import APIRouter, Depends
# from app.core.firebase import get_firestore  # TODO: Migrate to Supabase
from datetime import datetime
from typing import Dict, Any

router = APIRouter()

@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """Check the health of the application and its dependencies."""
    try:
        # Check Firestore connection
        # db = get_firestore()
        # db.collection("health").document("check").set({
        #     "timestamp": datetime.utcnow(),
        #     "status": "ok"
        # })
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "dependencies": {
                "firestore": "disconnected",
                "api": "operational"
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "dependencies": {
                "firestore": "disconnected",
                "api": "operational"
            },
            "error": str(e)
        } 
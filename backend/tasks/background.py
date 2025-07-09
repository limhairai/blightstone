from fastapi import BackgroundTasks
from typing import Callable, Any, Dict
import asyncio
from functools import wraps
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class BackgroundTaskManager:
    def __init__(self):
        self.tasks: Dict[str, asyncio.Task] = {}

    async def add_task(self, task_id: str, func: Callable, *args, **kwargs) -> None:
        """Add a background task."""
        if task_id in self.tasks:
            logger.warning(f"Task {task_id} already exists")
            return

        try:
            task = asyncio.create_task(func(*args, **kwargs))
            self.tasks[task_id] = task
            logger.info(f"Added background task {task_id}")
        except Exception as e:
            logger.error(f"Error adding background task {task_id}: {str(e)}")
            raise

    async def cancel_task(self, task_id: str) -> None:
        """Cancel a background task."""
        if task_id in self.tasks:
            task = self.tasks[task_id]
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                logger.info(f"Cancelled background task {task_id}")
            del self.tasks[task_id]

    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """Get the status of a background task."""
        if task_id not in self.tasks:
            return {"status": "not_found"}
        
        task = self.tasks[task_id]
        if task.done():
            if task.exception():
                return {"status": "error", "error": str(task.exception())}
            return {"status": "completed"}
        return {"status": "running"}

background_task_manager = BackgroundTaskManager()

def background_task(task_id: str):
    """Decorator for background tasks."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            await background_task_manager.add_task(task_id, func, *args, **kwargs)
        return wrapper
    return decorator

# Auto-sync functionality
async def auto_sync_dolphin_assets():
    """Auto-sync Dolphin assets every 3-4 hours to keep data fresh"""
    try:
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from app.services.dolphin_service import DolphinCloudAPI
        from app.core.supabase_client import get_supabase_client
        
        logger.info("🔄 Starting auto-sync of Dolphin assets...")
        
        supabase = get_supabase_client()
        dolphin_api = DolphinCloudAPI()
        
        # Get both profiles and CABs (ad accounts)
        profiles_data = await dolphin_api.get_fb_accounts()
        cabs_data = await dolphin_api.get_fb_cabs()
        
        discovered_count = 0
        
        # Process profiles
        for profile in profiles_data:
            try:
                profile_asset_data = {
                    "type": "profile",
                    "dolphin_id": profile["id"],
                    "name": profile["name"],
                    "status": "active" if profile["status"] == "ACTIVE" else "inactive",
                    "metadata": profile,
                    "last_synced_at": datetime.now(timezone.utc).isoformat()
                }
                
                supabase.table("asset").upsert(profile_asset_data, on_conflict="type,dolphin_id").execute()
                discovered_count += 1
                
                # Process Business Managers for this profile
                bm_list = profile.get("bms", [])
                for bm in bm_list:
                    bm_id = bm.get("id") or bm.get("business_id")
                    bm_metadata = dict(bm)
                    bm_metadata["managing_profile"] = profile["name"]
                    bm_metadata["managing_profiles"] = [{"name": profile["name"], "id": profile["id"]}]
                    
                    bm_asset_data = {
                        "type": "business_manager",
                        "dolphin_id": bm_id,
                        "name": bm["name"],
                        "status": "active",
                        "metadata": bm_metadata,
                        "last_synced_at": datetime.now(timezone.utc).isoformat()
                    }
                    
                    supabase.table("asset").upsert(bm_asset_data, on_conflict="type,dolphin_id").execute()
                    discovered_count += 1
                    
            except Exception as e:
                logger.error(f"Error processing profile {profile.get('id', 'unknown')}: {str(e)}")
        
        # Process CABs (ad accounts)
        for cab in cabs_data:
            try:
                cab_id = cab["id"]
                cab_name = cab["name"]
                cab_status = cab["status"]
                balance = cab.get("balance", 0)
                
                # Map Dolphin status to our database status
                if cab_status == "ACTIVE":
                    status = "active"
                elif cab_status == "SUSPENDED":
                    status = "suspended"
                elif cab_status == "RESTRICTED":
                    status = "restricted"
                elif cab_status == "TOKEN_ERROR":
                    status = "inactive"
                else:
                    status = "inactive"
                
                # Get managing profile info
                managing_profiles = cab.get("accounts", [])
                managing_profile_name = managing_profiles[0]["name"] if managing_profiles else "Unknown"
                
                # Get business manager info
                business_managers = cab.get("bm", [])
                parent_bm_id = None
                parent_bm_name = "No BM"
                
                if business_managers:
                    parent_bm_id = business_managers[0].get("id") or business_managers[0].get("business_id")
                    parent_bm_name = business_managers[0].get("name", "No BM")
                
                # Create ad account asset with CRITICAL spend_cap data
                ad_account_data = {
                    "type": "ad_account",
                    "dolphin_id": cab_id,
                    "name": cab_name,
                    "status": status,
                    "metadata": {
                        "ad_account_id": cab["ad_account_id"],
                        "balance": balance,
                        "currency": cab.get("currency", "USD"),
                        "status": cab_status,
                        "managing_profile": managing_profile_name,
                        "business_manager": parent_bm_name,
                        "business_manager_id": parent_bm_id,
                        "managing_profiles": managing_profiles,
                        "business_managers": business_managers,
                        "spend_cap": cab.get("spend_cap"),  # CRITICAL: This is the spend limit
                        "amount_spent": cab.get("amount_spent", 0),
                        "ads_count": cab.get("ads_count", 0),
                        "last_sync_date": cab.get("last_sync_date"),
                        "timezone_id": cab.get("timezone_id", "UTC")
                    },
                    "last_synced_at": datetime.now(timezone.utc).isoformat()
                }
                
                supabase.table("asset").upsert(ad_account_data, on_conflict="type,dolphin_id").execute()
                discovered_count += 1
                
            except Exception as e:
                logger.error(f"Error processing CAB {cab.get('id', 'unknown')}: {str(e)}")
        
        logger.info(f"🔄 Auto-sync completed successfully. Updated {discovered_count} assets")
        
    except Exception as e:
        logger.error(f"🔄 Auto-sync failed: {str(e)}")
        raise

class AutoSyncScheduler:
    """Scheduler for auto-syncing Dolphin assets"""
    
    def __init__(self):
        self.running = False
        self.sync_task = None
        
    async def start_scheduler(self):
        """Start the auto-sync scheduler"""
        if self.running:
            logger.warning("Auto-sync scheduler already running")
            return
            
        self.running = True
        logger.info("🔄 Starting auto-sync scheduler (every 3.5 hours)")
        
        while self.running:
            try:
                # Run sync immediately on startup
                await auto_sync_dolphin_assets()
                
                # Wait 3.5 hours (12600 seconds) before next sync
                # This prevents hitting Facebook rate limits while keeping data fresh
                await asyncio.sleep(12600)  # 3.5 hours
                
            except Exception as e:
                logger.error(f"🔄 Auto-sync scheduler error: {str(e)}")
                # Wait 30 minutes before retrying on error
                await asyncio.sleep(1800)  # 30 minutes
    
    async def stop_scheduler(self):
        """Stop the auto-sync scheduler"""
        self.running = False
        if self.sync_task:
            self.sync_task.cancel()
        logger.info("🔄 Auto-sync scheduler stopped")

# Global scheduler instance
auto_sync_scheduler = AutoSyncScheduler() 
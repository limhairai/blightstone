"""
Dolphin Asset Management API Endpoints
Handles discovery, binding, and assignment of Dolphin Cloud assets to clients
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import logging
import uuid
import requests
from pydantic import BaseModel

from ...core.security import get_current_user, require_superuser
from ...core.supabase_client import get_supabase_client
from ...schemas.user import UserRead as User
from ...services.dolphin_service import DolphinCloudAPI
from ...core.config import settings
try:
    import sys
    import os
    backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    if backend_root not in sys.path:
        sys.path.insert(0, backend_root)
    from tasks.background import auto_sync_dolphin_assets, auto_sync_scheduler
except ImportError as e:
    logger.error(f"Failed to import auto-sync components: {e}")
    auto_sync_dolphin_assets = None
    auto_sync_scheduler = None

logger = logging.getLogger(__name__)
router = APIRouter()

# ============================================================================
# Debug endpoint to examine Dolphin API structure
# ============================================================================

@router.get("/debug/dolphin-structure")
async def debug_dolphin_structure(
    current_user: User = Depends(require_superuser)
):
    """Debug endpoint to examine the raw structure of Dolphin API response"""
    try:
        dolphin_api = DolphinCloudAPI()
        
        # Get both profiles and CABs (ad accounts)
        profiles_data = await dolphin_api.get_fb_accounts()
        cabs_data = await dolphin_api.get_fb_cabs()
        
        result = {
            "profiles": {
                "total_items": len(profiles_data),
                "sample_keys": list(profiles_data[0].keys()) if profiles_data else [],
                "sample_item": profiles_data[0] if profiles_data else None
            },
            "cabs_ad_accounts": {
                "total_items": len(cabs_data),
                "sample_keys": list(cabs_data[0].keys()) if cabs_data else [],
                "sample_item": cabs_data[0] if cabs_data else None
            }
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Error in debug endpoint: {e}")
        return {"error": str(e)}

# ============================================================================
# Asset Discovery & Sync
# ============================================================================

@router.post("/sync/discover")
async def discover_dolphin_assets(
    force_refresh: bool = False,
    current_user: User = Depends(require_superuser)
):
    """
    Discover all assets from Dolphin Cloud and register them in our Supabase database
    This uses the correct API endpoints:
    - /api/v1/fb-accounts for Facebook Profiles
    - /api/v1/fb-cabs for Facebook Ad Accounts (CABs = Cabinets)
    """
    try:
        supabase = get_supabase_client()
        dolphin_api = DolphinCloudAPI()
        
        discovered_count = 0
        updated_count = 0
        errors = []
        
        # If force_refresh, clean up any BMs with business names or placeholder names
        if force_refresh:
            logger.info("🧹 Force refresh: Cleaning up bad BM names...")
            try:
                # Delete BMs with business names or placeholder names - they'll be recreated with correct names
                bad_bm_patterns = ["脸谱网中国区总代理", "YinoLink易诺", "AXIS Dealer LTD", "Popster LLC", "BM-"]
                
                # Also delete any BMs that start with "BM-" (all placeholder names)
                all_placeholder_bms = supabase.table("asset").select("*").eq("type", "business_manager").like("name", "BM-%").execute()
                if all_placeholder_bms.data:
                    for placeholder_bm in all_placeholder_bms.data:
                        supabase.table("asset").delete().eq("asset_id", placeholder_bm["asset_id"]).execute()
                        logger.info(f"🧹 Deleted placeholder BM: {placeholder_bm['name']} ({placeholder_bm['dolphin_id']})")
                        updated_count += 1
                for pattern in bad_bm_patterns:
                    bad_bms_response = supabase.table("asset").select("*").eq("type", "business_manager").ilike("name", f"%{pattern}%").execute()
                    if bad_bms_response.data:
                        for bad_bm in bad_bms_response.data:
                            supabase.table("asset").delete().eq("asset_id", bad_bm["asset_id"]).execute()
                            logger.info(f"🧹 Deleted bad BM: {bad_bm['name']} ({bad_bm['dolphin_id']})")
                            updated_count += 1
            except Exception as e:
                logger.warning(f"🧹 Error during cleanup: {e}")
        
        # ========================================================================
        # 1. Get Facebook Profiles (these manage the ad accounts)
        # ========================================================================
        profiles_data = await dolphin_api.get_fb_accounts()
        logger.info(f"🔍 Retrieved {len(profiles_data)} profiles")
        
        for profile in profiles_data:
            try:
                # Process Profile
                profile_asset_data = {
                    "type": "profile",
                    "dolphin_id": profile["id"],
                    "name": profile["name"],
                    "status": "active" if profile["status"] == "ACTIVE" else "inactive",
                    "metadata": profile,
                    "last_synced_at": datetime.now(timezone.utc).isoformat()
                }
                
                # Upsert profile
                supabase.table("asset").upsert(profile_asset_data, on_conflict="type,dolphin_id").execute()
                discovered_count += 1

                # Process Business Managers for this profile
                bm_list = profile.get("bms", [])
                logger.info(f"🔍 Profile '{profile['name']}' has {len(bm_list)} BMs")
                
                for bm in bm_list:
                    # Use "id" field for BM ID, fallback to "business_id"
                    bm_id = bm.get("id") or bm.get("business_id")
                    
                    # Add managing profile info to BM metadata for team detection
                    bm_metadata = dict(bm)
                    bm_metadata["managing_profile"] = profile["name"]
                    bm_metadata["managing_profiles"] = [{"name": profile["name"], "id": profile["id"]}]
                    
                    bm_asset_data = {
                        "type": "business_manager",
                        "dolphin_id": bm_id,
                        "name": bm["name"],  # This is the CORRECT BM name
                        "status": "active",
                        "metadata": bm_metadata,
                        "last_synced_at": datetime.now(timezone.utc).isoformat()
                    }
                    
                    # Force update to ensure correct BM name is preserved
                    upsert_response = supabase.table("asset").upsert(bm_asset_data, on_conflict="type,dolphin_id").execute()
                    discovered_count += 1
                    logger.info(f"🏢 Processed BM from profile: {bm['name']} ({bm_id}) - Profile: {profile['name']}")
                    
            except Exception as e:
                error_msg = f"Error processing profile {profile.get('id', 'unknown')}: {str(e)}"
                errors.append(error_msg)
                logger.error(error_msg)
        
        # ========================================================================
        # 2. Get Facebook Ad Accounts (CABs = Cabinets) - THE REAL AD ACCOUNTS
        # ========================================================================
        cabs_data = await dolphin_api.get_fb_cabs()

        logger.info(f"🔍 Retrieved {len(cabs_data)} CABs")
        
        for i, cab in enumerate(cabs_data):
            try:
                # Extract key information
                cab_id = cab["id"]
                cab_name = cab["name"]
                cab_status = cab["status"]
                balance = cab.get("balance", 0)
                currency = cab.get("currency", "USD")
                
                # Map Dolphin status to our database status - UPDATED TO INCLUDE RESTRICTED
                # Database constraint needs to be updated to allow: 'active', 'inactive', 'suspended', 'restricted'
                # Dolphin statuses: ACTIVE, TOKEN_ERROR, SUSPENDED, RESTRICTED
                if cab_status == "ACTIVE":
                    status = "active"
                elif cab_status == "SUSPENDED":
                    status = "suspended"  # Facebook suspended the account
                elif cab_status == "RESTRICTED":
                    status = "restricted"  # Facebook restricted the account - show as restricted to client
                elif cab_status == "TOKEN_ERROR":
                    status = "inactive"  # Dolphin can't connect (auth issue) - hide from client
                else:
                    # Unknown status - default to inactive to be safe
                    status = "inactive"
                
                # Get managing profile info
                managing_profiles = cab.get("accounts", [])
                managing_profile_name = managing_profiles[0]["name"] if managing_profiles else "Unknown"
                
                # Get business manager info - try multiple fields
                business_managers = cab.get("bm", [])
                parent_bm_id = None
                parent_bm_name = "No BM"
                
                # First try the 'bm' field (array format) - this has the correct BM name
                if business_managers:
                    # The BM structure uses "id" not "business_id"
                    parent_bm_id = business_managers[0].get("id") or business_managers[0].get("business_id")
                    parent_bm_name = business_managers[0].get("name", "No BM")
                    logger.info(f"🔍 CAB '{cab_name}' has BM: {parent_bm_name} ({parent_bm_id})")
                    
                    # Check if BM already exists from profile processing - don't overwrite!
                    try:
                        existing_bm_response = supabase.table("asset").select("name").eq("type", "business_manager").eq("dolphin_id", parent_bm_id).execute()
                        if existing_bm_response.data and len(existing_bm_response.data) > 0:
                            # BM already exists from profile processing, use that name
                            parent_bm_name = existing_bm_response.data[0]["name"]
                            logger.info(f"🏢 Using existing BM from profile: {parent_bm_name} ({parent_bm_id})")
                        else:
                            # BM doesn't exist in our database - this means it's not managed by our profiles
                            # For these cases, we'll still track the BM relationship but mark it as unmanaged
                            logger.warning(f"🏢 BM {parent_bm_name} ({parent_bm_id}) not found in profiles - ad account will show 'No BM'")
                            parent_bm_id = None
                            parent_bm_name = "No BM"
                    except Exception as e:
                        logger.warning(f"Error checking existing BM: {e}")
                        parent_bm_id = None
                        parent_bm_name = "No BM"
                
                # If no BM found in 'bm' field, check business field as fallback
                if not parent_bm_id:
                    business_info = cab.get("business")
                    if business_info and business_info.get("id"):
                        business_bm_id = business_info["id"]
                        business_bm_name = business_info.get("name", "Unknown BM")
                        
                        # Try to find existing BM asset first to get the correct name
                        try:
                            existing_bm_response = supabase.table("asset").select("name").eq("type", "business_manager").eq("dolphin_id", business_bm_id).execute()
                            if existing_bm_response.data and len(existing_bm_response.data) > 0:
                                parent_bm_name = existing_bm_response.data[0]["name"]
                                parent_bm_id = business_bm_id
                            else:
                                # This is a business entity, not a BM - don't use it
                                parent_bm_id = None
                                parent_bm_name = "No BM"
                        except Exception as e:
                            parent_bm_id = None
                            parent_bm_name = "No BM"
                
                # Create ad account asset
                ad_account_data = {
                    "type": "ad_account",
                    "dolphin_id": cab_id,
                    "name": cab_name,
                    "status": status,
                    "metadata": {
                        "ad_account_id": cab["ad_account_id"],
                        "balance": balance,
                        "currency": currency,
                        "status": cab_status,
                        "managing_profile": managing_profile_name,
                        "business_manager": parent_bm_name,
                        "business_manager_id": parent_bm_id,
                        "managing_profiles": managing_profiles,
                        "business_managers": business_managers,
                        "pixel_id": cab.get("pixel_id"),
                        "spend_cap": cab.get("spend_cap"),
                        "amount_spent": cab.get("amount_spent", 0),
                        "ads_count": cab.get("ads_count", 0),
                        "last_sync_date": cab.get("last_sync_date")
                    },
                    "last_synced_at": datetime.now(timezone.utc).isoformat()
                }
                
                # Upsert ad account
                supabase.table("asset").upsert(ad_account_data, on_conflict="type,dolphin_id").execute()
                discovered_count += 1
                
            except Exception as e:
                error_msg = f"Error processing CAB {cab.get('id', 'unknown')}: {str(e)}"
                errors.append(error_msg)
                logger.error(error_msg)

        # ========================================================================
        # 3. Get Facebook Pages - NEW ADDITION
        # ========================================================================
        pages_data = await dolphin_api.get_fb_pages()
        logger.info(f"🔍 Retrieved {len(pages_data)} Facebook Pages")
        
        for i, page in enumerate(pages_data):
            try:
                # Extract key information
                page_id = page["id"]
                page_name = page["name"]
                page_status = page.get("status", "active")
                
                # Get page metadata
                page_url = page.get("link", "")
                category = page.get("category", "")
                followers_count = page.get("fan_count", 0)
                likes_count = page.get("likes", 0)
                verification_status = "verified" if page.get("is_verified", False) else "unverified"
                
                # Get managing profile info
                managing_profiles = page.get("accounts", [])
                managing_profile_name = managing_profiles[0]["name"] if managing_profiles else "Unknown"
                
                # Get business manager info
                business_managers = page.get("bm", [])
                parent_bm_id = None
                parent_bm_name = "No BM"
                
                if business_managers:
                    parent_bm_id = business_managers[0].get("id") or business_managers[0].get("business_id")
                    parent_bm_name = business_managers[0].get("name", "No BM")
                
                # Create page asset data
                page_asset_data = {
                    "type": "facebook_page",
                    "dolphin_id": page_id,
                    "name": page_name,
                    "status": "active" if page_status.upper() == "ACTIVE" else "inactive",
                    "metadata": {
                        "page_url": page_url,
                        "category": category,
                        "followers_count": followers_count,
                        "likes_count": likes_count,
                        "verification_status": verification_status,
                        "managing_profile": managing_profile_name,
                        "parent_bm_id": parent_bm_id,
                        "parent_bm_name": parent_bm_name,
                        "facebook_page_id": page_id,
                        "raw_data": page
                    },
                    "last_synced_at": datetime.now(timezone.utc).isoformat()
                }
                
                # Upsert page
                supabase.table("asset").upsert(page_asset_data, on_conflict="type,dolphin_id").execute()
                discovered_count += 1
                logger.info(f"📄 Processed Page: {page_name} ({page_id}) - BM: {parent_bm_name}")
                
            except Exception as e:
                error_msg = f"Error processing Page {page.get('id', 'unknown')}: {str(e)}"
                errors.append(error_msg)
                logger.error(error_msg)

        return {
            "success": True,
            "profiles_found": len(profiles_data),
            "business_managers_found": sum(len(p.get("bms", [])) for p in profiles_data),
            "ad_accounts_found": len(cabs_data),
            "pages_found": len(pages_data),
            "assets_discovered": discovered_count,
            "assets_updated": updated_count,
            "errors": errors
        }
        
    except Exception as e:
        logger.error(f"Error in asset discovery: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Asset discovery failed: {str(e)}")

@router.post("/sync/auto")
async def trigger_auto_sync(
    current_user: User = Depends(require_superuser)
):
    """Manually trigger the auto-sync process"""
    if not auto_sync_dolphin_assets:
        raise HTTPException(status_code=503, detail="Auto-sync service not available")
    
    try:
        logger.info("🔄 Manual auto-sync triggered by admin")
        await auto_sync_dolphin_assets()
        return {
            "success": True,
            "message": "Auto-sync completed successfully",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"🔄 Manual auto-sync failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Auto-sync failed: {str(e)}")

@router.get("/sync/status")
async def get_sync_status(
    current_user: User = Depends(require_superuser)
):
    """Get the status of the auto-sync scheduler and last actual sync time"""
    try:
        supabase = get_supabase_client()
        
        # Get the most recent sync timestamp from the database
        last_sync_response = supabase.table("asset").select("last_synced_at").order("last_synced_at", desc=True).limit(1).execute()
        
        last_sync_time = None
        if last_sync_response.data and len(last_sync_response.data) > 0:
            last_sync_time = last_sync_response.data[0].get("last_synced_at")
        
        if not auto_sync_scheduler:
            return {
                "scheduler_running": False,
                "next_sync_in_hours": 3.5,
                "sync_interval": "3.5 hours",
                "last_sync": last_sync_time,
                "last_check": datetime.now(timezone.utc).isoformat(),
                "status": "Auto-sync service not available"
            }
        
        return {
            "scheduler_running": auto_sync_scheduler.running,
            "next_sync_in_hours": 3.5,  # Fixed interval
            "sync_interval": "3.5 hours",
            "last_sync": last_sync_time,
            "last_check": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"🔄 Failed to get sync status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get sync status: {str(e)}")

@router.post("/sync/discover-debug")
async def discover_dolphin_assets_debug(
    current_user: User = Depends(require_superuser)
):
    """Debug version of asset discovery to isolate the 'assets' undefined error"""
    try:
        logger.info("🔍 Starting debug sync...")
        supabase = get_supabase_client()
        dolphin_api = DolphinCloudAPI()
        
        # Test basic connectivity
        logger.info("🔍 Testing Supabase connectivity...")
        test_response = supabase.table("asset").select("count", count="exact").execute()
        logger.info(f"🔍 Supabase test response: {test_response}")
        
        # Test Dolphin API
        logger.info("🔍 Testing Dolphin API...")
        profiles_data = await dolphin_api.get_fb_accounts()
        cabs_data = await dolphin_api.get_fb_cabs()
        
        logger.info(f"🔍 Retrieved {len(profiles_data)} profiles and {len(cabs_data)} CABs")
        
        # Simple return without complex processing
        return {
            "success": True,
            "debug": True,
            "profiles_count": len(profiles_data),
            "cabs_count": len(cabs_data),
            "message": "Debug sync completed successfully"
        }
        
    except Exception as e:
        logger.error(f"🔍 Debug sync error: {e}")
        raise HTTPException(status_code=500, detail=f"Debug sync failed: {str(e)}")

@router.get("/all-assets")
async def get_all_assets(
    asset_type: Optional[str] = Query(None, description="Filter by asset type"),
    unbound_only: bool = Query(False, description="Return only unbound assets"),
    current_user: User = Depends(require_superuser)
):
    """
    Get all assets with their binding status.
    """
    logger.info(f"🔍 Fetching all assets (type={asset_type}, unbound_only={unbound_only})")
    
    try:
        supabase = get_supabase_client()
        
        # Build query for new asset table
        query = supabase.table("asset").select("*")
        
        if asset_type:
            query = query.eq("type", asset_type)

        # Note: unbound_only filtering will be done after fetching binding data
        query = query.order("created_at", desc=True)

        response = query.execute()

        if response.data is None:
            return []

        logger.info(f"🔍 Raw response data count: {len(response.data)}")
        if response.data:
            logger.info(f"🔍 Sample asset: {response.data[0]}")

        # Get all bindings first
        bindings_response = supabase.table("asset_binding").select("""
            asset_id,
            organization_id,
            status,
            bound_at
        """).eq("status", "active").execute()
        
        # Get organization names separately
        org_names = {}
        if bindings_response.data:
            org_ids = list(set(binding["organization_id"] for binding in bindings_response.data))
            orgs_response = supabase.table("organizations").select("organization_id, name").in_("organization_id", org_ids).execute()
            if orgs_response.data:
                org_names = {org["organization_id"]: org["name"] for org in orgs_response.data}
        
        # Create a mapping of asset_id to binding info
        binding_map = {}
        if bindings_response.data:
            for binding in bindings_response.data:
                org_id = binding["organization_id"]
                binding_map[binding["asset_id"]] = {
                    "organization_id": org_id,
                    "organization_name": org_names.get(org_id, f"Org-{org_id}"),
                    "bound_at": binding["bound_at"]
                }
        
        logger.info(f"🔍 Found {len(binding_map)} active bindings")
        
        # Process the data to add binding information
        processed_assets = []
        for asset in response.data:
            # response.data comes from our database, so it already has asset_id and dolphin_id
            asset_id = asset.get("asset_id")  # This is our database primary key
            dolphin_id = asset.get("dolphin_id")  # This is the external Dolphin ID
                
            binding_info = binding_map.get(asset_id)
            
            logger.info(f"🔍 Asset {asset.get('name', 'Unknown')} ({asset_id}) binding: {binding_info}")
            
            # Transform to match frontend expectations
            processed_asset = {
                "asset_id": asset_id,  # Frontend expects 'asset_id' (our database primary key)
                "id": asset_id,  # Also provide 'id' for compatibility
                "name": asset.get("name"),
                "type": asset.get("type"),
                "asset_type": asset.get("type"),  # Alias for compatibility
                "dolphin_id": dolphin_id,  # Use the Dolphin ID we extracted
                "dolphin_asset_id": dolphin_id,  # Alias for compatibility
                "status": asset.get("status"),
                "metadata": asset.get("metadata"),
                "asset_metadata": asset.get("metadata"),  # Alias for compatibility
                "last_sync_at": asset.get("last_sync_at"),
                "created_at": asset.get("created_at"),
                "updated_at": asset.get("updated_at"),
                "organization_id": binding_info["organization_id"] if binding_info else None,
                "organization_name": binding_info["organization_name"] if binding_info else None,
                "bound_at": binding_info["bound_at"] if binding_info else None
            }
            
            # Apply unbound_only filter if requested
            if unbound_only:
                # Only include assets that have no binding info (i.e., are unbound)
                if binding_info is None:
                    processed_assets.append(processed_asset)
            else:
                processed_assets.append(processed_asset)

        logger.info(f"🔍 Returning {len(processed_assets)} assets (unbound_only={unbound_only})")
        return {"assets": processed_assets}
    except Exception as e:
        logger.error(f"An unexpected error occurred while fetching assets: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred: {str(e)}")

# ============================================================================
# Asset Binding Operations
# ============================================================================

class BindAssetRequest(BaseModel):
    asset_id: str
    organization_id: str
    bm_id: Optional[str] = None

@router.post("/bind")
async def bind_asset_to_client(
    request: BindAssetRequest,
    auto_bind_related: bool = Query(False, description="Auto-bind related ad accounts when binding a Business Manager"),
    current_user: User = Depends(require_superuser)
):
    """
    Bind an asset (Business Manager or Ad Account) to a client organization.
    For Business Managers: Only requires organization_id
    For Ad Accounts: Requires both organization_id and bm_id
    """
    logger.info(f"🔗 Asset Bind Request: asset_id={request.asset_id}, org_id={request.organization_id}, bm_id={request.bm_id}")
    
    try:
        supabase = get_supabase_client()
        
        # Verify asset exists
        asset_response = supabase.table("asset").select("*").eq("asset_id", request.asset_id).execute()
        if not (hasattr(asset_response, 'data') and asset_response.data):
            raise HTTPException(status_code=404, detail="Asset not found")
        
        asset = asset_response.data[0]
        asset_type = asset["type"]
        
        # Validation based on asset type
        if asset_type == "ad_account" and not request.bm_id:
            raise HTTPException(status_code=400, detail="Business Manager ID (bm_id) is required for ad account binding")
        
        # Check for existing active bindings
        logger.info(f"🔗 Checking for existing bindings for asset: {request.asset_id}")
        try:
            existing_bindings = supabase.table("asset_binding").select("binding_id, organization_id, status").eq("asset_id", request.asset_id).eq("status", "active").execute()
            
            if hasattr(existing_bindings, 'data') and existing_bindings.data:
                existing_org_id = existing_bindings.data[0]["organization_id"]
                if existing_org_id != request.organization_id:
                    raise HTTPException(status_code=400, detail=f"Asset is already bound to a different organization")
                else:
                    raise HTTPException(status_code=400, detail=f"Asset is already bound to this organization")
                    
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"🔗 Error querying existing bindings: {e}")
            raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")
        
        # For Business Manager binding, create a business_managers record first
        bm_id_for_binding = request.bm_id
        if asset_type == "business_manager":
            logger.info(f"🔗 Creating business_managers record for BM asset: {asset['dolphin_id']}")
            try:
                bm_record_data = {
                    "organization_id": request.organization_id,
                    "dolphin_business_manager_id": asset["dolphin_id"],
                    "status": "active"
                }
                
                bm_record_response = supabase.table("business_managers").insert(bm_record_data).execute()
                if hasattr(bm_record_response, 'data') and bm_record_response.data:
                    bm_id_for_binding = bm_record_response.data[0]["bm_id"]
                    logger.info(f"🔗 Created business_managers record with bm_id: {bm_id_for_binding}")
                else:
                    logger.warning(f"🔗 Failed to create business_managers record")
                    
            except Exception as e:
                logger.error(f"🔗 Error creating business_managers record: {e}")
                # Continue without failing - we can still create the binding
        
        # Create main binding
        binding_data = {
            "asset_id": request.asset_id,
            "organization_id": request.organization_id,
            "status": "active",
            "bound_at": datetime.now(timezone.utc).isoformat(),
            "bound_by": current_user.uid
        }
        
        logger.info(f"🔗 Creating binding: {binding_data}")
        try:
            binding_response = supabase.table("asset_binding").insert(binding_data).execute()
            logger.info(f"🔗 Insert response type: {type(binding_response)}")
            logger.info(f"🔗 Insert response data: {binding_response.data if hasattr(binding_response, 'data') else 'No data'}")
        except Exception as e:
            logger.error(f"🔗 Error inserting binding: {e}")
            raise HTTPException(status_code=500, detail=f"Database insert error: {str(e)}")
        
        if not hasattr(binding_response, 'data') or not binding_response.data:
            logger.error(f"🔗 Insert failed - no data returned")
            raise HTTPException(status_code=500, detail="Failed to create binding")
        
        main_binding_id = binding_response.data[0]["binding_id"]
        logger.info(f"🔗 Main binding created successfully: {main_binding_id}")
        
        # Auto-bind related ad accounts if requested and this is a Business Manager
        related_bindings = []
        if auto_bind_related and asset["type"] == "business_manager":
            logger.info(f"🔗 Auto-binding related ad accounts for BM: {asset['dolphin_id']}")
            
            try:
                # Find all ad accounts that belong to this Business Manager (using metadata approach)
                related_ads_response = supabase.table("asset").select("*").eq("type", "ad_account").execute()
                
                all_ad_accounts = related_ads_response.data if hasattr(related_ads_response, 'data') else []
                # Filter for ad accounts that belong to this business manager
                related_ad_accounts = [
                    ad for ad in all_ad_accounts 
                    if ad.get("metadata", {}).get("business_manager_id") == asset["dolphin_id"]
                ]
                logger.info(f"🔗 Found {len(related_ad_accounts)} related ad accounts")
                
                for ad_account in related_ad_accounts:
                    # Check if this ad account is already bound
                    existing_ad_bindings = supabase.table("asset_binding").select("binding_id").eq("asset_id", ad_account["asset_id"]).eq("status", "active").execute()
                    
                    if not (hasattr(existing_ad_bindings, 'data') and existing_ad_bindings.data):
                        # Bind this ad account using the same organization
                        ad_binding_data = {
                            "asset_id": ad_account["asset_id"],
                            "organization_id": request.organization_id,
                            "status": "active",
                            "bound_at": datetime.now(timezone.utc).isoformat(),
                            "bound_by": current_user.uid
                        }
                        
                        ad_binding_response = supabase.table("asset_binding").insert(ad_binding_data).execute()
                        if hasattr(ad_binding_response, 'data') and ad_binding_response.data:
                            related_bindings.append({
                                "binding_id": ad_binding_response.data[0]["binding_id"],
                                "asset_name": ad_account["name"],
                                "asset_type": "ad_account"
                            })
                            logger.info(f"🔗 Auto-bound ad account: {ad_account['name']}")
                        else:
                            logger.warning(f"🔗 Failed to auto-bind ad account: {ad_account['name']}")
                    else:
                        logger.info(f"🔗 Ad account already bound, skipping: {ad_account['name']}")
                        
            except Exception as e:
                logger.error(f"🔗 Error auto-binding related assets: {e}")
                # Don't fail the main binding if auto-binding fails
        
        return {
            "success": True,
            "binding_id": main_binding_id,
            "message": "Asset bound successfully",
            "related_bindings": related_bindings,
            "auto_bound_count": len(related_bindings),
            "business_manager_id": bm_id_for_binding if asset_type == "business_manager" else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"🔗 Error binding asset: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bind-business-manager-with-accounts")
async def bind_business_manager_with_accounts(
    request: BindAssetRequest,
    current_user: User = Depends(require_superuser)
):
    """
    Bind a Business Manager and automatically bind all its associated ad accounts.
    This is a convenience endpoint that combines BM binding with auto-binding of related ad accounts.
    """
    logger.info(f"🏢 BM + Accounts Bind Request: asset_id={request.asset_id}, org_id={request.organization_id}")
    
    try:
        supabase = get_supabase_client()
        
        # Verify this is a Business Manager
        asset_response = supabase.table("asset").select("*").eq("asset_id", request.asset_id).execute()
        if not (hasattr(asset_response, 'data') and asset_response.data):
            raise HTTPException(status_code=404, detail="Asset not found")
        
        asset = asset_response.data[0]
        if asset["type"] != "business_manager":
            raise HTTPException(status_code=400, detail="This endpoint is only for Business Managers")
        
        # Use the main bind endpoint with auto_bind_related=True
        from fastapi import Request
        from urllib.parse import urlencode
        
        # Create a mock request object to pass the auto_bind_related parameter
        result = await bind_asset_to_client(request, auto_bind_related=True, current_user=current_user)
        
        # Get the BM metadata to show ad accounts count
        bm_metadata = asset.get("metadata", {})
        expected_ad_accounts = bm_metadata.get("cabs_count", 0)
        
        return {
            "success": True,
            "business_manager": {
                "id": asset["asset_id"],
                "name": asset["name"],
                "facebook_id": asset["dolphin_id"]
            },
            "binding_id": result["binding_id"],
            "expected_ad_accounts": expected_ad_accounts,
            "auto_bound_ad_accounts": result["auto_bound_count"],
            "related_bindings": result["related_bindings"],
            "message": f"Business Manager '{asset['name']}' bound successfully with {result['auto_bound_count']} ad accounts"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"🏢 Error binding BM with accounts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/unbind/{binding_id}")
async def unbind_asset_from_client(
    binding_id: str,
    cascade: bool = Query(True, description="Auto-unbind related ad accounts when unbinding a Business Manager"),
    reason: Optional[str] = None,
    current_user: User = Depends(require_superuser)
):
    """Unbind an asset from a client with optional cascading for Business Managers"""
    try:
        supabase = get_supabase_client()
        
        # Get binding with asset info (use LEFT JOIN to handle orphaned bindings)
        binding_response = supabase.table("asset_binding").select("""
            *,
            asset(type, dolphin_id, name)
        """).eq("binding_id", binding_id).single().execute()
        
        if not binding_response.data:
            raise HTTPException(status_code=404, detail="Binding not found")
        
        binding = binding_response.data
        asset = binding.get("asset")
        
        # Handle orphaned bindings (binding exists but asset is missing)
        if not asset:
            logger.warning(f"🔗 Unbinding orphaned binding: {binding_id} (asset_id: {binding.get('asset_id')})")
            asset_type = "orphaned"
            asset_name = f"Missing Asset ({binding.get('asset_id', 'unknown')[:8]}...)"
        else:
            asset_type = asset["type"]
            asset_name = asset["name"]
        
        logger.info(f"🔗 Unbinding {asset_type} asset: {asset_name} (binding_id: {binding_id})")
        
        unbind_count = 1
        
        # If this is a Business Manager and cascade is enabled, unbind all associated ad accounts FIRST
        if asset_type == "business_manager" and cascade and asset:
            logger.info(f"🔗 Cascading unbind for BM: {asset['dolphin_id']}")
            
            # Find all ad accounts bound to this organization that belong to this BM
            related_bindings_response = supabase.table("asset_binding").select("""
                id,
                asset(type, metadata)
            """).eq("organization_id", binding["organization_id"]).eq("status", "active").execute()
            
            if related_bindings_response.data:
                for related_binding in related_bindings_response.data:
                    related_asset = related_binding.get("asset")
                    if (related_asset and 
                        related_asset["type"] == "ad_account" and 
                        related_asset.get("metadata", {}).get("business_manager_id") == asset["dolphin_id"]):
                        
                        # Unbind this related ad account
                        supabase.table("asset_binding").update({
                            "status": "inactive"
                        }).eq("binding_id", related_binding["binding_id"]).execute()
                        
                        unbind_count += 1
                        logger.info(f"🔗 Cascaded unbind for ad account: {related_binding['id']}")
            
            logger.info(f"🔗 Cascade complete for BM: {asset['dolphin_id']}")
        # For orphaned bindings, we can still cascade by looking at the organization
        elif asset_type == "orphaned" and cascade:
            logger.info(f"🔗 Attempting cascade for orphaned BM binding: {binding_id}")
            
            # Try to find related ad accounts by organization
            # This is a best-effort cleanup for orphaned Business Manager bindings
            related_bindings_response = supabase.table("asset_binding").select("""
                binding_id,
                asset_id
            """).eq("organization_id", binding["organization_id"]).eq("status", "active").execute()
            
            if related_bindings_response.data:
                # For orphaned bindings, we can't determine exact relationships
                # But we can clean up other orphaned bindings in the same organization
                for related_binding in related_bindings_response.data:
                    if related_binding["binding_id"] != binding_id:  # Don't unbind self
                        # Check if this related binding is also orphaned
                        asset_check = supabase.table("asset").select("asset_id").eq("asset_id", related_binding["asset_id"]).execute()
                        if not asset_check.data:  # This is also orphaned
                            supabase.table("asset_binding").update({
                                "status": "inactive"
                            }).eq("binding_id", related_binding["binding_id"]).execute()
                            
                            unbind_count += 1
                            logger.info(f"🔗 Cleaned up orphaned binding: {related_binding['id']}")
            
            logger.info(f"🔗 Orphaned binding cleanup complete")
        
        # Now update the main binding status to inactive (after cascade is complete)
        supabase.table("asset_binding").update({
            "status": "inactive"
        }).eq("binding_id", binding_id).execute()
        
        logger.info(f"🔗 Unbind complete: {unbind_count} assets unbound")
        
        return {
            "success": True,
            "message": f"Asset unbound successfully ({unbind_count} total assets affected)",
            "assets_unbound": unbind_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unbinding asset: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Client Asset Views
# ============================================================================

@router.get("/client/{organization_id}")
async def get_client_assets(
    organization_id: str,
    bm_id: Optional[str] = None,
    asset_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get all assets that are bound to a specific client organization.
    This replaces the old individual endpoints for ad accounts, bms, etc.
    """
    logger.info(f"🔍 Getting client assets for org: {organization_id}, bm_id: {bm_id}, asset_type: {asset_type}")
    
    try:
        supabase = get_supabase_client()
        
        # First, let's get all bindings for this organization to see what we're working with
        bindings_only_response = supabase.table("asset_binding").select("*").eq("organization_id", organization_id).eq("status", "active").execute()
        
        logger.info(f"🔍 Found {len(bindings_only_response.data) if bindings_only_response.data else 0} active bindings for organization {organization_id}")
        
        if bindings_only_response.data:
            for binding in bindings_only_response.data:
                asset_id = binding.get("asset_id")
                
                # Check if the corresponding asset exists
                asset_check = supabase.table("asset").select("asset_id, name, type").eq("asset_id", asset_id).execute()
                if asset_check.data:
                    logger.info(f"🔍 Asset exists: {asset_check.data[0]}")
                else:
                    logger.error(f"🔍 Asset NOT found in asset table for asset_id: {asset_id}")
        
        # Use the NEW schema (asset + asset_binding) - the clean schema
        logger.info(f"🔍 Using NEW schema (asset + asset_binding) for organization: {organization_id}")
        
        # Get assets from the NEW schema using the RPC function
        response = supabase.rpc("get_organization_assets", {
            "p_organization_id": organization_id,
            "p_asset_type": asset_type
        }).execute()
        
        if not hasattr(response, 'data') or not response.data:
            logger.info(f"🔍 No assets found in NEW schema for organization: {organization_id}")
            return []
        
        logger.info(f"🔍 NEW schema returned {len(response.data)} assets")
        
        client_assets = []
        
        for asset_data in response.data:
            # Transform to match expected frontend format
            asset_details = {
                "binding_id": asset_data["binding_id"],
                "asset_id": asset_data["id"],
                "asset_type": asset_data["type"],
                "name": asset_data["name"],
                "status": asset_data["status"],
                "binding_status": "active",  # RPC only returns active bindings
                "bound_at": asset_data["bound_at"],
                "bm_id": None,  # Not used in NEW schema
                "business_name": None,  # Not used in NEW schema
                "asset_metadata": asset_data.get("metadata"),
                "dolphin_asset_id": asset_data.get("dolphin_id"),
                "is_orphaned": False  # RPC only returns valid assets
            }
            
            client_assets.append(asset_details)
        
        logger.info(f"🔍 Returning {len(client_assets)} client assets")
        return client_assets

    except Exception as e:
        logger.error(f"Error fetching client assets for org {organization_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Debug and Testing Endpoints
# ============================================================================

@router.get("/debug/binding-check")
async def debug_binding_check(current_user: User = Depends(require_superuser)):
    """Debug endpoint to check binding relationships"""
    try:
        supabase = get_supabase_client()
        
        # Get all bindings
        bindings_resp = supabase.table("asset_binding").select("binding_id, asset_id").execute()
        
        return {
            "bindings_count": len(bindings_resp.data) if bindings_resp.data else 0,
            "sample_bindings": bindings_resp.data[:5] if bindings_resp.data else []
        }
        
    except Exception as e:
        logger.error(f"Debug binding check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/debug/database-check")
async def debug_database_check(
    current_user: User = Depends(require_superuser)
):
    """Check database table accessibility and basic structure"""
    try:
        supabase = get_supabase_client()
        
        tables_status = {}
        
        # Test asset table
        try:
            assets_resp = supabase.table("asset").select("*").limit(1).execute()
            tables_status["asset"] = {
                "accessible": True,
                "count": len(assets_resp.data) if assets_resp.data else 0,
                "sample_columns": list(assets_resp.data[0].keys()) if assets_resp.data else []
            }
        except Exception as e:
            tables_status["asset"] = {"accessible": False, "error": str(e)}
        
        # Test asset_binding table
        try:
            bindings_resp = supabase.table("asset_binding").select("*").limit(1).execute()
            tables_status["asset_binding"] = {
                "accessible": True,
                "count": len(bindings_resp.data) if bindings_resp.data else 0,
                "sample_columns": list(bindings_resp.data[0].keys()) if bindings_resp.data else []
            }
        except Exception as e:
            tables_status["asset_binding"] = {"accessible": False, "error": str(e)}
        
        return {
            "database_accessible": True,
            "tables": tables_status,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Database check error: {e}")
        return {
            "database_accessible": False,
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

@router.get("/debug/test-bindings-table")
async def test_bindings_table(current_user: User = Depends(require_superuser)):
    """Test basic CRUD operations on asset_binding table"""
    try:
        supabase = get_supabase_client()
        
        # Test SELECT
        select_resp = supabase.table("asset_binding").select("*").limit(5).execute()
        
        # Test for orphaned bindings
        orphaned_resp = supabase.table("asset_binding").select("binding_id, asset_id").execute()

        return {
            "table_accessible": True,
            "total_bindings": len(select_resp.data) if select_resp.data else 0,
            "sample_bindings": select_resp.data[:3] if select_resp.data else [],
            "orphaned_bindings": orphaned_resp.data[:5] if orphaned_resp.data else [],  # Show first 5 orphaned
            "schema_columns": list(select_resp.data[0].keys()) if select_resp.data else []
        }
        
    except Exception as e:
        logger.error(f"Test bindings table error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bind-test")
async def bind_asset_test(
    request: BindAssetRequest,
    current_user: User = Depends(require_superuser)
):
    """Test binding creation"""
    try:
        supabase = get_supabase_client()
        
        test_binding = {
            "asset_id": request.asset_id,
            "organization_id": request.organization_id,
            "status": "active",
            "bound_at": datetime.now(timezone.utc).isoformat(),
            "bound_by": current_user.uid
        }
        
        response = supabase.table("asset_binding").insert(test_binding).execute()
        
        if response.data:
            binding_id = response.data[0]["binding_id"]
            # Clean up test binding
            supabase.table("asset_binding").delete().eq("binding_id", binding_id).execute()
        
        return {
            "test_successful": True,
            "message": "Test binding created and cleaned up successfully",
            "test_data": test_binding
        }
        
    except Exception as e:
        logger.error(f"🧪 Test bind error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/handle-profile-switch")
async def handle_profile_switch(
    old_profile_name: str,
    new_profile_name: str,
    current_user: User = Depends(require_superuser)
):
    """
    Handle switching from one profile to another (e.g., A-Admin-1 to A-Backup-1)
    Updates asset metadata but preserves all bindings and client assignments
    
    This is for failover scenarios where you need to switch from primary to backup profile
    """
    try:
        logger.info(f"🔄 Profile switch request: {old_profile_name} → {new_profile_name}")
        
        supabase = get_supabase_client()
        
        # Validate that both profiles follow team naming convention
        def extract_team_from_profile(profile_name: str):
            import re
            match = re.match(r'^([A-Z]+)-(Admin|Backup)-(\d+)$', profile_name)
            if match:
                return {
                    'team': match.group(1),
                    'role': match.group(2),
                    'instance': match.group(3)
                }
            return None
        
        old_team_info = extract_team_from_profile(old_profile_name)
        new_team_info = extract_team_from_profile(new_profile_name)
        
        if not old_team_info or not new_team_info:
            raise HTTPException(
                status_code=400, 
                detail="Profile names must follow format: {TEAM}-{Admin|Backup}-{NUMBER}"
            )
        
        if old_team_info['team'] != new_team_info['team']:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot switch between different teams: {old_team_info['team']} vs {new_team_info['team']}"
            )
        
        # Find all assets managed by the old profile
        assets_response = supabase.table("asset").select("*").execute()
        
        if not assets_response.data:
            return {
                "success": True,
                "message": "No assets found to update",
                "old_profile": old_profile_name,
                "new_profile": new_profile_name,
                "assets_updated": 0
            }
        
        assets_updated = 0
        
        for asset in assets_response.data:
            asset_metadata = asset.get("metadata", {})
            needs_update = False
            
            # Check if this asset is managed by the old profile
            managing_profiles = asset_metadata.get("managing_profiles", [])
            managing_profile = asset_metadata.get("managing_profile")
            
            # Update managing_profiles array
            if managing_profiles:
                for i, profile in enumerate(managing_profiles):
                    if profile.get("name") == old_profile_name:
                        managing_profiles[i]["name"] = new_profile_name
                        needs_update = True
            
            # Update managing_profile string
            if managing_profile == old_profile_name:
                asset_metadata["managing_profile"] = new_profile_name
                needs_update = True
            
            # Update the asset if needed
            if needs_update:
                asset_metadata["profile_switch_history"] = asset_metadata.get("profile_switch_history", [])
                asset_metadata["profile_switch_history"].append({
                    "from": old_profile_name,
                    "to": new_profile_name,
                    "switched_at": datetime.now(timezone.utc).isoformat(),
                    "switched_by": current_user.uid
                })
                
                supabase.table("asset").update({
                    "metadata": asset_metadata,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }).eq("asset_id", asset["asset_id"]).execute()
                
                assets_updated += 1
                logger.info(f"🔄 Updated asset {asset['name']} profile reference: {old_profile_name} → {new_profile_name}")
        
        return {
            "success": True,
            "message": f"Profile switch completed successfully",
            "old_profile": old_profile_name,
            "new_profile": new_profile_name,
            "team": old_team_info['team'],
            "assets_updated": assets_updated,
            "switch_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"🔄 Profile switch error: {e}")
        raise HTTPException(status_code=500, detail=f"Profile switch failed: {str(e)}")

@router.get("/debug/test-logging")
async def test_logging(
    current_user: User = Depends(require_superuser)
):
    """Simple test endpoint to verify logging is working"""
    logger.info("🧪 TEST: This is an INFO log message")
    logger.warning("🧪 TEST: This is a WARNING log message")  
    logger.error("🧪 TEST: This is an ERROR log message")
    print("🧪 TEST: This is a print statement")
    return {"message": "Test logging complete - check your backend terminal for log messages"}

@router.get("/debug/dolphin-associations")
async def debug_dolphin_associations(
    current_user: User = Depends(require_superuser)
):
    """
    Comprehensive diagnostic tool for Dolphin BM and ad account associations.
    Helps identify permission and configuration issues.
    """
    try:
        dolphin_api = DolphinCloudAPI()
        
        # Get raw data from both endpoints
        profiles_data = await dolphin_api.get_fb_accounts()
        cabs_data = await dolphin_api.get_fb_cabs()
        
        diagnosis = {
            "summary": {
                "profiles_count": len(profiles_data),
                "cabs_count": len(cabs_data),
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            "profiles_analysis": [],
            "cabs_analysis": [],
            "association_issues": [],
            "recommendations": []
        }
        
        # Analyze each profile
        for profile in profiles_data:
            profile_name = profile.get("name", "Unknown")
            bms = profile.get("bm", [])
            
            profile_analysis = {
                "name": profile_name,
                "bm_count": len(bms),
                "bms": [],
                "raw_bm_data": bms,  # Add raw data for debugging
                "profile_status": profile.get("status"),
                "fb_id": profile.get("fb_id"),
                "has_bm_field": "bm" in profile,
                "bm_field_type": type(profile.get("bm", None)).__name__
            }
            
            for bm in bms:
                bm_info = {
                    "id": bm.get("id"),
                    "name": bm.get("name"),
                    "business_id": bm.get("business_id"),
                    "cabs_count": bm.get("cabs_count", 0)
                }
                profile_analysis["bms"].append(bm_info)
            
            diagnosis["profiles_analysis"].append(profile_analysis)
        
        # Analyze each CAB (ad account)
        problematic_cabs = []
        for cab in cabs_data:
            cab_name = cab.get("name", "Unknown")
            cab_id = cab.get("id")
            bm_data = cab.get("bm", [])
            business_data = cab.get("business")
            accounts = cab.get("accounts", [])
            
            cab_analysis = {
                "name": cab_name,
                "id": cab_id,
                "has_bm_data": len(bm_data) > 0,
                "bm_data": bm_data,
                "business_data": business_data,
                "managing_profiles": [acc.get("name") for acc in accounts],
                "status": cab.get("status"),
                "account_status": cab.get("account_status")
            }
            
            # Check for issues
            if len(bm_data) == 0 and cab_name.startswith("AdHub-"):
                problematic_cabs.append(cab_analysis)
                diagnosis["association_issues"].append({
                    "type": "missing_bm_association",
                    "cab_name": cab_name,
                    "cab_id": cab_id,
                    "managing_profiles": [acc.get("name") for acc in accounts],
                    "issue": "Ad account has no BM association in CAB data"
                })
            
            diagnosis["cabs_analysis"].append(cab_analysis)
        
        # Generate recommendations
        if problematic_cabs:
            diagnosis["recommendations"].extend([
                "Check if your profiles have proper permissions to the Business Managers",
                "Verify that ad accounts are properly assigned to Business Managers in Facebook",
                "Ensure your Dolphin profiles are added as admins to the relevant Business Managers",
                "Check if there are pending invitations in Facebook Business Manager"
            ])
        
        # Cross-reference analysis
        profile_bm_ids = set()
        for profile in diagnosis["profiles_analysis"]:
            for bm in profile["bms"]:
                if bm["id"]:
                    profile_bm_ids.add(bm["id"])
        
        cab_bm_ids = set()
        for cab in diagnosis["cabs_analysis"]:
            for bm in cab["bm_data"]:
                if bm.get("id"):
                    cab_bm_ids.add(bm["id"])
        
        diagnosis["cross_reference"] = {
            "bm_ids_in_profiles": list(profile_bm_ids),
            "bm_ids_in_cabs": list(cab_bm_ids),
            "bm_ids_only_in_profiles": list(profile_bm_ids - cab_bm_ids),
            "bm_ids_only_in_cabs": list(cab_bm_ids - profile_bm_ids),
            "common_bm_ids": list(profile_bm_ids & cab_bm_ids)
        }
        
        return diagnosis
        
    except Exception as e:
        logger.error(f"Error in Dolphin associations diagnosis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Diagnosis failed: {str(e)}")

@router.get("/debug/raw-account-data")
async def debug_raw_account_data(
    account_name: str = Query(..., description="Account name to search for (e.g., 'AdHub-Heavenfelt-01-1006')"),
    current_user: User = Depends(require_superuser)
):
    """
    Debug endpoint to examine raw Dolphin API data for a specific ad account.
    This helps identify BM association issues.
    """
    try:
        dolphin_api = DolphinCloudAPI()
        
        # Get raw data from both endpoints
        profiles_data = await dolphin_api.get_fb_accounts()
        cabs_data = await dolphin_api.get_fb_cabs()
        
        # Find the specific account
        target_account = None
        for cab in cabs_data:
            if (cab.get("name") == account_name or 
                cab.get("id") == account_name or 
                cab.get("ad_account_id") == account_name):
                target_account = cab
                break
        
        if not target_account:
            return {
                "error": f"Account '{account_name}' not found",
                "searched_in": len(cabs_data),
                "available_accounts": [cab.get("name") for cab in cabs_data[:10]]  # First 10 for reference
            }
        
        # Also find any profiles that might manage this account
        managing_profiles = []
        for profile in profiles_data:
            # Check if this profile has any BMs that might contain this account
            profile_bms = profile.get("bm", [])
            for bm in profile_bms:
                managing_profiles.append({
                    "profile_name": profile.get("name"),
                    "bm_id": bm.get("id"),
                    "bm_name": bm.get("name"),
                    "cabs_count": bm.get("cabs_count", 0)
                })
        
        result = {
            "account_found": {
                "name": target_account.get("name"),
                "id": target_account.get("id"),
                "ad_account_id": target_account.get("ad_account_id"),
                "status": target_account.get("status"),
                "balance": target_account.get("balance"),
                "currency": target_account.get("currency"),
                
                # BM association data - this is the key part
                "bm_field": target_account.get("bm", []),
                "business_field": target_account.get("business"),
                "business_id_field": target_account.get("business_id"),
                
                # Managing profiles
                "accounts_field": target_account.get("accounts", []),
                
                # Full raw data for complete analysis
                "raw_data": target_account
            },
            "potential_managing_profiles": managing_profiles,
            "analysis": {
                "has_bm_data": len(target_account.get("bm", [])) > 0,
                "has_business_data": target_account.get("business") is not None,
                "has_business_id": target_account.get("business_id") is not None,
                "managing_profiles_count": len(target_account.get("accounts", [])),
                "bm_association_status": "FOUND" if len(target_account.get("bm", [])) > 0 else "MISSING"
            },
            "recommendations": []
        }
        
        # Add specific recommendations based on findings
        if len(target_account.get("bm", [])) == 0:
            result["recommendations"].extend([
                "This ad account has no BM association in Dolphin's CAB data",
                "Check if the account is properly assigned to a Business Manager in Facebook",
                "Verify that your Dolphin profiles have admin access to the relevant Business Manager",
                "This might be a permissions issue - the account exists but BM relationship is not visible"
            ])
        
        return result
        
    except Exception as e:
        logger.error(f"Error in raw account data debug: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Debug failed: {str(e)}") 

@router.get("/debug/pixel-data")
async def debug_pixel_data(
    current_user: User = Depends(require_superuser)
):
    """Debug endpoint to check what pixel data we have in existing ad accounts"""
    try:
        supabase = get_supabase_client()
        
        # Get all ad account assets
        response = supabase.table("asset").select("*").eq("type", "ad_account").execute()
        
        if not response.data:
            return {"message": "No ad accounts found"}
        
        pixel_data = []
        for asset in response.data:
            metadata = asset.get("metadata", {})
            pixel_id = metadata.get("pixel_id")
            
            if pixel_id:
                pixel_data.append({
                    "account_name": asset.get("name"),
                    "account_id": asset.get("asset_id"),
                    "dolphin_id": asset.get("dolphin_id"),
                    "pixel_id": pixel_id,
                    "metadata": metadata
                })
        
        return {
            "total_ad_accounts": len(response.data),
            "accounts_with_pixels": len(pixel_data),
            "pixel_data": pixel_data
        }
        
    except Exception as e:
        logger.error(f"Error checking pixel data: {e}")
        return {"error": str(e)} 

@router.get("/debug/dolphin-pixel-data")
async def debug_dolphin_pixel_data(
    current_user: User = Depends(require_superuser)
):
    """Debug endpoint to check raw pixel data from Dolphin API"""
    try:
        dolphin_api = DolphinCloudAPI()
        
        # Get raw CAB data
        cabs_data = await dolphin_api.get_fb_cabs(per_page=10)
        
        pixel_info = []
        for cab in cabs_data:
            pixel_data = {
                "account_name": cab.get("name"),
                "account_id": cab.get("id"),
                "ad_account_id": cab.get("ad_account_id"),
                "pixel_id": cab.get("pixel_id"),
                "has_pixel": cab.get("pixel_id") is not None,
                "all_fields": list(cab.keys())
            }
            
            # Only include accounts that have pixel data or show first few for structure
            if cab.get("pixel_id") or len(pixel_info) < 3:
                pixel_info.append(pixel_data)
        
        return {
            "total_cabs_checked": len(cabs_data),
            "cabs_with_pixels": len([cab for cab in cabs_data if cab.get("pixel_id")]),
            "sample_pixel_data": pixel_info,
            "all_available_fields": list(set().union(*(cab.keys() for cab in cabs_data[:3]))) if cabs_data else []
        }
        
    except Exception as e:
        logger.error(f"Error checking Dolphin pixel data: {e}")
        return {"error": str(e)} 
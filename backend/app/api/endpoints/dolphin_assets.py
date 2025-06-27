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
        
        # Create sync log
        sync_log_data = {
            "id": str(uuid.uuid4()),
            "sync_type": "discover",
            "status": "started",
            "assets_discovered": 0,
            "assets_updated": 0,
            "errors_count": 0,
            "started_at": datetime.now(timezone.utc).isoformat()
        }
        
        sync_response = supabase.table("dolphin_sync_logs").insert(sync_log_data).execute()
        sync_log_id = sync_response.data[0]["id"]
        
        discovered_count = 0
        updated_count = 0
        errors = []
        
        # ========================================================================
        # 1. Get Facebook Profiles (these manage the ad accounts)
        # ========================================================================
        profiles_data = await dolphin_api.get_fb_accounts()
        
        for profile in profiles_data:
            try:
                # Process Profile
                profile_asset_data = {
                    "asset_type": "profile",
                    "asset_id": profile["id"],
                    "name": profile["name"],
                    "status": "active" if profile["status"] == "ACTIVE" else "restricted",
                    "health_status": "healthy" if profile["status"] == "ACTIVE" else "warning",
                    "asset_metadata": profile,
                    "discovered_at": datetime.now(timezone.utc).isoformat(),
                    "last_sync_at": datetime.now(timezone.utc).isoformat()
                }
                
                # Upsert profile
                supabase.table("dolphin_assets").upsert(profile_asset_data, on_conflict="asset_type,asset_id").execute()
                discovered_count += 1

                # Process Business Managers for this profile
                for bm in profile.get("bms", []):
                    bm_asset_data = {
                        "asset_type": "business_manager",
                        "asset_id": bm["business_id"],
                        "name": bm["name"],
                        "status": "active",
                        "health_status": "healthy",
                        "asset_metadata": bm,
                        "discovered_at": datetime.now(timezone.utc).isoformat(),
                        "last_sync_at": datetime.now(timezone.utc).isoformat()
                    }
                    
                    # Upsert business manager
                    supabase.table("dolphin_assets").upsert(bm_asset_data, on_conflict="asset_type,asset_id").execute()
                    discovered_count += 1
                    
            except Exception as e:
                error_msg = f"Error processing profile {profile.get('id', 'unknown')}: {str(e)}"
                errors.append(error_msg)
                logger.error(error_msg)
        
        # ========================================================================
        # 2. Get Facebook Ad Accounts (CABs = Cabinets) - THE REAL AD ACCOUNTS
        # ========================================================================
        cabs_data = await dolphin_api.get_fb_cabs()
        
        for cab in cabs_data:
            try:
                # Extract key information
                cab_id = cab["id"]
                cab_name = cab["name"]
                cab_status = cab["status"]
                balance = cab.get("balance", 0)
                currency = cab.get("currency", "USD")
                
                # Map Dolphin status to our database status - BE ACCURATE!
                # Dolphin statuses: ACTIVE, TOKEN_ERROR, SUSPENDED, RESTRICTED
                if cab_status == "ACTIVE":
                    status = "active"
                    health_status = "healthy"
                elif cab_status == "SUSPENDED":
                    status = "suspended"  # Facebook suspended the account
                    health_status = "warning"
                elif cab_status == "RESTRICTED":
                    status = "restricted"  # Facebook restricted the account
                    health_status = "warning"
                elif cab_status == "TOKEN_ERROR":
                    status = "connection_error"  # Dolphin can't connect (auth issue)
                    health_status = "disconnected"
                else:
                    # Unknown status - default to connection error to be safe
                    status = "connection_error"
                    health_status = "critical"
                
                # Get managing profile info
                managing_profiles = cab.get("accounts", [])
                managing_profile_name = managing_profiles[0]["name"] if managing_profiles else "Unknown"
                
                # Get business manager info
                business_managers = cab.get("bm", [])
                parent_bm_id = business_managers[0]["business_id"] if business_managers else None
                parent_bm_name = business_managers[0]["name"] if business_managers else "No BM"
                
                # Create ad account asset
                ad_account_data = {
                    "asset_type": "ad_account",
                    "asset_id": cab_id,
                    "name": cab_name,
                    "status": status,
                    "health_status": health_status,
                    "parent_business_manager_id": parent_bm_id,
                    "asset_metadata": {
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
                        "last_sync_date": cab.get("last_sync_date"),
                        "full_cab_data": cab
                    },
                    "discovered_at": datetime.now(timezone.utc).isoformat(),
                    "last_sync_at": datetime.now(timezone.utc).isoformat()
                }
                
                # Upsert ad account
                supabase.table("dolphin_assets").upsert(ad_account_data, on_conflict="asset_type,asset_id").execute()
                discovered_count += 1
                
            except Exception as e:
                error_msg = f"Error processing CAB {cab.get('id', 'unknown')}: {str(e)}"
                errors.append(error_msg)
                logger.error(error_msg)
        
        # Update sync log
        supabase.table("dolphin_sync_logs").update({
            "status": "completed" if not errors else "failed",
            "assets_discovered": discovered_count,
            "assets_updated": updated_count,
            "errors_count": len(errors),
            "error_details": errors if errors else None,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", sync_log_id).execute()
        
        return {
            "success": True,
            "profiles_found": len(profiles_data),
            "business_managers_found": sum(len(p.get("bms", [])) for p in profiles_data),
            "ad_accounts_found": len(cabs_data),
            "sync_log_id": sync_log_id,
            "assets_discovered": discovered_count,
            "assets_updated": updated_count,
            "errors": errors
        }
        
    except Exception as e:
        logger.error(f"Error in asset discovery: {e}")
        
        # Update sync log with error
        try:
            supabase.table("dolphin_sync_logs").update({
                "status": "failed",
                "error_details": [str(e)],
                "completed_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", sync_log_id).execute()
        except:
            pass
        
        raise HTTPException(status_code=500, detail=f"Asset discovery failed: {str(e)}")

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
        test_response = supabase.table("dolphin_assets").select("count", count="exact").execute()
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
    current_user: User = Depends(require_superuser)
):
    """
    Get all discovered Dolphin assets from our database, with binding information.
    This is the primary endpoint for the admin assets page.
    """
    supabase = get_supabase_client()
    
    try:
        # 1. Fetch all ad accounts first to perform in-memory joining/counting.
        # This is more efficient than N+1 queries.
        ad_accounts_response = supabase.table("dolphin_assets").select("*").eq("asset_type", "ad_account").execute()
        all_ad_accounts = ad_accounts_response.data
        
        # 2. Fetch all asset bindings with related org and business names
        bindings_response = supabase.table("client_asset_bindings").select("*, organizations(name), businesses(name)").execute()
        all_bindings = bindings_response.data

        # Create a lookup map for bindings for quick access
        bindings_map = {binding["asset_id"]: binding for binding in all_bindings}

        # 3. Fetch all assets (or filter by type)
        query = supabase.table("dolphin_assets").select("*").order("name", desc=False)
        
        if asset_type:
            query = query.eq("asset_type", asset_type)

        response = query.execute()
        assets = response.data
        
        # 4. Process assets to enrich them with binding and ad account info
        enriched_assets = []
        for asset in assets:
            asset_id = asset["id"]
            
            # Check for binding info
            binding_info = bindings_map.get(asset_id)
            if binding_info:
                asset["is_bound"] = True
                # The organization name is nested, extract it
                asset["binding_info"] = {
                    "organization_name": binding_info.get("organizations", {}).get("name", "Unknown Org"),
                    "business_name": (binding_info.get("businesses") or {}).get("name"),
                    **binding_info  # Include all other binding fields
                }
            else:
                asset["is_bound"] = False
                asset["binding_info"] = None
                
            # If it's a business manager, count its ad accounts
            if asset["asset_type"] == "business_manager":
                bm_asset_id = asset["asset_id"] # This is the Facebook BM ID
                
                # Filter ad accounts that belong to this BM
                linked_ad_accounts = [
                    acc for acc in all_ad_accounts 
                    if acc.get("parent_business_manager_id") == bm_asset_id
                ]
                
                # Add the count and the accounts to the metadata
                if "asset_metadata" not in asset or asset["asset_metadata"] is None:
                    asset["asset_metadata"] = {}
                
                asset["asset_metadata"]["ad_accounts_count"] = len(linked_ad_accounts)
                asset["asset_metadata"]["ad_accounts"] = linked_ad_accounts

            enriched_assets.append(asset)

        return {"assets": enriched_assets}

    except Exception as e:
        logger.error(f"Error fetching all assets: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while fetching assets: {str(e)}"
        )

# ============================================================================
# Asset Binding Operations
# ============================================================================

class BindAssetRequest(BaseModel):
    asset_id: str
    organization_id: str
    business_id: Optional[str] = None
    notes: Optional[str] = None

@router.post("/bind")
async def bind_asset_to_client(
    request: BindAssetRequest,
    auto_bind_related: bool = Query(False, description="Auto-bind related ad accounts when binding a Business Manager"),
    current_user: User = Depends(require_superuser)
):
    """Bind a Dolphin asset to a client organization"""
    logger.info(f"🔗 Bind Request: asset_id={request.asset_id}, org_id={request.organization_id}, business_id={request.business_id}, auto_bind_related={auto_bind_related}")
    try:
        supabase = get_supabase_client()
        logger.info(f"🔗 Supabase client initialized: {type(supabase)}")
        
        # Check if asset exists
        logger.info(f"🔗 Checking if asset exists: {request.asset_id}")
        try:
            asset_response = supabase.table("dolphin_assets").select("*").eq("id", request.asset_id).execute()
            logger.info(f"🔗 Asset response type: {type(asset_response)}")
            logger.info(f"🔗 Asset response data count: {len(asset_response.data) if hasattr(asset_response, 'data') and asset_response.data else 0}")
        except Exception as e:
            logger.error(f"🔗 Error querying asset: {e}")
            raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")
        
        if not hasattr(asset_response, 'data') or not asset_response.data:
            logger.error(f"🔗 Asset not found: {request.asset_id}")
            raise HTTPException(status_code=404, detail="Asset not found")
        
        asset = asset_response.data[0]
        logger.info(f"🔗 Found asset: {asset['name']} ({asset['asset_type']})")
        
        # Check if asset is already bound - use a simpler query
        logger.info(f"🔗 Checking existing bindings for asset: {request.asset_id}")
        try:
            # Use a simpler query without maybe_single() to avoid potential issues
            existing_bindings = supabase.table("client_asset_bindings").select("id").eq("asset_id", request.asset_id).eq("status", "active").execute()
            logger.info(f"🔗 Existing bindings response type: {type(existing_bindings)}")
            logger.info(f"🔗 Existing bindings count: {len(existing_bindings.data) if hasattr(existing_bindings, 'data') and existing_bindings.data else 0}")
            
            if hasattr(existing_bindings, 'data') and existing_bindings.data:
                logger.error(f"🔗 Asset already bound: {request.asset_id}")
                raise HTTPException(status_code=400, detail="Asset is already bound to another client")
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"🔗 Error querying existing bindings: {e}")
            raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")
        
        # Create main binding
        binding_data = {
            "asset_id": request.asset_id,
            "organization_id": request.organization_id,
            "business_id": request.business_id,
            "status": "active",
            "bound_at": datetime.now(timezone.utc).isoformat(),
            "bound_by": current_user.uid,
            "notes": request.notes
        }
        
        logger.info(f"🔗 Creating binding: {binding_data}")
        try:
            binding_response = supabase.table("client_asset_bindings").insert(binding_data).execute()
            logger.info(f"🔗 Insert response type: {type(binding_response)}")
            logger.info(f"🔗 Insert response data: {binding_response.data if hasattr(binding_response, 'data') else 'No data'}")
        except Exception as e:
            logger.error(f"🔗 Error inserting binding: {e}")
            raise HTTPException(status_code=500, detail=f"Database insert error: {str(e)}")
        
        if not hasattr(binding_response, 'data') or not binding_response.data:
            logger.error(f"🔗 Insert failed - no data returned")
            raise HTTPException(status_code=500, detail="Failed to create binding")
        
        main_binding_id = binding_response.data[0]["id"]
        logger.info(f"🔗 Main binding created successfully: {main_binding_id}")
        
        # Auto-bind related ad accounts if requested and this is a Business Manager
        related_bindings = []
        if auto_bind_related and asset["asset_type"] == "business_manager":
            logger.info(f"🔗 Auto-binding related ad accounts for BM: {asset['asset_id']}")
            
            try:
                # Find all ad accounts that belong to this Business Manager
                related_ads_response = supabase.table("dolphin_assets").select("*").eq("asset_type", "ad_account").eq("parent_business_manager_id", asset["asset_id"]).execute()
                
                related_ad_accounts = related_ads_response.data if hasattr(related_ads_response, 'data') else []
                logger.info(f"🔗 Found {len(related_ad_accounts)} related ad accounts")
                
                for ad_account in related_ad_accounts:
                    # Check if this ad account is already bound
                    existing_ad_bindings = supabase.table("client_asset_bindings").select("id").eq("asset_id", ad_account["id"]).eq("status", "active").execute()
                    
                    if not (hasattr(existing_ad_bindings, 'data') and existing_ad_bindings.data):
                        # Bind this ad account
                        ad_binding_data = {
                            "asset_id": ad_account["id"],
                            "organization_id": request.organization_id,
                            "business_id": request.business_id,
                            "status": "active",
                            "bound_at": datetime.now(timezone.utc).isoformat(),
                            "bound_by": current_user.uid,
                            "notes": f"Auto-bound with Business Manager: {asset['name']}"
                        }
                        
                        ad_binding_response = supabase.table("client_asset_bindings").insert(ad_binding_data).execute()
                        if hasattr(ad_binding_response, 'data') and ad_binding_response.data:
                            related_bindings.append({
                                "binding_id": ad_binding_response.data[0]["id"],
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
            "auto_bound_count": len(related_bindings)
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
        asset_response = supabase.table("dolphin_assets").select("*").eq("id", request.asset_id).execute()
        if not (hasattr(asset_response, 'data') and asset_response.data):
            raise HTTPException(status_code=404, detail="Asset not found")
        
        asset = asset_response.data[0]
        if asset["asset_type"] != "business_manager":
            raise HTTPException(status_code=400, detail="This endpoint is only for Business Managers")
        
        # Use the main bind endpoint with auto_bind_related=True
        from fastapi import Request
        from urllib.parse import urlencode
        
        # Create a mock request object to pass the auto_bind_related parameter
        result = await bind_asset_to_client(request, auto_bind_related=True, current_user=current_user)
        
        # Get the BM metadata to show ad accounts count
        bm_metadata = asset.get("asset_metadata", {})
        expected_ad_accounts = bm_metadata.get("cabs_count", 0)
        
        return {
            "success": True,
            "business_manager": {
                "id": asset["id"],
                "name": asset["name"],
                "facebook_id": asset["asset_id"]
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
    reason: Optional[str] = None,
    current_user: User = Depends(require_superuser)
):
    """Unbind an asset from a client"""
    try:
        supabase = get_supabase_client()
        
        # Check if binding exists
        binding_response = supabase.table("client_asset_bindings").select("*").eq("id", binding_id).maybe_single().execute()
        if not binding_response.data:
            raise HTTPException(status_code=404, detail="Binding not found")
        
        # Update binding status to inactive
        update_data = {
            "status": "inactive",
            "notes": f"Unbound by admin. Reason: {reason}" if reason else "Unbound by admin"
        }
        
        supabase.table("client_asset_bindings").update(update_data).eq("id", binding_id).execute()
        
        return {
            "success": True,
            "message": "Asset unbound successfully"
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
    business_id: Optional[str] = None,
    asset_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get all assets assigned to a specific client
    This is what clients see on their dashboard
    """
    try:
        supabase = get_supabase_client()
        
        # Build query for client assets
        query = supabase.table("client_asset_bindings").select("""
            *,
            dolphin_assets!inner(*),
            organizations!inner(name),
            businesses(name)
        """).eq("organization_id", organization_id).eq("status", "active")
        
        if business_id:
            query = query.eq("business_id", business_id)
        
        if asset_type:
            query = query.eq("dolphin_assets.asset_type", asset_type)
        
        response = query.execute()
        
        # Format response
        assets = []
        for binding in response.data:
            asset = binding["dolphin_assets"]
            asset_data = {
                "id": asset["id"],
                "asset_type": asset["asset_type"],
                "asset_id": asset["asset_id"],
                "name": asset["name"],
                "status": asset["status"],
                "health_status": asset["health_status"],
                "parent_business_manager_id": asset.get("parent_business_manager_id"),
                "asset_metadata": asset.get("asset_metadata", {}),
                "discovered_at": asset["discovered_at"],
                "last_sync_at": asset.get("last_sync_at"),
                "is_bound": True,
                "binding_info": {
                    "binding_id": binding["id"],
                    "organization_name": binding["organizations"]["name"],
                    "business_name": binding["businesses"]["name"] if binding.get("businesses") else None,
                    "bound_at": binding["bound_at"]
                }
            }
            assets.append(asset_data)
        
        return {
            "assets": assets,
            "total": len(assets),
            "by_type": {
                "profiles": len([a for a in assets if a["asset_type"] == "profile"]),
                "business_managers": len([a for a in assets if a["asset_type"] == "business_manager"]),
                "ad_accounts": len([a for a in assets if a["asset_type"] == "ad_account"])
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching client assets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Debug Operations
# ============================================================================

@router.get("/debug/database-check")
async def debug_database_check(
    current_user: User = Depends(require_superuser)
):
    """Debug endpoint to check database connectivity and table existence"""
    try:
        supabase = get_supabase_client()
        logger.info(f"🔍 Debug: Supabase client type: {type(supabase)}")
        
        # Test basic connectivity
        try:
            test_response = supabase.table("dolphin_assets").select("count", count="exact").execute()
            logger.info(f"🔍 Debug: Test response type: {type(test_response)}")
            logger.info(f"🔍 Debug: Test response: {test_response}")
            
            if test_response and hasattr(test_response, 'count'):
                asset_count = test_response.count
            else:
                asset_count = "unknown"
        except Exception as e:
            logger.error(f"🔍 Debug: Error getting count: {e}")
            asset_count = f"error: {str(e)}"
        
        # Test getting actual assets
        try:
            assets_response = supabase.table("dolphin_assets").select("id, name, asset_type").limit(10).execute()
            logger.info(f"🔍 Debug: Assets response type: {type(assets_response)}")
            logger.info(f"🔍 Debug: Assets response: {assets_response}")
            
            if assets_response and hasattr(assets_response, 'data'):
                assets_list = assets_response.data
                logger.info(f"🔍 Debug: Found {len(assets_list)} assets")
            else:
                assets_list = []
        except Exception as e:
            logger.error(f"🔍 Debug: Error getting assets: {e}")
            assets_list = f"error: {str(e)}"
        
        # Test bindings table
        try:
            bindings_response = supabase.table("client_asset_bindings").select("count", count="exact").execute()
            if bindings_response and hasattr(bindings_response, 'count'):
                bindings_count = bindings_response.count
            else:
                bindings_count = "unknown"
        except Exception as e:
            logger.error(f"🔍 Debug: Error getting bindings count: {e}")
            bindings_count = f"error: {str(e)}"
        
        return {
            "database_connected": True,
            "supabase_client_type": str(type(supabase)),
            "assets_count": asset_count,
            "bindings_count": bindings_count,
            "sample_assets": assets_list,
            "environment_check": {
                "supabase_url": settings.SUPABASE_URL[:50] + "..." if settings.SUPABASE_URL else "NOT SET",
                "service_role_key": "SET" if settings.SUPABASE_SERVICE_ROLE_KEY else "NOT SET",
                "anon_key": "SET" if settings.SUPABASE_ANON_KEY else "NOT SET"
            }
        }
        
    except Exception as e:
        logger.error(f"🔍 Debug: Database check failed: {e}")
        return {
            "database_connected": False,
            "error": str(e),
            "supabase_client_type": "failed to initialize"
        }

@router.get("/debug/test-bindings-table")
async def test_bindings_table(current_user: User = Depends(require_superuser)):
    """Test if the client_asset_bindings table exists and is accessible"""
    try:
        supabase = get_supabase_client()
        
        # Test 1: Try to query the table structure
        logger.info("🔍 Testing client_asset_bindings table access...")
        
        # Test 2: Try a simple select
        try:
            response = supabase.table("client_asset_bindings").select("*").limit(1).execute()
            logger.info(f"🔍 Bindings table query response: {response}")
            logger.info(f"🔍 Response type: {type(response)}")
            logger.info(f"🔍 Response data: {response.data if hasattr(response, 'data') else 'No data attr'}")
            
            table_accessible = True
            row_count = len(response.data) if hasattr(response, 'data') and response.data else 0
        except Exception as e:
            logger.error(f"🔍 Error accessing bindings table: {e}")
            table_accessible = False
            row_count = "error"
        
        # Test 3: Try the exact query that's failing in bind
        try:
            test_asset_id = "test-id"
            existing_binding = supabase.table("client_asset_bindings").select("id").eq("asset_id", test_asset_id).eq("status", "active").maybe_single().execute()
            logger.info(f"🔍 Test binding query response: {existing_binding}")
            logger.info(f"🔍 Test binding response type: {type(existing_binding)}")
            
            binding_query_works = existing_binding is not None
        except Exception as e:
            logger.error(f"🔍 Error with binding query: {e}")
            binding_query_works = False
        
        return {
            "table_accessible": table_accessible,
            "row_count": row_count,
            "binding_query_works": binding_query_works,
            "supabase_client_type": str(type(supabase))
        }
        
    except Exception as e:
        logger.error(f"🔍 Debug test failed: {e}")
        return {
            "error": str(e),
            "table_accessible": False
        }

@router.post("/bind-test")
async def bind_asset_test(
    request: BindAssetRequest,
    current_user: User = Depends(require_superuser)
):
    """Test version of bind endpoint to isolate the issue"""
    logger.info(f"🔗 TEST Bind Request: asset_id={request.asset_id}")
    try:
        supabase = get_supabase_client()
        
        # Step 1: Test basic table access
        logger.info("🔗 TEST: Testing basic table access...")
        try:
            test_assets = supabase.table("dolphin_assets").select("id").limit(1).execute()
            logger.info(f"🔗 TEST: Assets table works: {len(test_assets.data) if test_assets.data else 0} rows")
        except Exception as e:
            logger.error(f"🔗 TEST: Assets table error: {e}")
            return {"error": f"Assets table error: {e}"}
        
        # Step 2: Test bindings table access
        logger.info("🔗 TEST: Testing bindings table access...")
        try:
            test_bindings = supabase.table("client_asset_bindings").select("id").limit(1).execute()
            logger.info(f"🔗 TEST: Bindings table works: {len(test_bindings.data) if test_bindings.data else 0} rows")
        except Exception as e:
            logger.error(f"🔗 TEST: Bindings table error: {e}")
            return {"error": f"Bindings table error: {e}"}
        
        # Step 3: Test specific asset lookup
        logger.info(f"🔗 TEST: Looking for asset {request.asset_id}...")
        try:
            asset_response = supabase.table("dolphin_assets").select("*").eq("id", request.asset_id).execute()
            if not asset_response.data:
                return {"error": f"Asset {request.asset_id} not found"}
            logger.info(f"🔗 TEST: Found asset: {asset_response.data[0]['name']}")
        except Exception as e:
            logger.error(f"🔗 TEST: Asset lookup error: {e}")
            return {"error": f"Asset lookup error: {e}"}
        
        # Step 4: Test binding check
        logger.info("🔗 TEST: Checking for existing bindings...")
        try:
            existing_bindings = supabase.table("client_asset_bindings").select("id").eq("asset_id", request.asset_id).execute()
            logger.info(f"🔗 TEST: Found {len(existing_bindings.data)} existing bindings")
        except Exception as e:
            logger.error(f"🔗 TEST: Binding check error: {e}")
            return {"error": f"Binding check error: {e}"}
        
        return {
            "success": True,
            "message": "All tests passed - ready for actual binding",
            "asset_found": True,
            "existing_bindings": len(existing_bindings.data)
        }
        
    except Exception as e:
        logger.error(f"🔗 TEST: Overall error: {e}")
        return {"error": f"Overall error: {e}"} 
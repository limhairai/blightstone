"""
Dolphin Asset Management API Endpoints
Handles discovery, binding, and assignment of Dolphin Cloud assets to clients
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from ...db.session import get_db
from ...core.security import get_current_user, require_superuser
from ...models.models import User, DolphinAsset, ClientAssetBinding, DolphinSyncLog, ClientSpendTracking
from ...services.dolphin_service import DolphinCloudAPI

logger = logging.getLogger(__name__)
router = APIRouter()

# ============================================================================
# Asset Discovery & Sync
# ============================================================================

@router.post("/sync/discover")
async def discover_dolphin_assets(
    force_refresh: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Discover all assets from Dolphin Cloud and register them in our system
    This is the first step - building your master asset registry
    """
    try:
        dolphin_api = DolphinCloudAPI()
        sync_log = DolphinSyncLog(
            sync_type="full_discovery",
            triggered_by="admin",
            triggered_by_user_id=str(current_user.uid),
            status="running"
        )
        db.add(sync_log)
        db.commit()
        
        discovered_count = 0
        updated_count = 0
        errors = []
        
        # 1. Discover Business Managers
        try:
            business_managers = await dolphin_api.get_business_managers()
            for bm in business_managers:
                existing = db.query(DolphinAsset).filter(
                    DolphinAsset.facebook_id == bm["business_id"],
                    DolphinAsset.asset_type == "business_manager"
                ).first()
                
                if existing and not force_refresh:
                    continue
                
                if existing:
                    # Update existing
                    existing.name = bm["name"]
                    existing.last_sync_at = datetime.utcnow()
                    existing.asset_metadata = bm
                    updated_count += 1
                else:
                    # Create new
                    asset = DolphinAsset(
                        asset_type="business_manager",
                        facebook_id=bm["business_id"],
                        dolphin_profile_id="default",  # You'll need to map this properly
                        name=bm["name"],
                        asset_metadata=bm,
                        discovered_at=datetime.utcnow(),
                        last_sync_at=datetime.utcnow()
                    )
                    db.add(asset)
                    discovered_count += 1
        except Exception as e:
            errors.append(f"BM Discovery Error: {str(e)}")
            logger.error(f"Error discovering business managers: {e}")
        
        # 2. Discover Ad Accounts
        try:
            ad_accounts = await dolphin_api.get_fb_accounts()
            for account in ad_accounts:
                existing = db.query(DolphinAsset).filter(
                    DolphinAsset.facebook_id == account["id"],
                    DolphinAsset.asset_type == "ad_account"
                ).first()
                
                if existing and not force_refresh:
                    continue
                
                # Find parent BM
                parent_bm_id = None
                for bm in account.get("bms", []):
                    parent_bm_id = bm.get("business_id")
                    break
                
                if existing:
                    # Update existing
                    existing.name = account["name"]
                    existing.parent_business_manager_id = parent_bm_id
                    existing.last_sync_at = datetime.utcnow()
                    existing.asset_metadata = account
                    updated_count += 1
                else:
                    # Create new
                    asset = DolphinAsset(
                        asset_type="ad_account",
                        facebook_id=account["id"],
                        dolphin_profile_id="default",  # Map properly
                        name=account["name"],
                        parent_business_manager_id=parent_bm_id,
                        asset_metadata=account,
                        discovered_at=datetime.utcnow(),
                        last_sync_at=datetime.utcnow()
                    )
                    db.add(asset)
                    discovered_count += 1
        except Exception as e:
            errors.append(f"Ad Account Discovery Error: {str(e)}")
            logger.error(f"Error discovering ad accounts: {e}")
        
        db.commit()
        
        # Update sync log
        sync_log.status = "success" if not errors else "partial"
        sync_log.completed_at = datetime.utcnow()
        sync_log.assets_discovered = discovered_count
        sync_log.assets_updated = updated_count
        sync_log.errors_count = len(errors)
        sync_log.error_details = {"errors": errors} if errors else None
        sync_log.duration_seconds = (sync_log.completed_at - sync_log.started_at).total_seconds()
        db.commit()
        
        return {
            "status": "success",
            "discovered": discovered_count,
            "updated": updated_count,
            "errors": len(errors),
            "error_details": errors
        }
        
    except Exception as e:
        logger.error(f"Error in asset discovery: {e}")
        if 'sync_log' in locals():
            sync_log.status = "failed"
            sync_log.completed_at = datetime.utcnow()
            sync_log.error_details = {"error": str(e)}
            db.commit()
        raise HTTPException(status_code=500, detail=f"Asset discovery failed: {str(e)}")


@router.get("/unassigned")
async def get_unassigned_assets(
    asset_type: Optional[str] = Query(None, description="Filter by asset type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """Get all unassigned Dolphin assets available for client binding"""
    try:
        query = db.query(DolphinAsset).filter(DolphinAsset.is_assigned == False)
        
        if asset_type:
            query = query.filter(DolphinAsset.asset_type == asset_type)
        
        assets = query.all()
        
        return {
            "assets": [
                {
                    "id": asset.id,
                    "asset_type": asset.asset_type,
                    "facebook_id": asset.facebook_id,
                    "name": asset.name,
                    "status": asset.status,
                    "health_status": asset.health_status,
                    "parent_business_manager_id": asset.parent_business_manager_id,
                    "discovered_at": asset.discovered_at.isoformat(),
                    "last_sync_at": asset.last_sync_at.isoformat() if asset.last_sync_at else None,
                    "asset_metadata": asset.asset_metadata
                }
                for asset in assets
            ]
        }
        
    except Exception as e:
        logger.error(f"Error fetching unassigned assets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Client Asset Binding
# ============================================================================

@router.post("/bind")
async def bind_asset_to_client(
    dolphin_asset_id: str,
    organization_id: str,
    business_id: Optional[str] = None,
    permissions: Optional[Dict[str, bool]] = None,
    spend_limits: Optional[Dict[str, float]] = None,
    client_topped_up_total: float = 0.0,
    fee_percentage: float = 0.05,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Bind a Dolphin asset to a specific client
    This is how you assign your FB assets to individual clients
    """
    try:
        # Check if asset exists and is unassigned
        asset = db.query(DolphinAsset).filter(DolphinAsset.id == dolphin_asset_id).first()
        if not asset:
            raise HTTPException(status_code=404, detail="Dolphin asset not found")
        
        if asset.is_assigned:
            raise HTTPException(status_code=400, detail="Asset is already assigned to another client")
        
        # Check if client organization exists
        # You'll need to add organization validation here
        
        # Create binding
        binding = ClientAssetBinding(
            organization_id=organization_id,
            business_id=business_id,
            dolphin_asset_id=dolphin_asset_id,
            permissions=permissions or {
                "can_view_insights": True,
                "can_create_campaigns": False,
                "can_edit_budgets": False,
                "can_manage_pages": False,
                "can_access_audiences": False
            },
            spend_limits=spend_limits or {
                "daily": 0,
                "monthly": 0,
                "total": 0
            },
            client_topped_up_total=client_topped_up_total,
            your_fee_percentage=fee_percentage,
            assigned_by=str(current_user.uid),
            notes=notes
        )
        db.add(binding)
        
        # Update asset status
        asset.is_assigned = True
        asset.assigned_to_organization_id = organization_id
        asset.assigned_to_business_id = business_id
        asset.assigned_at = datetime.utcnow()
        asset.assigned_by = str(current_user.uid)
        
        # Create spend tracking record for ad accounts
        if asset.asset_type == "ad_account":
            spend_tracking = ClientSpendTracking(
                organization_id=organization_id,
                business_id=business_id,
                dolphin_asset_id=dolphin_asset_id,
                facebook_account_id=asset.facebook_id,
                spend_limit=spend_limits.get("monthly", 0) if spend_limits else 0,
                total_topped_up=client_topped_up_total,
                fee_collected=client_topped_up_total * fee_percentage
            )
            db.add(spend_tracking)
        
        db.commit()
        
        return {
            "status": "success",
            "binding_id": binding.id,
            "message": f"Asset {asset.name} successfully bound to client"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error binding asset to client: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/unbind/{binding_id}")
async def unbind_asset_from_client(
    binding_id: str,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """Unbind an asset from a client"""
    try:
        binding = db.query(ClientAssetBinding).filter(ClientAssetBinding.id == binding_id).first()
        if not binding:
            raise HTTPException(status_code=404, detail="Binding not found")
        
        # Get the asset
        asset = db.query(DolphinAsset).filter(DolphinAsset.id == binding.dolphin_asset_id).first()
        if not asset:
            raise HTTPException(status_code=404, detail="Associated asset not found")
        
        # Deactivate binding
        binding.is_active = False
        binding.deactivated_at = datetime.utcnow()
        binding.deactivated_by = str(current_user.uid)
        binding.deactivation_reason = reason
        
        # Update asset
        asset.is_assigned = False
        asset.assigned_to_organization_id = None
        asset.assigned_to_business_id = None
        asset.assigned_at = None
        asset.assigned_by = None
        
        db.commit()
        
        return {
            "status": "success",
            "message": f"Asset {asset.name} unbound from client"
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
    include_spend_data: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all assets assigned to a specific client
    This is what clients see on their dashboard
    """
    try:
        # Build query
        query = db.query(ClientAssetBinding, DolphinAsset).join(
            DolphinAsset, ClientAssetBinding.dolphin_asset_id == DolphinAsset.id
        ).filter(
            ClientAssetBinding.organization_id == organization_id,
            ClientAssetBinding.is_active == True
        )
        
        if business_id:
            query = query.filter(ClientAssetBinding.business_id == business_id)
        
        if asset_type:
            query = query.filter(DolphinAsset.asset_type == asset_type)
        
        results = query.all()
        
        # Format response
        assets = []
        dolphin_api = DolphinCloudAPI() if include_spend_data else None
        
        for binding, asset in results:
            asset_data = {
                "binding_id": binding.id,
                "asset_id": asset.id,
                "asset_type": asset.asset_type,
                "facebook_id": asset.facebook_id,
                "name": asset.name,
                "status": asset.status,
                "health_status": asset.health_status,
                "parent_business_manager_id": asset.parent_business_manager_id,
                "discovered_at": asset.discovered_at.isoformat(),
                "last_sync_at": asset.last_sync_at.isoformat() if asset.last_sync_at else None,
                "asset_metadata": asset.asset_metadata
            }
            
            # Add spend data for ad accounts
            if include_spend_data and asset.asset_type == "ad_account" and dolphin_api:
                try:
                    spend_data = await dolphin_api.get_account_spend_data(asset.facebook_id)
                    insights = await dolphin_api.get_account_insights(
                        asset.facebook_id,
                        binding.client_topped_up_total,
                        binding.your_fee_percentage
                    )
                    
                    asset_data.update({
                        "spend_data": spend_data,
                        "insights": insights,
                        "remaining_budget": insights["remaining_budget"],
                        "days_remaining": insights["days_remaining"]
                    })
                except Exception as e:
                    logger.warning(f"Could not fetch spend data for {asset.facebook_id}: {e}")
                    asset_data["spend_data_error"] = str(e)
            
            assets.append(asset_data)
        
        return {
            "organization_id": organization_id,
            "business_id": business_id,
            "assets": assets,
            "total_count": len(assets)
        }
        
    except Exception as e:
        logger.error(f"Error fetching client assets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Spend Limit Detection & Monitoring
# ============================================================================

@router.post("/spend/detect-changes")
async def detect_spend_limit_changes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Detect spend limit changes from Dolphin Cloud
    
    Your workflow:
    1. Your team tops up provider on their app
    2. Provider automatically tops up Facebook
    3. Dolphin Cloud detects the new spend limit
    4. This endpoint detects the changes and updates client data
    """
    try:
        # Get last known limits from database
        bindings = db.query(ClientAssetBinding, DolphinAsset).join(
            DolphinAsset, ClientAssetBinding.dolphin_asset_id == DolphinAsset.id
        ).filter(
            DolphinAsset.asset_type == "ad_account",
            ClientAssetBinding.is_active == True
        ).all()
        
        last_known_limits = {}
        for binding, asset in bindings:
            last_known_limits[asset.facebook_id] = binding.spend_limits.get("detected", 0)
        
        # Detect changes via Dolphin Cloud
        dolphin_api = DolphinCloudAPI()
        changes = await dolphin_api.detect_spend_limit_changes(last_known_limits)
        
        # Update our database with detected changes
        updated_bindings = []
        for change in changes["changes_detected"]:
            account_id = change["account_id"]
            new_limit = change["new_limit"]
            
            # Find the binding for this account
            for binding, asset in bindings:
                if asset.facebook_id == account_id:
                    # Update detected limit
                    binding.spend_limits["detected"] = new_limit
                    binding.spend_limits["last_detection"] = change["detected_at"]
                    binding.updated_at = datetime.utcnow()
                    
                    # Update spend tracking
                    spend_tracking = db.query(ClientSpendTracking).filter(
                        ClientSpendTracking.dolphin_asset_id == asset.id,
                        ClientSpendTracking.organization_id == binding.organization_id
                    ).first()
                    
                    if spend_tracking:
                        spend_tracking.spend_limit = new_limit
                        spend_tracking.last_dolphin_sync = datetime.utcnow()
                    
                    updated_bindings.append({
                        "binding_id": binding.id,
                        "asset_name": asset.name,
                        "facebook_account_id": account_id,
                        "previous_limit": change["previous_limit"],
                        "new_limit": new_limit,
                        "change_amount": change["change_amount"]
                    })
                    break
        
        db.commit()
        
        return {
            "status": "detection_complete",
            "total_changes_detected": len(changes["changes_detected"]),
            "updated_bindings": updated_bindings,
            "current_limits": changes["current_limits"],
            "sync_timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error detecting spend limit changes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/spend/manual-limit-update")
async def manual_limit_update(
    binding_id: str,
    detected_limit: float,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Manually update detected spend limit for a client asset
    
    Use this when you manually check Dolphin Cloud and see a limit change
    that wasn't caught by automatic detection
    """
    try:
        binding = db.query(ClientAssetBinding).filter(ClientAssetBinding.id == binding_id).first()
        if not binding:
            raise HTTPException(status_code=404, detail="Binding not found")
        
        # Update detected limit
        previous_limit = binding.spend_limits.get("detected", 0)
        binding.spend_limits["detected"] = detected_limit
        binding.spend_limits["last_manual_update"] = datetime.utcnow().isoformat()
        binding.spend_limits["manual_update_notes"] = notes
        binding.updated_at = datetime.utcnow()
        
        # Update spend tracking
        asset = db.query(DolphinAsset).filter(DolphinAsset.id == binding.dolphin_asset_id).first()
        if asset and asset.asset_type == "ad_account":
            spend_tracking = db.query(ClientSpendTracking).filter(
                ClientSpendTracking.dolphin_asset_id == binding.dolphin_asset_id,
                ClientSpendTracking.organization_id == binding.organization_id
            ).first()
            
            if spend_tracking:
                spend_tracking.spend_limit = detected_limit
                spend_tracking.last_dolphin_sync = datetime.utcnow()
        
        db.commit()
        
        return {
            "status": "manual_update_complete",
            "binding_id": binding_id,
            "previous_limit": previous_limit,
            "new_detected_limit": detected_limit,
            "change_amount": detected_limit - previous_limit,
            "updated_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error manually updating limit: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/spend/limit-history/{binding_id}")
async def get_spend_limit_history(
    binding_id: str,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get historical spend limit changes for a client asset"""
    try:
        binding = db.query(ClientAssetBinding).filter(ClientAssetBinding.id == binding_id).first()
        if not binding:
            raise HTTPException(status_code=404, detail="Binding not found")
        
        asset = db.query(DolphinAsset).filter(DolphinAsset.id == binding.dolphin_asset_id).first()
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        # Get historical data from Dolphin Cloud
        dolphin_api = DolphinCloudAPI()
        history = await dolphin_api.get_spend_limit_history(asset.facebook_id, days)
        
        return {
            "binding_id": binding_id,
            "asset_name": asset.name,
            "facebook_account_id": asset.facebook_id,
            "current_detected_limit": binding.spend_limits.get("detected", 0),
            "history": history,
            "days_requested": days
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting spend limit history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/spend/client-topup")
async def record_client_topup(
    binding_id: str,
    amount: float,
    payment_method: str,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Record a client top-up
    
    Your workflow:
    1. Client pays you
    2. You record it here
    3. Your team manually tops up provider on their app
    4. Provider automatically tops up Facebook
    5. Dolphin Cloud detects the new limit
    6. Use /spend/detect-changes to sync the new limits
    """
    try:
        binding = db.query(ClientAssetBinding).filter(ClientAssetBinding.id == binding_id).first()
        if not binding:
            raise HTTPException(status_code=404, detail="Binding not found")
        
        # Update client balance
        binding.client_topped_up_total += amount
        fee_amount = amount * binding.your_fee_percentage
        available_for_spend = amount - fee_amount
        
        # Update our tracking (not the actual FB limit - that comes from detection)
        binding.spend_limits["client_balance"] += available_for_spend
        binding.spend_limits["total_topped_up"] = binding.client_topped_up_total
        binding.updated_at = datetime.utcnow()
        
        # Update spend tracking
        asset = db.query(DolphinAsset).filter(DolphinAsset.id == binding.dolphin_asset_id).first()
        
        if asset and asset.asset_type == "ad_account":
            spend_tracking = db.query(ClientSpendTracking).filter(
                ClientSpendTracking.dolphin_asset_id == binding.dolphin_asset_id,
                ClientSpendTracking.organization_id == binding.organization_id
            ).first()
            
            if spend_tracking:
                spend_tracking.total_topped_up += amount
                spend_tracking.fee_collected += fee_amount
                spend_tracking.client_balance += available_for_spend
        
        db.commit()
        
        return {
            "status": "topup_recorded",
            "amount_topped_up": amount,
            "fee_collected": fee_amount,
            "available_for_spend": available_for_spend,
            "new_total_balance": binding.client_topped_up_total,
            "next_steps": [
                "Client payment recorded successfully",
                "Your team should now top up provider on their app",
                "Provider will automatically top up Facebook",
                "Use /spend/detect-changes to sync new limits from Dolphin Cloud",
                "Client will see updated budget after detection"
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording client top-up: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 
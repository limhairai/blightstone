from fastapi import APIRouter, HTTPException, Depends, status
from backend.app.core.security import get_current_user
from backend.app.services.subscription_service import subscription_service
from backend.app.schemas.user import UserRead as User
from typing import Dict, Any
from pydantic import BaseModel
import logging

router = APIRouter()
logger = logging.getLogger("adhub_app")

class CreateSubscriptionRequest(BaseModel):
    organization_id: str
    plan_id: str

class UpgradeSubscriptionRequest(BaseModel):
    organization_id: str
    new_plan_id: str

class AdSpendFeeRequest(BaseModel):
    organization_id: str
    amount: float

@router.get("/plans")
async def get_available_plans():
    """Get all available subscription plans"""
    try:
        from backend.app.core.supabase_client import get_supabase_client
        supabase = get_supabase_client()
        
        result = (
            supabase.table("plans")
            .select("*")
            .eq("is_active", True)
            .order("monthly_subscription_fee_cents")
            .execute()
        )
        
        return {"plans": result.data}
    except Exception as e:
        logger.error(f"Error fetching plans: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch plans")

@router.get("/organization/{organization_id}/plan")
async def get_organization_plan(
    organization_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get organization's current plan and usage"""
    try:
        # Get plan details
        org_plan = await subscription_service.get_organization_plan(organization_id)
        
        # Get current usage
        usage = await subscription_service.get_current_usage(organization_id)
        
        return {
            "organization": org_plan,
            "current_usage": usage,
            "plan_limits": {
                "team_members": org_plan["plans"]["max_team_members"],
                "business_managers": org_plan["plans"]["max_businesses"],
                "ad_accounts": org_plan["plans"]["max_ad_accounts"]
            }
        }
    except Exception as e:
        logger.error(f"Error getting organization plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to get organization plan")

@router.post("/organization/{organization_id}/check-limit")
async def check_plan_limit(
    organization_id: str,
    limit_type: str,
    current_user: User = Depends(get_current_user)
):
    """Check if organization can perform action based on plan limits"""
    try:
        can_perform = await subscription_service.check_plan_limit(organization_id, limit_type)
        return {"can_perform": can_perform, "limit_type": limit_type}
    except Exception as e:
        logger.error(f"Error checking plan limit: {e}")
        raise HTTPException(status_code=500, detail="Failed to check plan limit")

@router.post("/calculate-fee")
async def calculate_ad_spend_fee(
    request: AdSpendFeeRequest,
    current_user: User = Depends(get_current_user)
):
    """Calculate ad spend fee for organization"""
    try:
        fee_calculation = await subscription_service.calculate_ad_spend_fee(
            request.amount, 
            request.organization_id
        )
        return fee_calculation
    except Exception as e:
        logger.error(f"Error calculating fee: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate fee")

@router.post("/create")
async def create_subscription(
    request: CreateSubscriptionRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new subscription for organization"""
    try:
        # Get or create Stripe customer
        from backend.app.core.supabase_client import get_supabase_client
        supabase = get_supabase_client()
        
        org_result = (
            supabase.table("organizations")
            .select("stripe_customer_id, name")
            .eq("id", request.organization_id)
            .single()
            .execute()
        )
        
        if not org_result.data:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        stripe_customer_id = org_result.data.get("stripe_customer_id")
        
        if not stripe_customer_id:
            # Create Stripe customer
            import stripe
            customer = stripe.Customer.create(
                email=current_user.email,
                name=org_result.data["name"],
                metadata={
                    "organization_id": request.organization_id,
                    "user_id": str(current_user.uid)
                }
            )
            stripe_customer_id = customer.id
            
            # Save customer ID
            supabase.table("organizations").update({
                "stripe_customer_id": stripe_customer_id
            }).eq("id", request.organization_id).execute()
        
        # Create subscription
        subscription = await subscription_service.create_subscription(
            request.organization_id,
            request.plan_id,
            stripe_customer_id
        )
        
        return {"success": True, "subscription": subscription}
        
    except Exception as e:
        logger.error(f"Error creating subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to create subscription")

@router.post("/upgrade")
async def upgrade_subscription(
    request: UpgradeSubscriptionRequest,
    current_user: User = Depends(get_current_user)
):
    """Upgrade organization's subscription plan"""
    try:
        result = await subscription_service.upgrade_subscription(
            request.organization_id,
            request.new_plan_id
        )
        return result
    except Exception as e:
        logger.error(f"Error upgrading subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to upgrade subscription")

@router.post("/organization/{organization_id}/reactivate")
async def reactivate_account(
    organization_id: str,
    current_user: User = Depends(get_current_user)
):
    """Reactivate a frozen account (admin only)"""
    try:
        # Check if user is admin/superuser
        if not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        await subscription_service.reactivate_account(organization_id)
        return {"success": True, "message": "Account reactivated"}
        
    except Exception as e:
        logger.error(f"Error reactivating account: {e}")
        raise HTTPException(status_code=500, detail="Failed to reactivate account") 
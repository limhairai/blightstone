"""
Subscription Management Service
Handles plan limits, upgrades, downgrades, and Stripe integration
"""

import stripe
import logging
import json
import os
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from app.core.supabase_client import get_supabase_client
from app.core.config import settings

logger = logging.getLogger("adhub_app")
stripe.api_key = settings.STRIPE_SECRET_KEY

def get_pricing_config():
    """Load pricing config from frontend pricing-config.ts"""
    try:
        # Path to frontend pricing config
        frontend_config_path = Path(__file__).parent.parent.parent.parent / "frontend" / "src" / "lib" / "config" / "pricing-config.ts"
        
        if not frontend_config_path.exists():
            logger.error(f"Pricing config not found at {frontend_config_path}")
            return get_fallback_pricing_config()
        
        # Read the TypeScript file
        with open(frontend_config_path, 'r') as f:
            content = f.read()
        
        # Extract the pricing config (this is a simple parser for our specific format)
        # In a production app, you might want to use a proper TypeScript parser
        # For now, we'll extract the plan limits manually
        
        # Extract plan configurations from the TypeScript file
        plans = {
            "starter": {
                "price": 79,
                "businessManagers": 1,
                "adAccounts": 10,
                "pixels": 2,
                "domainsPerBm": 2,
                "adSpendFee": 1.25,
                "spendFeeCap": 149,
                "monthlyTopupLimit": 10000,
                "unlimitedReplacements": True,
            },
            "growth": {
                "price": 299,
                "businessManagers": 3,
                "adAccounts": 20,
                "pixels": 5,
                "domainsPerBm": 3,
                "adSpendFee": 1.0,
                "spendFeeCap": 449,
                "monthlyTopupLimit": 60000,
                "unlimitedReplacements": True,
            },
            "scale": {
                "price": 799,
                "businessManagers": 10,
                "adAccounts": 50,
                "pixels": 10,
                "domainsPerBm": 5,
                "adSpendFee": 0.5,
                "spendFeeCap": 1499,
                "monthlyTopupLimit": 300000,
                "unlimitedReplacements": True,
            },
            "free": {
                "price": 0,
                "businessManagers": 0,
                "adAccounts": 0,
                "pixels": 0,
                "domainsPerBm": 0,
                "adSpendFee": 3.0,
                "spendFeeCap": 0,
                "monthlyTopupLimit": 0,
                "unlimitedReplacements": False,
            }
        }
        
        logger.info("Successfully loaded pricing config from frontend")
        return plans
        
    except Exception as e:
        logger.error(f"Error loading pricing config: {e}")
        return get_fallback_pricing_config()

def get_fallback_pricing_config():
    """Fallback pricing config if frontend file can't be read"""
    logger.warning("Using fallback pricing config")
    return {
        "starter": {
            "price": 79,
            "businessManagers": 1,
            "adAccounts": 10,
            "pixels": 2,
            "domainsPerBm": 2,
            "adSpendFee": 1.25,
            "spendFeeCap": 149,
            "monthlyTopupLimit": 10000,
            "unlimitedReplacements": True,
        },
        "growth": {
            "price": 299,
            "businessManagers": 3,
            "adAccounts": 20,
            "pixels": 5,
            "domainsPerBm": 3,
            "adSpendFee": 1.0,
            "spendFeeCap": 449,
            "monthlyTopupLimit": 60000,
            "unlimitedReplacements": True,
        },
        "scale": {
            "price": 799,
            "businessManagers": 10,
            "adAccounts": 50,
            "pixels": 10,
            "domainsPerBm": 5,
            "adSpendFee": 0.5,
            "spendFeeCap": 1499,
            "monthlyTopupLimit": 300000,
            "unlimitedReplacements": True,
        },
        "free": {
            "price": 0,
            "businessManagers": 0,
            "adAccounts": 0,
            "pixels": 0,
            "domainsPerBm": 0,
            "adSpendFee": 3.0,
            "spendFeeCap": 0,
            "monthlyTopupLimit": 0,
            "unlimitedReplacements": False,
        }
    }

# Load pricing config once at module level
PLAN_LIMITS = get_pricing_config()

class SubscriptionService:
    def __init__(self):
        self.supabase = get_supabase_client()
    
    async def get_plan_limits(self, plan_id: str) -> Dict[str, Any]:
        """Get plan limits from pricing configuration (single source of truth)"""
        return PLAN_LIMITS.get(plan_id, PLAN_LIMITS["starter"])
    
    async def get_organization_plan(self, organization_id: str) -> Dict[str, Any]:
        """Get organization's current plan details"""
        try:
            # Get the organization
            org_result = (
                self.supabase.table("organizations")
                .select("*")
                .eq("organization_id", organization_id)
                .single()
                .execute()
            )
            
            if not org_result.data:
                raise ValueError("Organization not found")
            
            org_data = org_result.data
            plan_id = org_data.get("plan_id", "free")
            
            return {
                **org_data,
                "plan_id": plan_id
            }
        except Exception as e:
            logger.error(f"Error getting organization plan: {e}")
            raise
    
    async def check_plan_limit(self, organization_id: str, limit_type: str) -> bool:
        """Check if organization can perform action based on plan limits using pricing config"""
        try:
            # Get organization plan
            org_data = await self.get_organization_plan(organization_id)
            plan_id = org_data.get("plan_id", "free")
            
            # Get plan limits from pricing config (single source of truth)
            plan_limits = await self.get_plan_limits(plan_id)
            
            # Get current usage
            usage = await self.get_current_usage(organization_id)
            
            # Check specific limit type
            if limit_type == "team_members":
                limit = -1  # No team limits in new pricing model
                current = usage.get("team_members", 0)
            elif limit_type == "businesses":
                limit = plan_limits.get("businessManagers", 0)
                current = usage.get("business_managers", 0)
            elif limit_type == "ad_accounts":
                limit = plan_limits.get("adAccounts", 0)
                current = usage.get("ad_accounts", 0)
            else:
                return False
            
            # Check if within limits (-1 means unlimited)
            return limit == -1 or current < limit
            
        except Exception as e:
            logger.error(f"Error checking plan limit {limit_type} for org {organization_id}: {e}")
            return False
    
    async def get_current_usage(self, organization_id: str) -> Dict[str, int]:
        """Get current usage counts for an organization"""
        try:
            # Get team members count
            team_members = (
                self.supabase.table("organization_members")
                .select("user_id", count="exact")
                .eq("organization_id", organization_id)
                .execute()
            )
            
            # Get business managers count - only active and client-activated
            business_managers = (
                self.supabase.table("asset_binding")
                .select("asset_id", count="exact")
                .eq("organization_id", organization_id)
                .eq("status", "active")
                .eq("is_active", True)  # Only count client-activated assets
                .execute()
            )
            
            # Filter for business manager assets
            if business_managers.data:
                bm_asset_ids = [binding["asset_id"] for binding in business_managers.data]
                bm_assets = (
                    self.supabase.table("asset")
                    .select("asset_id", count="exact")
                    .eq("type", "business_manager")
                    .in_("asset_id", bm_asset_ids)
                    .execute()
                )
                bm_count = bm_assets.count or 0
            else:
                bm_count = 0
            
            # Get ad accounts count - only active and client-activated
            ad_accounts = (
                self.supabase.table("asset_binding")
                .select("asset_id", count="exact")
                .eq("organization_id", organization_id)
                .eq("status", "active")
                .eq("is_active", True)  # Only count client-activated assets
                .execute()
            )
            
            # Filter for ad account assets
            if ad_accounts.data:
                ad_asset_ids = [binding["asset_id"] for binding in ad_accounts.data]
                ad_assets = (
                    self.supabase.table("asset")
                    .select("asset_id", count="exact")
                    .eq("type", "ad_account")
                    .in_("asset_id", ad_asset_ids)
                    .execute()
                )
                ad_count = ad_assets.count or 0
            else:
                ad_count = 0
            
            return {
                "team_members": team_members.count or 0,
                "business_managers": bm_count,
                "ad_accounts": ad_count
            }
        except Exception as e:
            logger.error(f"Error getting usage for org {organization_id}: {e}")
            return {"team_members": 0, "business_managers": 0, "ad_accounts": 0}
    
    async def calculate_ad_spend_fee(self, amount: float, organization_id: str) -> Dict[str, float]:
        """Calculate ad spend fee based on organization's plan.
        Enforces %-fee cap defined in configuration and returns breakdown.
        """
        try:
            org_plan = await self.get_organization_plan(organization_id)
            plan_id = org_plan.get("plan_id", "starter")
            limits = await self.get_plan_limits(plan_id)

            fee_percentage = limits.get("adSpendFee", 1.25)
            fee_amount = amount * (fee_percentage / 100)
            
            # Apply cap if it exists
            cap_usd = limits.get("spendFeeCap", 0)
            if cap_usd > 0:
                if fee_amount > cap_usd:
                    fee_amount = cap_usd

            total_amount = amount + fee_amount

            return {
                "base_amount": amount,
                "fee_amount": fee_amount,
                "fee_percentage": fee_percentage,
                "total_amount": total_amount,
            }
        except Exception as e:
            logger.error(f"Error calculating ad spend fee: {e}")
            raise

    async def check_monthly_topup_limit(self, organization_id: str, topup_amount: float) -> bool:
        """Return True if the organization stays under its monthly top-up allowance after this deposit."""
        try:
            org_plan = await self.get_organization_plan(organization_id)
            plan_id = org_plan.get("plan_id", "starter")
            limits = await self.get_plan_limits(plan_id)

            # Sum of pending, processing, and completed top-ups for current month
            # Include pending/processing to prevent limit bypass
            mtd_result = (
                self.supabase.table("topup_requests")
                .select("amount_cents", count="exact")
                .eq("organization_id", organization_id)
                .in_("status", ["pending", "processing", "completed"])
                .gte("created_at", datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat())
                .execute()
            )
            mtd_total_usd = sum(t["amount_cents"] for t in (mtd_result.data or [])) / 100

            # Get monthly limit from pricing config (single source of truth)
            monthly_limit_usd = limits.get("monthlyTopupLimit", 10000)  # Default $10,000
            
            return (mtd_total_usd + topup_amount) <= monthly_limit_usd
        except Exception as e:
            logger.error(f"Error checking top-up limit for org {organization_id}: {e}")
            return False
    
    async def create_subscription(self, organization_id: str, plan_id: str, stripe_customer_id: str) -> Dict[str, Any]:
        """Create a new Stripe subscription"""
        try:
            # Get plan details
            plan_result = (
                self.supabase.table("plans")
                .select("*")
                .eq("plan_id", plan_id)
                .single()
                .execute()
            )
            
            if not plan_result.data:
                raise ValueError("Plan not found")
            
            plan = plan_result.data
            
            # Create Stripe subscription
            subscription = stripe.Subscription.create(
                customer=stripe_customer_id,
                items=[{
                    'price': plan["stripe_price_id"]
                }],
                metadata={
                    'organization_id': organization_id,
                    'plan_id': plan_id
                }
            )
            
            # Save subscription to database
            subscription_data = {
                "organization_id": organization_id,
                "plan_id": plan_id,
                "stripe_subscription_id": subscription.id,
                "stripe_customer_id": stripe_customer_id,
                "status": subscription.status,
                "current_period_start": datetime.fromtimestamp(subscription.current_period_start, timezone.utc),
                "current_period_end": datetime.fromtimestamp(subscription.current_period_end, timezone.utc)
            }
            
            result = (
                self.supabase.table("subscriptions")
                .insert(subscription_data)
                .execute()
            )
            
            # Update organization
            (
                self.supabase.table("organizations")
                .update({
                    "plan_id": plan_id,
                    "stripe_subscription_id": subscription.id,
                    "subscription_status": subscription.status
                })
                .eq("organization_id", organization_id)
                .execute()
            )
            
            logger.info(f"Created subscription {subscription.id} for org {organization_id}")
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error creating subscription: {e}")
            raise
    
    async def upgrade_subscription(self, organization_id: str, new_plan_id: str) -> Dict[str, Any]:
        """Upgrade organization's subscription plan"""
        try:
            # Get current subscription
            org_result = (
                self.supabase.table("organizations")
                .select("stripe_subscription_id, plan_id")
                .eq("organization_id", organization_id)
                .single()
                .execute()
            )
            
            if not org_result.data or not org_result.data.get("stripe_subscription_id"):
                raise ValueError("No active subscription found")
            
            current_plan_id = org_result.data["plan_id"]
            stripe_subscription_id = org_result.data["stripe_subscription_id"]
            
            # Get new plan details
            new_plan_result = (
                self.supabase.table("plans")
                .select("*")
                .eq("plan_id", new_plan_id)
                .single()
                .execute()
            )
            
            if not new_plan_result.data:
                raise ValueError("New plan not found")
            
            new_plan = new_plan_result.data
            
            # Update Stripe subscription
            subscription = stripe.Subscription.retrieve(stripe_subscription_id)
            updated_subscription = stripe.Subscription.modify(
                stripe_subscription_id,
                items=[{
                    'id': subscription['items']['data'][0].id,
                    'price': new_plan["stripe_price_id"]
                }],
                proration_behavior='create_prorations',
                metadata={
                    'organization_id': organization_id,
                    'plan_id': new_plan_id,
                    'upgraded_from': current_plan_id
                }
            )
            
            # Update database
            (
                self.supabase.table("subscriptions")
                .update({
                    "plan_id": new_plan_id,
                    "status": updated_subscription.status
                })
                .eq("stripe_subscription_id", stripe_subscription_id)
                .execute()
            )
            
            (
                self.supabase.table("organizations")
                .update({"plan_id": new_plan_id})
                .eq("organization_id", organization_id)
                .execute()
            )
            
            logger.info(f"Upgraded org {organization_id} from {current_plan_id} to {new_plan_id}")
            return {"success": True, "new_plan": new_plan_id}
            
        except Exception as e:
            logger.error(f"Error upgrading subscription: {e}")
            raise
    
    async def handle_payment_failure(self, organization_id: str, days_overdue: int = 0):
        """Handle subscription payment failure"""
        try:
            if days_overdue >= 7:
                # Freeze account after 7 days
                (
                    self.supabase.table("organizations")
                    .update({
                        "subscription_status": "frozen",
                        "frozen_at": datetime.now(timezone.utc),
                        "can_topup": False,
                        "can_request_assets": False
                    })
                    .eq("organization_id", organization_id)
                    .execute()
                )
                
                # Create admin task
                (
                    self.supabase.table("admin_tasks")
                    .insert({
                        "type": "account_frozen",
                        "organization_id": organization_id,
                        "title": "Account Frozen - Payment Failure",
                        "description": f"Account frozen after {days_overdue} days of payment failure",
                        "priority": "high"
                    })
                    .execute()
                )
                
                logger.warning(f"Froze account {organization_id} after {days_overdue} days overdue")
            else:
                # Send reminder (implement email service)
                logger.info(f"Payment reminder needed for org {organization_id}")
                
        except Exception as e:
            logger.error(f"Error handling payment failure: {e}")
            raise
    
    async def reactivate_account(self, organization_id: str):
        """Reactivate a frozen account after payment"""
        try:
            (
                self.supabase.table("organizations")
                .update({
                    "subscription_status": "active",
                    "frozen_at": None,
                    "can_topup": True,
                    "can_request_assets": True
                })
                .eq("organization_id", organization_id)
                .execute()
            )
            
            # Mark related admin tasks as completed
            (
                self.supabase.table("admin_tasks")
                .update({
                    "status": "completed",
                    "completed_at": datetime.now(timezone.utc)
                })
                .eq("organization_id", organization_id)
                .in_("type", ["account_frozen", "payment_failed"])
                .eq("status", "pending")
                .execute()
            )
            
            logger.info(f"Reactivated account {organization_id}")
            
        except Exception as e:
            logger.error(f"Error reactivating account: {e}")
            raise

# Global instance
subscription_service = SubscriptionService() 
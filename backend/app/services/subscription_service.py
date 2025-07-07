"""
Subscription Management Service
Handles plan limits, upgrades, downgrades, and Stripe integration
"""

import stripe
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from app.core.supabase_client import get_supabase_client
from app.core.config import settings

logger = logging.getLogger("adhub_app")
stripe.api_key = settings.STRIPE_SECRET_KEY

class SubscriptionService:
    def __init__(self):
        self.supabase = get_supabase_client()
    
    async def get_organization_plan(self, organization_id: str) -> Dict[str, Any]:
        """Get organization's current plan details"""
        try:
            # First get the organization
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
            plan_id = org_data.get("plan_id")
            
            # If no plan_id, use default free plan
            if not plan_id:
                plan_id = "free"
            
            # Get the plan details
            plan_result = (
                self.supabase.table("plans")
                .select("*")
                .eq("plan_id", plan_id)
                .single()
                .execute()
            )
            
            # If plan not found, create a default plan data
            if not plan_result.data:
                logger.warning(f"Plan {plan_id} not found for org {organization_id}, using default")
                plan_data = {
                    "plan_id": "free",
                    "name": "Free Plan",
                    "ad_spend_fee_percentage": 3.0,  # Default 3% fee
                    "monthly_subscription_fee_cents": 0,
                    "max_team_members": 2,
                    "max_businesses": 1,
                    "max_ad_accounts": 5
                }
            else:
                plan_data = plan_result.data
            
            # Combine org data with plan data
            return {
                **org_data,
                "plans": plan_data
            }
        except Exception as e:
            logger.error(f"Error getting organization plan: {e}")
            raise
    
    async def check_plan_limit(self, organization_id: str, limit_type: str) -> bool:
        """Check if organization can perform action based on plan limits"""
        try:
            # Use the database function we created
            result = (
                self.supabase.rpc("check_plan_limits", {
                    "org_id": organization_id,
                    "limit_type": limit_type
                })
                .execute()
            )
            
            return result.data if result.data is not None else False
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
            
            # Get business managers count
            business_managers = (
                self.supabase.table("asset_binding")
                .select("asset_id", count="exact")
                .eq("organization_id", organization_id)
                .eq("status", "active")
                .in_("asset_id", 
                    self.supabase.table("asset")
                    .select("asset_id")
                    .eq("type", "business_manager")
                    .execute().data
                )
                .execute()
            )
            
            # Get ad accounts count
            ad_accounts = (
                self.supabase.table("asset_binding")
                .select("asset_id", count="exact")
                .eq("organization_id", organization_id)
                .eq("status", "active")
                .in_("asset_id",
                    self.supabase.table("asset")
                    .select("asset_id")
                    .eq("type", "ad_account")
                    .execute().data
                )
                .execute()
            )
            
            return {
                "team_members": team_members.count or 0,
                "business_managers": business_managers.count or 0,
                "ad_accounts": ad_accounts.count or 0
            }
        except Exception as e:
            logger.error(f"Error getting usage for org {organization_id}: {e}")
            return {"team_members": 0, "business_managers": 0, "ad_accounts": 0}
    
    async def calculate_ad_spend_fee(self, amount: float, organization_id: str) -> Dict[str, float]:
        """Calculate ad spend fee based on organization's plan"""
        try:
            org_plan = await self.get_organization_plan(organization_id)
            fee_percentage = float(org_plan["plans"]["ad_spend_fee_percentage"])
            
            fee_amount = amount * (fee_percentage / 100)
            total_amount = amount + fee_amount
            
            return {
                "base_amount": amount,
                "fee_amount": fee_amount,
                "fee_percentage": fee_percentage,
                "total_amount": total_amount
            }
        except Exception as e:
            logger.error(f"Error calculating ad spend fee: {e}")
            raise
    
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
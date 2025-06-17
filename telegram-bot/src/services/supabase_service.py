"""
Supabase service for Telegram bot
Connects to the same database as your main backend
"""

import os
from supabase import create_client, Client
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class TelegramUser:
    telegram_id: int
    user_id: str
    email: str
    name: Optional[str]
    organization_ids: List[str]
    roles: Dict[str, str]  # {org_id: role}
    is_superuser: bool = False

@dataclass
class OrganizationInfo:
    id: str
    name: str
    plan_id: str
    current_businesses_count: int
    verification_status: str
    wallet_balance_cents: int

@dataclass
class BusinessInfo:
    id: str
    name: str
    business_id: Optional[str]  # Facebook BM ID
    status: str
    organization_id: str

@dataclass
class AdAccountInfo:
    id: str
    name: str
    account_id: str  # Facebook ad account ID
    status: str
    balance: float
    spent: float
    business_id: str
    last_activity: str

class SupabaseService:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        # Try service role key first (preferred for bot operations), fallback to anon key
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be set")
        
        # Create client using the same pattern as your main backend
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        logger.info("Supabase client initialized successfully")
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email address"""
        try:
            response = (
                self.client.table("profiles")
                .select("*")
                .eq("email", email)
                .maybe_single()
                .execute()
            )
            return response.data
        except Exception as e:
            logger.error(f"Error getting user by email {email}: {e}")
            return None

    def get_user_by_telegram_id(self, telegram_id: int) -> Optional[TelegramUser]:
        """Get user by Telegram ID"""
        try:
            # Get user profile
            profile_response = (
                self.client.table("profiles")
                .select("id, email, name, is_superuser")
                .eq("telegram_id", telegram_id)
                .maybe_single()
                .execute()
            )
            
            if not profile_response.data:
                return None
            
            profile = profile_response.data
            user_id = profile["id"]
            
            # Get user's organizations and roles
            orgs_response = (
                self.client.table("organization_members")
                .select("organization_id, role")
                .eq("user_id", user_id)
                .execute()
            )
            
            organization_ids = []
            roles = {}
            
            for org_member in orgs_response.data or []:
                org_id = org_member["organization_id"]
                role = org_member["role"]
                organization_ids.append(org_id)
                roles[org_id] = role
            
            return TelegramUser(
                telegram_id=telegram_id,
                user_id=user_id,
                email=profile["email"],
                name=profile.get("name"),
                organization_ids=organization_ids,
                roles=roles,
                is_superuser=profile.get("is_superuser", False)
            )
            
        except Exception as e:
            logger.error(f"Error getting user by telegram ID {telegram_id}: {e}")
            return None
    
    def link_telegram_user(self, telegram_id: int, email: str) -> bool:
        """Link Telegram ID to existing user account"""
        try:
            response = (
                self.client.table("profiles")
                .update({"telegram_id": telegram_id})
                .eq("email", email)
                .execute()
            )
            return bool(response.data)
        except Exception as e:
            logger.error(f"Error linking telegram user {telegram_id} to {email}: {e}")
            return False
    
    def get_user_organizations(self, user_id: str) -> List[OrganizationInfo]:
        """Get organizations for a user"""
        try:
            response = (
                self.client.table("organization_members")
                .select("""
                    organization_id,
                    organizations(
                        id, name, plan_id, current_businesses_count, 
                        verification_status, wallets(balance_cents)
                    )
                """)
                .eq("user_id", user_id)
                .execute()
            )
            
            organizations = []
            for item in response.data or []:
                org_data = item["organizations"]
                wallet_balance = 0
                if org_data.get("wallets") and len(org_data["wallets"]) > 0:
                    wallet_balance = org_data["wallets"][0]["balance_cents"]
                
                organizations.append(OrganizationInfo(
                    id=org_data["id"],
                    name=org_data["name"],
                    plan_id=org_data["plan_id"],
                    current_businesses_count=org_data["current_businesses_count"],
                    verification_status=org_data["verification_status"],
                    wallet_balance_cents=wallet_balance
                ))
            
            return organizations
            
        except Exception as e:
            logger.error(f"Error getting organizations for user {user_id}: {e}")
            return []
    
    def get_organization_businesses(self, org_id: str) -> List[BusinessInfo]:
        """Get businesses for an organization"""
        try:
            response = (
                self.client.table("businesses")
                .select("id, name, business_id, status, organization_id")
                .eq("organization_id", org_id)
                .execute()
            )
            
            businesses = []
            for business_data in response.data or []:
                businesses.append(BusinessInfo(
                    id=business_data["id"],
                    name=business_data["name"],
                    business_id=business_data.get("business_id"),
                    status=business_data["status"],
                    organization_id=business_data["organization_id"]
                ))
            
            return businesses
            
        except Exception as e:
            logger.error(f"Error getting businesses for org {org_id}: {e}")
            return []
    
    def get_business_ad_accounts(self, business_id: str) -> List[AdAccountInfo]:
        """Get ad accounts for a business"""
        try:
            response = (
                self.client.table("ad_accounts")
                .select("id, name, account_id, status, balance, spent, business_id, last_activity")
                .eq("business_id", business_id)
                .execute()
            )
            
            accounts = []
            for account_data in response.data or []:
                accounts.append(AdAccountInfo(
                    id=account_data["id"],
                    name=account_data["name"],
                    account_id=account_data["account_id"],
                    status=account_data["status"],
                    balance=float(account_data.get("balance", 0)),
                    spent=float(account_data.get("spent", 0)),
                    business_id=account_data["business_id"],
                    last_activity=account_data.get("last_activity", "Unknown")
                ))
            
            return accounts
            
        except Exception as e:
            logger.error(f"Error getting ad accounts for business {business_id}: {e}")
            return []
    
    def get_wallet_balance(self, org_id: str) -> float:
        """Get wallet balance for organization in dollars"""
        try:
            response = (
                self.client.table("wallets")
                .select("balance_cents")
                .eq("organization_id", org_id)
                .maybe_single()
                .execute()
            )
            
            if response.data:
                return response.data["balance_cents"] / 100
            return 0.0
            
        except Exception as e:
            logger.error(f"Error getting wallet balance for org {org_id}: {e}")
            return 0.0
    
    def update_wallet_balance(self, org_id: str, amount_cents: int) -> bool:
        """Update wallet balance (amount_cents can be negative for deductions)"""
        try:
            # Get current balance
            current_response = (
                self.client.table("wallets")
                .select("balance_cents")
                .eq("organization_id", org_id)
                .maybe_single()
                .execute()
            )
            
            if not current_response.data:
                return False
            
            current_balance = current_response.data["balance_cents"]
            new_balance = current_balance + amount_cents
            
            # Update balance
            update_response = (
                self.client.table("wallets")
                .update({"balance_cents": new_balance})
                .eq("organization_id", org_id)
                .execute()
            )
            
            return bool(update_response.data)
            
        except Exception as e:
            logger.error(f"Error updating wallet balance for org {org_id}: {e}")
            return False
    
    def record_transaction(self, org_id: str, business_id: Optional[str], 
                           amount_cents: int, transaction_type: str, 
                           description: str, metadata: Optional[Dict] = None) -> bool:
        """Record a transaction"""
        try:
            transaction_data = {
                "organization_id": org_id,
                "amount_cents": amount_cents,
                "currency": "USD",
                "type": transaction_type,
                "description": description
            }
            
            if business_id:
                transaction_data["business_id"] = business_id
            
            if metadata:
                transaction_data["metadata"] = metadata
            
            response = (
                self.client.table("transactions")
                .insert(transaction_data)
                .execute()
            )
            
            return bool(response.data)
            
        except Exception as e:
            logger.error(f"Error recording transaction for org {org_id}: {e}")
            return False
    
    def log_telegram_notification(self, org_id: str, account_id: Optional[str],
                                  alert_type: str, message: str, 
                                  telegram_ids: List[int]) -> bool:
        """Log a telegram notification"""
        try:
            notification_data = {
                "organization_id": org_id,
                "alert_type": alert_type,
                "message": message,
                "sent_to_telegram_ids": telegram_ids
            }
            
            if account_id:
                notification_data["account_id"] = account_id
            
            response = (
                self.client.table("telegram_notifications")
                .insert(notification_data)
                .execute()
            )
            
            return bool(response.data)
            
        except Exception as e:
            logger.error(f"Error logging telegram notification: {e}")
            return False

    async def get_user_transactions(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get user's transaction history"""
        try:
            response = self.client.table("transactions") \
                .select("*") \
                .eq("user_id", user_id) \
                .order("created_at", desc=True) \
                .limit(limit) \
                .execute()
            
            return response.data
        except Exception as e:
            logger.error(f"Error fetching user transactions: {e}")
            return []

    # Organization Business Manager Mapping Methods
    
    async def add_organization_bm(self, organization_id: str, business_manager_id: str, 
                                 business_manager_name: str = None) -> Dict[str, Any]:
        """Add Business Manager to organization"""
        try:
            data = {
                "organization_id": organization_id,
                "business_manager_id": business_manager_id,
                "business_manager_name": business_manager_name or f"BM-{business_manager_id}",
                "is_active": True
            }
            
            response = self.client.table("organization_business_managers") \
                .insert(data) \
                .execute()
            
            if response.data:
                logger.info(f"Added BM {business_manager_id} to organization {organization_id}")
                return response.data[0]
            else:
                raise Exception("Failed to add Business Manager mapping")
                
        except Exception as e:
            logger.error(f"Error adding organization BM: {e}")
            raise e
    
    async def get_organization_bms(self, organization_id: str) -> List[Dict[str, Any]]:
        """Get Business Managers for an organization"""
        try:
            response = self.client.table("organization_business_managers") \
                .select("*") \
                .eq("organization_id", organization_id) \
                .eq("is_active", True) \
                .execute()
            
            return response.data
        except Exception as e:
            logger.error(f"Error fetching organization BMs: {e}")
            return []
    
    async def get_user_accessible_bms(self, user_id: str) -> List[str]:
        """Get all Business Manager IDs that a user can access"""
        try:
            # Get user's organizations
            user_orgs = await self.get_user_organizations(user_id)
            if not user_orgs:
                return []
            
            org_ids = [org["id"] for org in user_orgs]
            
            # Get all BMs for those organizations
            response = self.client.table("organization_business_managers") \
                .select("business_manager_id") \
                .in_("organization_id", org_ids) \
                .eq("is_active", True) \
                .execute()
            
            return [bm["business_manager_id"] for bm in response.data]
            
        except Exception as e:
            logger.error(f"Error fetching user accessible BMs: {e}")
            return []
    
    async def get_bm_organization(self, business_manager_id: str) -> Dict[str, Any]:
        """Get organization that owns a Business Manager"""
        try:
            response = self.client.table("organization_business_managers") \
                .select("organization_id, organizations(*)") \
                .eq("business_manager_id", business_manager_id) \
                .eq("is_active", True) \
                .single() \
                .execute()
            
            if response.data:
                return response.data["organizations"]
            return None
            
        except Exception as e:
            logger.error(f"Error fetching BM organization: {e}")
            return None
    
    async def remove_organization_bm(self, organization_id: str, business_manager_id: str) -> bool:
        """Remove Business Manager from organization"""
        try:
            response = self.client.table("organization_business_managers") \
                .update({"is_active": False}) \
                .eq("organization_id", organization_id) \
                .eq("business_manager_id", business_manager_id) \
                .execute()
            
            return len(response.data) > 0
            
        except Exception as e:
            logger.error(f"Error removing organization BM: {e}")
            return False

    # Telegram Group Management Methods
    
    async def add_organization_group(self, organization_id: str, telegram_group_id: int, 
                                   group_name: str = None, group_type: str = "group",
                                   added_by_user_id: str = None) -> Dict[str, Any]:
        """Add Telegram group to organization"""
        try:
            data = {
                "organization_id": organization_id,
                "telegram_group_id": telegram_group_id,
                "group_name": group_name or f"Group-{telegram_group_id}",
                "group_type": group_type,
                "is_active": True,
                "added_by_user_id": added_by_user_id
            }
            
            response = self.client.table("organization_telegram_groups") \
                .insert(data) \
                .execute()
            
            if response.data:
                logger.info(f"Added Telegram group {telegram_group_id} to organization {organization_id}")
                return response.data[0]
            else:
                raise Exception("Failed to add Telegram group mapping")
                
        except Exception as e:
            logger.error(f"Error adding organization group: {e}")
            raise e
    
    async def get_organization_groups(self, organization_id: str) -> List[Dict[str, Any]]:
        """Get Telegram groups for an organization"""
        try:
            response = self.client.table("organization_telegram_groups") \
                .select("*") \
                .eq("organization_id", organization_id) \
                .eq("is_active", True) \
                .execute()
            
            return response.data
        except Exception as e:
            logger.error(f"Error fetching organization groups: {e}")
            return []
    
    async def get_group_organization(self, telegram_group_id: int) -> Dict[str, Any]:
        """Get organization that owns a Telegram group"""
        try:
            response = self.client.table("organization_telegram_groups") \
                .select("organization_id, organizations(*)") \
                .eq("telegram_group_id", telegram_group_id) \
                .eq("is_active", True) \
                .single() \
                .execute()
            
            if response.data:
                return response.data["organizations"]
            return None
            
        except Exception as e:
            logger.error(f"Error fetching group organization: {e}")
            return None
    
    async def remove_organization_group(self, organization_id: str, telegram_group_id: int) -> bool:
        """Remove Telegram group from organization"""
        try:
            response = self.client.table("organization_telegram_groups") \
                .update({"is_active": False}) \
                .eq("organization_id", organization_id) \
                .eq("telegram_group_id", telegram_group_id) \
                .execute()
            
            return len(response.data) > 0
            
        except Exception as e:
            logger.error(f"Error removing organization group: {e}")
            return False

    # Client Registration Methods - DISABLED FOR SECURITY
    # Bot registration is disabled. Users must be registered via Supabase Dashboard or web app.
    
    async def register_client_complete(self, email: str, name: str, organization_name: str) -> Dict[str, Any]:
        """DISABLED: Bot registration is not allowed for security reasons"""
        raise Exception("Bot registration is disabled. Please register users via Supabase Dashboard or web app.")
    
    async def invite_client_to_telegram(self, email: str) -> Dict[str, Any]:
        """Get client info for Telegram invitation"""
        try:
            response = self.client.table("profiles") \
                .select("""
                    id, email, name,
                    organization_members(
                        role,
                        organizations(id, name)
                    )
                """) \
                .eq("email", email) \
                .single() \
                .execute()
            
            return response.data
            
        except Exception as e:
            logger.error(f"Error getting client info for invitation: {e}")
            return None 
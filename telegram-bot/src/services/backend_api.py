"""
Backend API service for Telegram bot
Handles all communication with the FastAPI backend
"""

import aiohttp
import logging
from typing import Dict, List, Optional, Any
from src.config import bot_settings

logger = logging.getLogger(__name__)

class BackendAPI:
    def __init__(self):
        self.base_url = bot_settings.get_backend_api_url.rstrip('/')
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {bot_settings.BACKEND_API_KEY}"
        } if bot_settings.BACKEND_API_KEY else {"Content-Type": "application/json"}
    
    async def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make HTTP request to backend API"""
        url = f"{self.base_url}{endpoint}"
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.request(method, url, headers=self.headers, **kwargs) as response:
                    if response.status == 401:
                        logger.error("Backend API: Unauthorized - check your API key")
                        raise Exception("Unauthorized - check your backend API key")
                    
                    response.raise_for_status()
                    return await response.json()
                    
            except aiohttp.ClientError as e:
                logger.error(f"Backend API request failed: {e}")
                raise Exception(f"Backend API request failed: {e}")
    
    # Ad Accounts Management
    async def get_ad_accounts_inventory(self) -> List[Dict[str, Any]]:
        """Get ad accounts inventory"""
        try:
            result = await self._request("GET", "/api/ad-accounts/inventory")
            return result.get("ad_accounts", [])
        except Exception as e:
            logger.error(f"Error fetching ad accounts inventory: {e}")
            return []
    
    async def sync_from_dolphin_cloud(self) -> Dict[str, Any]:
        """Sync ad accounts from Dolphin Cloud"""
        try:
            return await self._request("POST", "/api/ad-accounts/sync-dolphin")
        except Exception as e:
            logger.error(f"Error syncing from Dolphin Cloud: {e}")
            return {"status": "error", "message": str(e)}
    
    async def sync_spend_data(self) -> Dict[str, Any]:
        """Sync spend data from Dolphin Cloud"""
        try:
            return await self._request("POST", "/api/ad-accounts/sync-spend")
        except Exception as e:
            logger.error(f"Error syncing spend data: {e}")
            return {"status": "error", "message": str(e)}
    
    async def sync_account_status(self, account_id: str) -> Dict[str, Any]:
        """Sync individual account status"""
        try:
            return await self._request("POST", f"/api/ad-accounts/sync-status?ad_account_id={account_id}")
        except Exception as e:
            logger.error(f"Error syncing account status: {e}")
            return {"status": "error", "message": str(e)}
    
    # Organization Management
    async def get_organization_info(self, org_id: str) -> Optional[Dict[str, Any]]:
        """Get organization information"""
        try:
            result = await self._request("GET", f"/api/organizations/{org_id}")
            return result
        except Exception as e:
            logger.error(f"Error fetching organization info: {e}")
            return None
    
    async def get_organization_wallet_balance(self, org_id: str) -> float:
        """Get organization wallet balance"""
        try:
            result = await self._request("GET", f"/api/wallet/balance?organization_id={org_id}")
            return result.get("balance", 0.0)
        except Exception as e:
            logger.error(f"Error fetching wallet balance: {e}")
            return 0.0
    
    # Payment Management
    async def create_payment_intent(self, org_id: str, amount: float) -> Dict[str, Any]:
        """Create payment intent for organization"""
        try:
            payload = {
                "organization_id": org_id,
                "amount": amount
            }
            return await self._request("POST", "/api/payments/create-intent", json=payload)
        except Exception as e:
            logger.error(f"Error creating payment intent: {e}")
            return {"status": "error", "message": str(e)}
    
    async def get_payment_status(self, payment_intent_id: str) -> Dict[str, Any]:
        """Get payment status"""
        try:
            return await self._request("GET", f"/api/payments/intent/{payment_intent_id}")
        except Exception as e:
            logger.error(f"Error fetching payment status: {e}")
            return {"status": "error", "message": str(e)}
    
    async def get_recent_payments(self, org_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Get recent payments for organization"""
        try:
            result = await self._request("GET", f"/api/wallet/transactions?organization_id={org_id}&limit={limit}")
            return result.get("transactions", [])
        except Exception as e:
            logger.error(f"Error fetching recent payments: {e}")
            return []
    
    # User Management
    async def get_user_organizations(self, user_id: str) -> List[Dict[str, Any]]:
        """Get organizations for user"""
        try:
            result = await self._request("GET", f"/api/organizations?user_id={user_id}")
            return result.get("organizations", [])
        except Exception as e:
            logger.error(f"Error fetching user organizations: {e}")
            return []
    
    async def verify_user_access(self, user_id: str, org_id: str) -> bool:
        """Verify user has access to organization"""
        try:
            result = await self._request("GET", f"/api/organizations/{org_id}/members?user_id={user_id}")
            return result.get("is_member", False)
        except Exception as e:
            logger.error(f"Error verifying user access: {e}")
            return False
    
    # Access Code Management
    async def redeem_access_code(self, code: str, telegram_user_id: int, telegram_username: str = None) -> Dict[str, Any]:
        """Redeem access code"""
        try:
            payload = {
                "code": code,
                "telegram_user_id": telegram_user_id,
                "telegram_username": telegram_username
            }
            return await self._request("POST", "/api/access-codes/redeem", json=payload)
        except Exception as e:
            logger.error(f"Error redeeming access code: {e}")
            return {"status": "error", "message": str(e)}
    
    async def get_user_access_info(self, telegram_user_id: int) -> Dict[str, Any]:
        """Get user access information"""
        try:
            return await self._request("GET", f"/api/access-codes/user/{telegram_user_id}")
        except Exception as e:
            logger.error(f"Error fetching user access info: {e}")
            return {"status": "error", "message": str(e)}
    
    # Application Management
    async def get_user_businesses(self, user_id: str) -> List[Dict[str, Any]]:
        """Get businesses for user"""
        try:
            result = await self._request("GET", f"/api/businesses?user_id={user_id}")
            return result.get("businesses", [])
        except Exception as e:
            logger.error(f"Error fetching user businesses: {e}")
            return []
    
    async def submit_application(self, user_id: str, application_data: Dict[str, Any]) -> Dict[str, Any]:
        """Submit ad account application"""
        try:
            return await self._request("POST", "/api/applications/submit", json=application_data)
        except Exception as e:
            logger.error(f"Error submitting application: {e}")
            return {"status": "error", "message": str(e)}
    
    async def get_user_applications(self, telegram_user_id: int) -> List[Dict[str, Any]]:
        """Get user's applications"""
        try:
            # First get user access info to get user_id
            user_info = await self.get_user_access_info(telegram_user_id)
            if user_info.get("status") == "error":
                return []
            
            result = await self._request("GET", "/api/applications")
            return result if isinstance(result, list) else []
        except Exception as e:
            logger.error(f"Error fetching user applications: {e}")
            return []
    
    async def get_application_details(self, application_id: str) -> Dict[str, Any]:
        """Get application details"""
        try:
            result = await self._request("GET", f"/api/applications/{application_id}")
            return result if isinstance(result, dict) else {}
        except Exception as e:
            logger.error(f"Error fetching application details: {e}")
            return {}
    
    # Notifications Management
    async def get_user_notifications(self, telegram_user_id: int) -> List[Dict[str, Any]]:
        """Get user's notifications"""
        try:
            # First get user access info to get user_id
            user_info = await self.get_user_access_info(telegram_user_id)
            if user_info.get("status") == "error":
                return []
            
            result = await self._request("GET", "/api/applications/notifications")
            return result if isinstance(result, list) else []
        except Exception as e:
            logger.error(f"Error fetching user notifications: {e}")
            return []
    
    async def mark_notification_read(self, notification_id: str) -> Dict[str, Any]:
        """Mark notification as read"""
        try:
            return await self._request("PUT", f"/api/applications/notifications/{notification_id}/read")
        except Exception as e:
            logger.error(f"Error marking notification as read: {e}")
            return {"status": "error", "message": str(e)}
    
    # Statistics and Monitoring
    async def get_system_stats(self) -> Dict[str, Any]:
        """Get system statistics"""
        try:
            # This would call multiple endpoints to get comprehensive stats
            inventory = await self.get_ad_accounts_inventory()
            
            total_accounts = len(inventory)
            total_balance = sum(float(acc.get("balance", 0)) for acc in inventory)
            total_spend = sum(float(acc.get("spend_7d", 0)) for acc in inventory)
            
            return {
                "total_accounts": total_accounts,
                "total_balance": total_balance,
                "total_spend_7d": total_spend,
                "average_daily_spend": total_spend / 7 if total_spend > 0 else 0
            }
        except Exception as e:
            logger.error(f"Error fetching system stats: {e}")
            return {
                "total_accounts": 0,
                "total_balance": 0,
                "total_spend_7d": 0,
                "average_daily_spend": 0
            } 
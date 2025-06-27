"""
Dolphin Cloud API service for centralized Facebook asset management
Backend version for FastAPI

Dolphin Cloud provides:
- Centralized management of FB profiles, Business Managers, and ad accounts
- Spend tracking and campaign performance data
- Campaign management (start/stop, budget changes)
- Asset organization and monitoring

What Dolphin Cloud does NOT provide:
- Account top-up functionality (handled by payment providers)
- Real-time account balances (only spend data and limits you set)
"""

import os
import aiohttp
import asyncio
from typing import List, Dict, Optional, Any
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

def get_account_status_emoji(status: str) -> str:
    """Get emoji for account status"""
    status_emojis = {
        "active": "🟢",
        "paused": "🟡", 
        "disabled": "🔴",
        "pending": "🟠",
        "unknown": "⚪"
    }
    return status_emojis.get(status.lower(), "⚪")

def format_currency(amount: float) -> str:
    """Format currency amount"""
    return f"${amount:.2f}"

def calculate_remaining_budget(total_topped_up: float, amount_spent: float) -> float:
    """
    Calculates the remaining ad spend budget.
    
    Args:
        total_topped_up: The total amount paid by the client.
        amount_spent: The amount spent on ads so far.
        
    Returns:
        The remaining budget in the same currency unit.
    """
    # Simplified calculation
    spend_limit = total_topped_up
    remaining_budget = spend_limit - amount_spent
    return remaining_budget if remaining_budget > 0 else 0

def calculate_days_remaining(remaining_budget: float, daily_spend: float) -> float:
    """Calculate days remaining based on remaining budget and daily spend"""
    if daily_spend <= 0:
        return float('inf')
    return remaining_budget / daily_spend

class DolphinCloudAPI:
    def __init__(self):
        # Use environment variables directly for backend
        self.base_url = os.getenv("DOLPHIN_API_URL", "https://cloud.dolphin.tech")
        self.token = os.getenv("DOLPHIN_API_KEY")
        
        if not self.token:
            logger.warning("DOLPHIN_API_KEY not set - Dolphin Cloud features will be disabled")
        
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        } if self.token else {}
    
    async def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make HTTP request to Dolphin Cloud API"""
        if not self.token:
            raise Exception("Dolphin Cloud API token not configured")
        
        url = f"{self.base_url}{endpoint}"
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.request(method, url, headers=self.headers, **kwargs) as response:
                    if response.status == 401:
                        logger.error("Dolphin Cloud API: Unauthorized - check your token")
                        raise Exception("Unauthorized - check your Dolphin Cloud token")
                    
                    response.raise_for_status()
                    return await response.json()
                    
            except aiohttp.ClientError as e:
                logger.error(f"Dolphin API request failed: {e}")
                raise Exception(f"API request failed: {e}")
    
    async def get_fb_accounts(self, business_manager_id: Optional[str] = None, 
                             allowed_bm_ids: Optional[List[str]] = None,
                             per_page: int = 100, page: int = 1) -> List[Dict[str, Any]]:
        """
        Get Facebook ad accounts from your centralized Dolphin Cloud dashboard
        
        This is the core value of Dolphin Cloud - centralized asset management
        across all your FB profiles, Business Managers, and ad accounts
        """
        try:
            params = {
                "perPage": per_page,
                "page": page
            }
            
            if business_manager_id:
                params["businessManagerId"] = business_manager_id
            
            response = await self._request("GET", "/api/v1/fb-accounts", params=params)
            accounts = response.get("data", [])
            
            # Filter accounts by allowed Business Managers if provided
            if allowed_bm_ids:
                filtered_accounts = []
                for account in accounts:
                    # Check if account belongs to any allowed BM
                    account_bms = account.get("bms", [])
                    for bm in account_bms:
                        if bm.get("business_id") in allowed_bm_ids:
                            filtered_accounts.append(account)
                            break
                return filtered_accounts
            
            return accounts
            
        except Exception as e:
            logger.error(f"Error fetching FB accounts: {e}")
            return []
    
    async def get_fb_cabs(self, per_page: int = 100, page: int = 1, 
                         business_manager_id: Optional[str] = None,
                         status_filters: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Get Facebook Ad Accounts (CABs = Cabinets) from Dolphin Cloud
        
        This returns the actual Facebook Ad Accounts, not profiles.
        CABs = "Кабинеты" (Cabinets) = Facebook Ad Accounts in Dolphin terminology.
        """
        try:
            params = {
                "perPage": per_page,
                "page": page,
                "currency": "USD",
                "showArchivedAdAccount": "1",  # Include archived
                "with_trashed": "1",           # Include trashed
                "showAccountArchivedAdAccount": "0"  # Account level archived setting
            }
            
            # Add business manager filter if specified
            if business_manager_id:
                params["businessManagerId"] = business_manager_id
            
            # Add status filters if specified
            if status_filters:
                for status in status_filters:
                    params[f"statusFilters[]"] = status
            
            response = await self._request("GET", "/api/v1/fb-cabs", params=params)
            cabs = response.get("data", [])
            
            logger.info(f"Retrieved {len(cabs)} Facebook Ad Accounts (CABs) from Dolphin Cloud")
            return cabs
            
        except Exception as e:
            logger.error(f"Error fetching FB CABs (Ad Accounts): {e}")
            return []
    
    async def get_account_spend_data(self, account_id: str) -> Dict[str, Any]:
        """
        Get account spending data and limits from Dolphin Cloud
        
        Returns spend data, not account balance. You calculate remaining budget
        based on client top-ups minus your fees and amount spent.
        """
        try:
            # Get spend data from Dolphin Cloud
            accounts = await self.get_fb_accounts()
            
            for account in accounts:
                if account.get("id") == account_id or account.get("account_id") == account_id:
                    spend_7d = float(account.get("spend", 0))
                    daily_spend = spend_7d / 7 if spend_7d > 0 else 0
                    spend_limit = float(account.get("spend_limit", 0))  # Limit you set
                    
                    return {
                        "account_id": account_id,
                        "amount_spent": spend_7d,  # What client has spent
                        "daily_spend": daily_spend,
                        "spend_limit": spend_limit,  # Limit you set based on client top-ups
                        "account_name": account.get("name", ""),
                        "status": account.get("status", "unknown"),
                        "business_managers": account.get("bms", [])
                    }
            
            logger.warning(f"Account {account_id} not found in Dolphin Cloud data")
            return {
                "account_id": account_id,
                "amount_spent": 0,
                "daily_spend": 0,
                "spend_limit": 0,
                "account_name": "",
                "status": "unknown",
                "business_managers": []
            }
            
        except Exception as e:
            logger.error(f"Error getting spend data for account {account_id}: {e}")
            return {
                "account_id": account_id,
                "amount_spent": 0,
                "daily_spend": 0,
                "spend_limit": 0,
                "account_name": "",
                "status": "unknown",
                "business_managers": []
            }
    
    async def get_business_managers(self) -> List[Dict[str, Any]]:
        """Get all Business Managers from your centralized dashboard"""
        try:
            # This endpoint might exist or be part of the accounts data
            accounts = await self.get_fb_accounts()
            
            # Extract unique Business Managers
            bms = {}
            for account in accounts:
                for bm in account.get("bms", []):
                    bm_id = bm.get("business_id")
                    if bm_id and bm_id not in bms:
                        bms[bm_id] = {
                            "business_id": bm_id,
                            "name": bm.get("name", ""),
                            "account_count": 0
                        }
                    if bm_id:
                        bms[bm_id]["account_count"] += 1
            
            return list(bms.values())
            
        except Exception as e:
            logger.error(f"Error fetching Business Managers: {e}")
            return []
    
    async def get_fb_profiles(self) -> List[Dict[str, Any]]:
        """Get all Facebook profiles managed in your centralized dashboard"""
        try:
            # This would typically be a separate endpoint
            # For now, we'll extract profile info from accounts data
            accounts = await self.get_fb_accounts()
            
            profiles = {}
            for account in accounts:
                profile_id = account.get("profile_id")
                if profile_id and profile_id not in profiles:
                    profiles[profile_id] = {
                        "profile_id": profile_id,
                        "name": account.get("profile_name", ""),
                        "account_count": 0
                    }
                if profile_id:
                    profiles[profile_id]["account_count"] += 1
            
            return list(profiles.values())
            
        except Exception as e:
            logger.error(f"Error fetching FB profiles: {e}")
            return []
    
    async def sync_account_data(self, business_manager_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Trigger sync of account data in Dolphin Cloud
        
        This refreshes the data in your centralized dashboard
        """
        try:
            # This would typically trigger a sync operation in Dolphin Cloud
            # For now, we'll just fetch the latest data
            if business_manager_id:
                accounts = await self.get_fb_accounts(business_manager_id=business_manager_id)
            else:
                accounts = await self.get_fb_accounts()
            
            logger.info(f"Synced {len(accounts)} accounts from Dolphin Cloud")
            return accounts
            
        except Exception as e:
            logger.error(f"Error syncing account data: {e}")
            return []
    
    async def get_total_stats(self) -> Dict[str, Any]:
        """Get aggregated statistics across all your managed assets"""
        try:
            accounts = await self.get_fb_accounts()
            bms = await self.get_business_managers()
            profiles = await self.get_fb_profiles()
            
            total_spend = sum(float(account.get("spend", 0)) for account in accounts)
            total_spend_limit = sum(float(account.get("spend_limit", 0)) for account in accounts)
            
            return {
                "total_accounts": len(accounts),
                "total_business_managers": len(bms),
                "total_profiles": len(profiles),
                "total_spend_7d": total_spend,
                "total_spend_limit": total_spend_limit,
                "average_daily_spend": total_spend / 7 if total_spend > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting total stats: {e}")
            return {
                "total_accounts": 0,
                "total_business_managers": 0,
                "total_profiles": 0,
                "total_spend_7d": 0,
                "total_spend_limit": 0,
                "average_daily_spend": 0
            }
    
    async def get_account_insights(self, account_id: str, client_topped_up: float = 0, 
                                  fee_percentage: float = 0.0, date_range: int = 7) -> Dict[str, Any]:
        """
        Get account insights with calculated remaining budget
        
        Args:
            account_id: The account ID
            client_topped_up: Total amount client has topped up with payment provider
            fee_percentage: Your fee percentage (e.g., 0.05 for 5%)
            date_range: Date range for analysis
        """
        try:
            spend_data = await self.get_account_spend_data(account_id)
            
            # Calculate remaining budget based on client top-ups and spending
            remaining_budget = calculate_remaining_budget(
                client_topped_up, 
                spend_data["amount_spent"]
            )
            
            days_remaining = calculate_days_remaining(
                remaining_budget,
                spend_data["daily_spend"]
            )
            
            return {
                "account_id": account_id,
                "date_range": date_range,
                "amount_spent": spend_data["amount_spent"],
                "daily_spend": spend_data["daily_spend"],
                "spend_limit_detected": spend_data["spend_limit"],  # Detected from Dolphin Cloud
                "client_topped_up": client_topped_up,
                "remaining_budget": remaining_budget,
                "days_remaining": days_remaining,
                "fee_percentage": fee_percentage,
                "account_name": spend_data["account_name"],
                "status": spend_data["status"]
            }
            
        except Exception as e:
            logger.error(f"Error getting insights for account {account_id}: {e}")
            return {
                "account_id": account_id,
                "date_range": date_range,
                "amount_spent": 0,
                "daily_spend": 0,
                "spend_limit_detected": 0,  # Detected from Dolphin Cloud
                "client_topped_up": 0,
                "remaining_budget": 0,
                "days_remaining": 0,
                "fee_percentage": fee_percentage,
                "account_name": "",
                "status": "unknown"
            }
    
    async def detect_spend_limit_changes(self, last_known_limits: Dict[str, float]) -> Dict[str, Any]:
        """
        Detect spend limit changes by comparing current Dolphin Cloud data
        with previously known limits
        
        Args:
            last_known_limits: Dict mapping account_id to last known spend limit
            
        Returns:
            Dict with detected changes
        """
        try:
            accounts = await self.get_fb_accounts()
            changes_detected = []
            current_limits = {}
            
            for account in accounts:
                account_id = account.get("id", "")
                current_limit = float(account.get("spend_limit", 0))
                current_limits[account_id] = current_limit
                
                # Check if limit changed
                last_known = last_known_limits.get(account_id, 0)
                if current_limit != last_known and last_known > 0:
                    changes_detected.append({
                        "account_id": account_id,
                        "account_name": account.get("name", ""),
                        "previous_limit": last_known,
                        "new_limit": current_limit,
                        "change_amount": current_limit - last_known,
                        "detected_at": datetime.now().isoformat()
                    })
            
            return {
                "changes_detected": changes_detected,
                "current_limits": current_limits,
                "total_changes": len(changes_detected)
            }
            
        except Exception as e:
            logger.error(f"Error detecting spend limit changes: {e}")
            return {
                "changes_detected": [],
                "current_limits": {},
                "total_changes": 0,
                "error": str(e)
            }
    
    async def get_spend_limit_history(self, account_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """
        Get historical spend limit data for an account
        (This would need to be tracked over time in your database)
        """
        try:
            # This is a placeholder - you'd need to store historical data
            # in your database to track limit changes over time
            current_data = await self.get_account_spend_data(account_id)
            
            return [{
                "date": datetime.now().date().isoformat(),
                "spend_limit": current_data["spend_limit"],
                "account_id": account_id,
                "source": "dolphin_cloud_current"
            }]
            
        except Exception as e:
            logger.error(f"Error getting spend limit history: {e}")
            return [] 
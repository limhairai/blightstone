"""
Dolphin Cloud API service for real-time Meta ad account data
Backend version for FastAPI
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

def calculate_days_remaining(balance: float, daily_spend: float) -> float:
    """Calculate days remaining based on balance and daily spend"""
    if daily_spend <= 0:
        return float('inf')
    return balance / daily_spend

class DolphinCloudAPI:
    def __init__(self):
        # Use environment variables directly for backend
        self.base_url = os.getenv("DOLPHIN_CLOUD_BASE_URL", "https://cloud.dolphin.tech")
        self.token = os.getenv("DOLPHIN_CLOUD_TOKEN")
        
        if not self.token:
            logger.warning("DOLPHIN_CLOUD_TOKEN not set - Dolphin Cloud features will be disabled")
        
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
        """Get Facebook ad accounts filtered by allowed Business Manager IDs"""
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
    
    async def get_fb_cabs(self, per_page: int = 100, page: int = 1) -> List[Dict[str, Any]]:
        """Get Facebook ad account balances (CABs)"""
        try:
            params = {
                "perPage": str(per_page),
                "page": str(page),
                "showAccountArchivedAdAccount": "0",  # Required: 0 for non-archived
                "currency": "USD"  # Required parameter
            }
            
            response = await self._request("GET", "/api/v1/fb-cabs", params=params)
            return response.get("data", [])
            
        except Exception as e:
            logger.error(f"Error fetching FB CABs: {e}")
            return []
    
    async def get_account_balance_and_spend(self, account_id: str) -> Dict[str, Any]:
        """Get specific account balance and spend data"""
        try:
            # Get account from CABs endpoint
            cabs = await self.get_fb_cabs(per_page=100)  # Use smaller page size to avoid 422 error
            
            for cab in cabs:
                if cab.get("id") == account_id or cab.get("account_id") == account_id:
                    balance = float(cab.get("balance", 0))
                    spend_7d = float(cab.get("spend", 0))
                    daily_spend = spend_7d / 7 if spend_7d > 0 else 0
                    
                    return {
                        "balance": balance,
                        "daily_spend": daily_spend,
                        "total_spend": spend_7d,
                        "account_id": account_id
                    }
            
            # If not found in CABs, try FB accounts
            accounts = await self.get_fb_accounts()
            for account in accounts:
                if account.get("id") == account_id or account.get("account_id") == account_id:
                    balance = float(account.get("balance", 0))
                    spend_7d = float(account.get("spend", 0))
                    daily_spend = spend_7d / 7 if spend_7d > 0 else 0
                    
                    return {
                        "balance": balance,
                        "daily_spend": daily_spend,
                        "total_spend": spend_7d,
                        "account_id": account_id
                    }
            
            logger.warning(f"Account {account_id} not found in Dolphin Cloud data")
            return {
                "balance": 0,
                "daily_spend": 0,
                "total_spend": 0,
                "account_id": account_id
            }
            
        except Exception as e:
            logger.error(f"Error getting balance for account {account_id}: {e}")
            return {
                "balance": 0,
                "daily_spend": 0,
                "total_spend": 0,
                "account_id": account_id
            }
    
    async def topup_account(self, cab_id: str, credential_id: str, amount: float) -> Dict[str, Any]:
        """Top up ad account via Dolphin Cloud"""
        try:
            payload = {
                "cabId": cab_id,
                "credentialId": credential_id,
                "amount": amount,
                "currency": "USD"
            }
            
            response = await self._request("POST", "/api/v1/fb-cabs/topup", json=payload)
            return response
            
        except Exception as e:
            logger.error(f"Error topping up account {cab_id}: {e}")
            raise e
    
    async def sync_account_data(self, business_manager_id: str) -> List[Dict[str, Any]]:
        """Sync account data for a business manager"""
        try:
            # This would typically trigger a sync operation in Dolphin Cloud
            # For now, we'll just fetch the latest data
            accounts = await self.get_fb_accounts(business_manager_id=business_manager_id)
            
            # In a real implementation, you might:
            # 1. Trigger a sync operation via API
            # 2. Wait for completion
            # 3. Return the updated data
            
            return accounts
            
        except Exception as e:
            logger.error(f"Error syncing account data for BM {business_manager_id}: {e}")
            return []
    
    async def get_total_stats(self) -> Dict[str, Any]:
        """Get total statistics across all accounts"""
        try:
            accounts = await self.get_fb_accounts()
            cabs = await self.get_fb_cabs()
            
            total_balance = sum(float(cab.get("balance", 0)) for cab in cabs)
            total_spend = sum(float(cab.get("spend", 0)) for cab in cabs)
            
            return {
                "total_accounts": len(accounts),
                "total_balance": total_balance,
                "total_spend_7d": total_spend,
                "average_daily_spend": total_spend / 7 if total_spend > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting total stats: {e}")
            return {
                "total_accounts": 0,
                "total_balance": 0,
                "total_spend_7d": 0,
                "average_daily_spend": 0
            }
    
    async def get_account_insights(self, account_id: str, date_range: int = 7) -> Dict[str, Any]:
        """Get account insights for the specified date range"""
        try:
            # This would typically call a Dolphin Cloud insights endpoint
            # For now, we'll use the balance and spend data
            account_data = await self.get_account_balance_and_spend(account_id)
            
            return {
                "account_id": account_id,
                "date_range": date_range,
                "balance": account_data["balance"],
                "total_spend": account_data["total_spend"],
                "daily_spend": account_data["daily_spend"],
                "days_remaining": calculate_days_remaining(
                    account_data["balance"], 
                    account_data["daily_spend"]
                )
            }
            
        except Exception as e:
            logger.error(f"Error getting insights for account {account_id}: {e}")
            return {
                "account_id": account_id,
                "date_range": date_range,
                "balance": 0,
                "total_spend": 0,
                "daily_spend": 0,
                "days_remaining": 0
            } 
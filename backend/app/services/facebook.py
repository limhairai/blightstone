import os
import requests
import json
from typing import Any, Dict
import logging
import time

FB_GRAPH_URL = 'https://graph.facebook.com/v19.0'
FB_ACCESS_TOKEN = os.getenv('FB_ACCESS_TOKEN')
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

logger = logging.getLogger("facebook_api")

class FacebookAPI:
    def __init__(self, access_token: str = None):
        self.access_token = access_token or FB_ACCESS_TOKEN
        if not self.access_token:
            logger.error('Facebook access token not set in environment variables.')
            raise ValueError('Facebook access token not set in environment variables.')

    def _request_with_retries(self, method, url, **kwargs):
        retries = 3
        for attempt in range(retries):
            try:
                response = method(url, **kwargs)
                response.raise_for_status()
                return response
            except requests.RequestException as e:
                logger.warning(f"Facebook API request failed (attempt {attempt+1}/{retries}): {e}")
                if attempt == retries - 1:
                    logger.error(f"Facebook API request failed after {retries} attempts: {e}")
                    raise
                time.sleep(2 ** attempt)  # Exponential backoff

    def get_ad_accounts(self, bm_id: str) -> Dict[str, Any]:
        url = f"{FB_GRAPH_URL}/{bm_id}/adaccounts"
        params = {"access_token": self.access_token}
        try:
            response = self._request_with_retries(requests.get, url, params=params, headers=HEADERS)
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching ad accounts for BM {bm_id}: {e}")
            raise

    def get_ad_account_details(self, ad_account_id: str) -> Dict[str, Any]:
        url = f"{FB_GRAPH_URL}/act_{ad_account_id}"
        params = {
            "fields": "account_id,name,amount_spent,balance,spend_cap",
            "access_token": self.access_token
        }
        try:
            response = self._request_with_retries(requests.get, url, params=params, headers=HEADERS)
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching ad account details for {ad_account_id}: {e}")
            raise

    def assign_user_to_ad_account(self, ad_account_id: str, fb_user_id: str, role: str = "ADVERTISER"):
        url = f"{FB_GRAPH_URL}/act_{ad_account_id}/assigned_users"
        params = {
            "user": fb_user_id,
            "role": role,
            "access_token": self.access_token
        }
        try:
            response = self._request_with_retries(requests.post, url, data=params, headers=HEADERS)
            return response.json()
        except Exception as e:
            logger.error(f"Error assigning user {fb_user_id} to ad account {ad_account_id}: {e}")
            raise

    def share_ad_account_with_bm(self, host_bm_id: str, partner_bm_id: str, ad_account_id: str):
        url = f"{FB_GRAPH_URL}/{host_bm_id}/partners"
        data = {
            "partner": partner_bm_id,
            "asset": f"act_{ad_account_id}",
            "asset_type": "adaccount",
            "permitted_roles": ["ADVERTISER"],
            "access_token": self.access_token
        }
        try:
            response = self._request_with_retries(requests.post, url, data=data, headers=HEADERS)
            return response.json()
        except Exception as e:
            logger.error(f"Error sharing ad account {ad_account_id} with BM {partner_bm_id}: {e}")
            raise

    def remove_ad_account_from_bm(self, host_bm_id: str, partner_bm_id: str, ad_account_id: str):
        url = f"{FB_GRAPH_URL}/{host_bm_id}/partners"
        data = {
            "partner": partner_bm_id,
            "asset": f"act_{ad_account_id}",
            "asset_type": "adaccount",
            "access_token": self.access_token,
            "remove": True
        }
        try:
            response = self._request_with_retries(requests.post, url, data=data, headers=HEADERS)
            return response.json()
        except Exception as e:
            logger.error(f"Error removing ad account {ad_account_id} from BM {partner_bm_id}: {e}")
            raise

    def set_spend_cap(self, ad_account_id: str, amount_cents: int):
        url = f"{FB_GRAPH_URL}/act_{ad_account_id}"
        data = {
            "spend_cap": amount_cents,
            "access_token": self.access_token
        }
        try:
            response = self._request_with_retries(requests.post, url, data=data, headers=HEADERS)
            return response.json()
        except Exception as e:
            logger.error(f"Error setting spend cap for ad account {ad_account_id}: {e}")
            raise

    def get_ad_accounts_me(self) -> Dict[str, Any]:
        url = f"{FB_GRAPH_URL}/me/adaccounts"
        params = {"access_token": self.access_token}
        try:
            response = self._request_with_retries(requests.get, url, params=params, headers=HEADERS)
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching ad accounts for 'me': {e}")
            raise

    def batch_get_ad_account_details(self, account_ids: list) -> list:
        batch = []
        for acc_id in account_ids:
            batch.append({
                "method": "GET",
                "relative_url": f"act_{acc_id}?fields=account_id,name,business"
            })
        url = f"{FB_GRAPH_URL}/"
        params = {
            "access_token": self.access_token,
            "batch": json.dumps(batch)
        }
        try:
            response = self._request_with_retries(requests.post, url, data=params, headers=HEADERS)
            results = response.json()
            details = []
            for item in results:
                if item.get("code") == 200:
                    details.append(json.loads(item["body"]))
                else:
                    details.append(None)
            return details
        except Exception as e:
            logger.error(f"Error batch fetching ad account details: {e}")
            raise 
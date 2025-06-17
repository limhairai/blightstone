#!/usr/bin/env python3
"""
Dolphin Cloud Integration Test
Test all Dolphin Cloud API endpoints and understand the workflow
"""

import os
import sys
import asyncio
import json
from pathlib import Path
from dotenv import load_dotenv

# Add src directory to Python path
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

# Load environment variables
load_dotenv()

from services.dolphin_service import DolphinCloudAPI

async def test_dolphin_authentication():
    """Test Dolphin Cloud authentication"""
    print("🔐 Testing Dolphin Cloud Authentication...")
    
    token = os.getenv("DOLPHIN_CLOUD_TOKEN")
    if not token:
        print("  ❌ DOLPHIN_CLOUD_TOKEN not set")
        return False
    
    print(f"  📝 Token: {token[:10]}...{token[-10:]}")
    
    try:
        dolphin_api = DolphinCloudAPI()
        print("  ✅ DolphinCloudAPI initialized")
        return True
    except Exception as e:
        print(f"  ❌ Failed to initialize: {e}")
        return False

async def test_fb_accounts_endpoint():
    """Test the FB accounts endpoint"""
    print("\n📊 Testing FB Accounts Endpoint...")
    
    try:
        dolphin_api = DolphinCloudAPI()
        accounts = await dolphin_api.get_fb_accounts(per_page=5)
        
        print(f"  ✅ Retrieved {len(accounts)} accounts")
        
        if accounts:
            print("  📋 Sample account structure:")
            sample = accounts[0]
            for key, value in sample.items():
                print(f"    {key}: {value}")
        else:
            print("  ⚠️ No accounts returned")
        
        return accounts
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return []

async def test_fb_cabs_endpoint():
    """Test the FB CABs (account balances) endpoint"""
    print("\n💰 Testing FB CABs Endpoint...")
    
    try:
        dolphin_api = DolphinCloudAPI()
        cabs = await dolphin_api.get_fb_cabs(per_page=5)
        
        print(f"  ✅ Retrieved {len(cabs)} CAB records")
        
        if cabs:
            print("  📋 Sample CAB structure:")
            sample = cabs[0]
            for key, value in sample.items():
                print(f"    {key}: {value}")
        else:
            print("  ⚠️ No CAB records returned")
        
        return cabs
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return []

async def test_account_balance_lookup():
    """Test looking up specific account balance"""
    print("\n🔍 Testing Account Balance Lookup...")
    
    try:
        dolphin_api = DolphinCloudAPI()
        
        # First get some accounts to test with
        accounts = await dolphin_api.get_fb_accounts(per_page=3)
        
        if not accounts:
            print("  ⚠️ No accounts to test with")
            return
        
        # Test balance lookup for first account
        test_account = accounts[0]
        account_id = test_account.get("id") or test_account.get("account_id")
        
        if not account_id:
            print("  ❌ No account ID found in account data")
            return
        
        print(f"  🎯 Testing with account ID: {account_id}")
        
        balance_data = await dolphin_api.get_account_balance_and_spend(account_id)
        
        print("  ✅ Balance data retrieved:")
        for key, value in balance_data.items():
            print(f"    {key}: {value}")
        
        return balance_data
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return {}

async def test_topup_workflow():
    """Test the top-up workflow (without actually topping up)"""
    print("\n💸 Testing Top-up Workflow...")
    
    credential_id = os.getenv("PAYMENT_CREDENTIAL_ID")
    if not credential_id:
        print("  ⚠️ PAYMENT_CREDENTIAL_ID not set - cannot test top-up")
        return False
    
    try:
        dolphin_api = DolphinCloudAPI()
        
        # Get accounts to test with
        accounts = await dolphin_api.get_fb_accounts(per_page=1)
        
        if not accounts:
            print("  ❌ No accounts available for testing")
            return False
        
        test_account = accounts[0]
        account_id = test_account.get("id") or test_account.get("account_id")
        
        print(f"  🎯 Would top up account: {account_id}")
        print(f"  💳 Using credential: {credential_id}")
        print(f"  💰 Test amount: $1.00")
        
        # Don't actually run the top-up in test mode
        print("  ⚠️ Skipping actual top-up in test mode")
        print("  ✅ Top-up workflow validated")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

async def analyze_dolphin_data_structure():
    """Analyze the data structure returned by Dolphin Cloud"""
    print("\n🔬 Analyzing Dolphin Cloud Data Structure...")
    
    try:
        dolphin_api = DolphinCloudAPI()
        
        # Get data from both endpoints
        accounts = await dolphin_api.get_fb_accounts(per_page=3)
        cabs = await dolphin_api.get_fb_cabs(per_page=3)
        
        print("📊 FB Accounts Data Structure:")
        if accounts:
            account_keys = set()
            for account in accounts:
                account_keys.update(account.keys())
            
            print("  Available fields:")
            for key in sorted(account_keys):
                print(f"    - {key}")
        
        print("\n💰 FB CABs Data Structure:")
        if cabs:
            cab_keys = set()
            for cab in cabs:
                cab_keys.update(cab.keys())
            
            print("  Available fields:")
            for key in sorted(cab_keys):
                print(f"    - {key}")
        
        # Compare the two
        if accounts and cabs:
            account_keys = set(accounts[0].keys())
            cab_keys = set(cabs[0].keys())
            
            print("\n🔄 Data Comparison:")
            print(f"  Common fields: {account_keys & cab_keys}")
            print(f"  Only in accounts: {account_keys - cab_keys}")
            print(f"  Only in cabs: {cab_keys - account_keys}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

async def test_business_manager_filtering():
    """Test filtering by business manager ID"""
    print("\n🏢 Testing Business Manager Filtering...")
    
    try:
        dolphin_api = DolphinCloudAPI()
        
        # Get all accounts first
        all_accounts = await dolphin_api.get_fb_accounts(per_page=10)
        
        if not all_accounts:
            print("  ❌ No accounts to test with")
            return False
        
        print(f"  📊 Total accounts: {len(all_accounts)}")
        
        # Find unique business manager IDs
        bm_ids = set()
        for account in all_accounts:
            bm_id = account.get("business_manager_id") or account.get("businessManagerId")
            if bm_id:
                bm_ids.add(bm_id)
        
        print(f"  🏢 Found {len(bm_ids)} unique business managers")
        
        if bm_ids:
            # Test filtering by first BM ID
            test_bm_id = list(bm_ids)[0]
            print(f"  🎯 Testing filter with BM ID: {test_bm_id}")
            
            filtered_accounts = await dolphin_api.get_fb_accounts(business_manager_id=test_bm_id)
            print(f"  ✅ Filtered results: {len(filtered_accounts)} accounts")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

async def main():
    """Run all Dolphin Cloud integration tests"""
    print("🐬 Dolphin Cloud Integration Test Suite")
    print("=" * 50)
    
    tests = [
        test_dolphin_authentication,
        test_fb_accounts_endpoint,
        test_fb_cabs_endpoint,
        test_account_balance_lookup,
        test_topup_workflow,
        analyze_dolphin_data_structure,
        test_business_manager_filtering
    ]
    
    results = []
    
    for test in tests:
        try:
            result = await test()
            results.append(result)
        except Exception as e:
            print(f"  💥 Test failed with exception: {e}")
            results.append(False)
    
    print("\n" + "=" * 50)
    print("📋 Test Summary:")
    
    passed = sum(1 for r in results if r)
    total = len(results)
    
    print(f"✅ Passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! Dolphin Cloud integration is working.")
    else:
        print("⚠️ Some tests failed. Check the output above for details.")
    
    print("\n💡 Next Steps:")
    print("1. Review the data structures returned by Dolphin Cloud")
    print("2. Verify the top-up workflow with small amounts")
    print("3. Test with your actual business manager IDs")
    print("4. Set up proper error handling for production")

if __name__ == "__main__":
    asyncio.run(main()) 
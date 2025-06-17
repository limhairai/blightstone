#!/usr/bin/env python3
"""
Test script to verify AdHub Telegram Bot setup
Run this before starting the bot to ensure everything is configured correctly
"""

import os
import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Add src directory to Python path
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

# Load environment variables
load_dotenv()

async def test_environment():
    """Test environment variables"""
    print("🔧 Testing Environment Variables...")
    
    required_vars = [
        "TELEGRAM_BOT_TOKEN",
        "SUPABASE_URL"
    ]
    
    # Either service role key or anon key is required
    auth_vars = ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY"]
    
    optional_vars = [
        "DOLPHIN_CLOUD_TOKEN",
        "PAYMENT_CREDENTIAL_ID"
    ]
    
    missing_required = []
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"  ✅ {var}: {'*' * 10}")
        else:
            print(f"  ❌ {var}: Missing")
            missing_required.append(var)
    
    # Check for at least one auth key
    has_auth = False
    for var in auth_vars:
        value = os.getenv(var)
        if value:
            print(f"  ✅ {var}: {'*' * 10}")
            has_auth = True
        else:
            print(f"  ⚠️ {var}: Not set")
    
    if not has_auth:
        print(f"  ❌ Need at least one of: {', '.join(auth_vars)}")
        missing_required.append("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY")
    
    for var in optional_vars:
        value = os.getenv(var)
        if value:
            print(f"  ✅ {var}: {'*' * 10}")
        else:
            print(f"  ⚠️ {var}: Not set (optional)")
    
    if missing_required:
        print(f"\n❌ Missing required environment variables: {', '.join(missing_required)}")
        return False
    
    print("✅ Environment variables OK")
    return True

async def test_supabase():
    """Test Supabase connection"""
    print("\n📊 Testing Supabase Connection...")
    
    try:
        from services.supabase_service import SupabaseService
        
        supabase_service = SupabaseService()
        
        # Test basic connection
        response = supabase_service.client.table("profiles").select("id").limit(1).execute()
        print("  ✅ Supabase connection successful")
        
        # Test if telegram_id column exists (from our migration)
        try:
            response = supabase_service.client.table("profiles").select("telegram_id").limit(1).execute()
            print("  ✅ telegram_id column exists")
        except Exception as e:
            print(f"  ❌ telegram_id column missing - run migration: {e}")
            return False
        
        return True
        
    except Exception as e:
        print(f"  ❌ Supabase connection failed: {e}")
        return False

async def test_dolphin():
    """Test Dolphin Cloud API connection"""
    print("\n🐬 Testing Dolphin Cloud API...")
    
    dolphin_token = os.getenv("DOLPHIN_CLOUD_TOKEN")
    if not dolphin_token:
        print("  ⚠️ DOLPHIN_CLOUD_TOKEN not set - skipping test")
        return True
    
    try:
        from services.dolphin_service import DolphinCloudAPI
        
        dolphin_api = DolphinCloudAPI()
        
        # Test API connection
        accounts = await dolphin_api.get_fb_accounts()
        print(f"  ✅ Dolphin Cloud API connection successful")
        print(f"  📊 Found {len(accounts)} accounts")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Dolphin Cloud API failed: {e}")
        print("  💡 This is OK for testing - you can add the token later")
        return True

async def test_telegram_bot():
    """Test Telegram Bot token"""
    print("\n🤖 Testing Telegram Bot Token...")
    
    try:
        from telegram import Bot
        
        token = os.getenv("TELEGRAM_BOT_TOKEN")
        if not token:
            print("  ❌ TELEGRAM_BOT_TOKEN not set")
            return False
        
        bot = Bot(token)
        bot_info = await bot.get_me()
        
        print(f"  ✅ Bot token valid")
        print(f"  🤖 Bot name: {bot_info.first_name}")
        print(f"  🆔 Bot username: @{bot_info.username}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Telegram bot token invalid: {e}")
        return False

async def main():
    """Run all tests"""
    print("🚀 AdHub Telegram Bot Setup Test\n")
    
    tests = [
        test_environment,
        test_supabase,
        test_dolphin,
        test_telegram_bot
    ]
    
    results = []
    
    for test in tests:
        try:
            result = await test()
            results.append(result)
        except Exception as e:
            print(f"  ❌ Test failed with exception: {e}")
            results.append(False)
    
    print("\n" + "="*50)
    print("📋 Test Summary:")
    
    if all(results):
        print("✅ All tests passed! Your bot is ready to start.")
        print("\n🚀 To start the bot, run:")
        print("  cd telegram-bot && python run_bot.py")
        
        print("\n📖 Next steps:")
        print("  1. Start the bot")
        print("  2. Message your bot on Telegram")
        print("  3. Use /start to begin")
        print("  4. Use /link your-email@example.com to connect your account")
        
    else:
        print("❌ Some tests failed. Please fix the issues above before starting the bot.")
        
        failed_count = sum(1 for r in results if not r)
        print(f"\n📊 {len(results) - failed_count}/{len(results)} tests passed")
    
    print("\n💡 Need help? Check the README or contact support.")

if __name__ == "__main__":
    asyncio.run(main()) 
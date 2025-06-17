#!/usr/bin/env python3
"""
Environment Setup Helper
Helps set up the .env file with all required variables
"""

import os
from pathlib import Path

def create_env_file():
    """Create .env file with template"""
    
    env_path = Path(".env")
    
    if env_path.exists():
        print("📝 .env file already exists")
        response = input("Do you want to overwrite it? (y/n): ")
        if response.lower() != 'y':
            print("❌ Setup cancelled")
            return
    
    print("🚀 Setting up AdHub Telegram Bot environment...")
    
    # Get required values
    telegram_token = input("🤖 Enter your Telegram Bot Token (from @BotFather): ").strip()
    supabase_url = input("🗄️ Enter your Supabase URL: ").strip()
    supabase_key = input("🔑 Enter your Supabase Service Role Key: ").strip()
    dolphin_token = input("🐬 Enter your Dolphin Cloud Bearer Token: ").strip()
    
    # Optional values
    print("\n📋 Optional settings (press Enter to skip):")
    payment_credential = input("💳 Payment Credential ID: ").strip()
    admin_ids = input("👑 Admin User IDs (comma-separated): ").strip()
    
    # Create .env content
    env_content = f"""# AdHub Telegram Bot Configuration

# Telegram Bot (Required)
TELEGRAM_BOT_TOKEN={telegram_token}

# Supabase Database (Required)
SUPABASE_URL={supabase_url}
SUPABASE_SERVICE_ROLE_KEY={supabase_key}

# Dolphin Cloud API (Required)
DOLPHIN_CLOUD_BASE_URL=https://cloud.dolphin.tech
DOLPHIN_CLOUD_TOKEN={dolphin_token}

# Payment Configuration (Optional)
PAYMENT_CREDENTIAL_ID={payment_credential}

# Bot Admin Configuration (Optional)
ADMIN_USER_IDS={admin_ids}

# Logging
LOG_LEVEL=INFO

# Bot Settings
BOT_NAME=AdHub Bot
DEFAULT_CRITICAL_THRESHOLD_DAYS=1
DEFAULT_WARNING_THRESHOLD_DAYS=3
"""

    # Write .env file
    with open(env_path, 'w') as f:
        f.write(env_content)
    
    print(f"✅ Created .env file at {env_path.absolute()}")
    print("\n🧪 You can now test the setup with:")
    print("  python test_setup.py")
    print("  python test_dolphin_integration.py")
    print("\n🚀 Run the bot with:")
    print("  python run_bot.py")

def check_env_file():
    """Check if .env file exists and show status"""
    
    env_path = Path(".env")
    
    if not env_path.exists():
        print("❌ .env file not found")
        return False
    
    print("✅ .env file found")
    
    # Load and check required variables
    from dotenv import load_dotenv
    load_dotenv()
    
    required_vars = [
        "TELEGRAM_BOT_TOKEN",
        "SUPABASE_URL", 
        "SUPABASE_SERVICE_ROLE_KEY",
        "DOLPHIN_CLOUD_TOKEN"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing required variables: {', '.join(missing_vars)}")
        return False
    
    print("✅ All required environment variables are set")
    
    # Show token info (masked)
    dolphin_token = os.getenv("DOLPHIN_CLOUD_TOKEN")
    if dolphin_token:
        print(f"🐬 Dolphin Token: {dolphin_token[:10]}...{dolphin_token[-4:]}")
    
    return True

if __name__ == "__main__":
    print("🔧 AdHub Telegram Bot - Environment Setup")
    print("=" * 50)
    
    if check_env_file():
        print("\n✅ Environment is already configured!")
        print("🧪 Run tests with: python test_setup.py")
        print("🚀 Start bot with: python run_bot.py")
    else:
        print("\n🛠️ Setting up environment...")
        create_env_file() 
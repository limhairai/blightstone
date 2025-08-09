#!/usr/bin/env python3
"""
Backend Environment Checker
Run this script to verify your current environment configuration
"""

import os

def load_env_file(filename='.env'):
    """Simple .env file loader"""
    env_vars = {}
    try:
        with open(filename, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    except FileNotFoundError:
        print(f"⚠️  {filename} file not found")
    return env_vars

def main():
    print("🔍 Backend Environment Configuration")
    print("=" * 50)
    
    # Load environment variables from .env file
    env_vars = load_env_file()
    
    if not env_vars:
        print("❌ No .env file found or file is empty")
        return
    
    # Environment info
    environment = env_vars.get('ENVIRONMENT', 'unknown')
    debug = env_vars.get('DEBUG', 'false')
    
    print(f"Environment: {environment.upper()}")
    print(f"Debug Mode: {debug}")
    
    # Supabase info
    supabase_url = env_vars.get('SUPABASE_URL', 'not set')
    is_local = '127.0.0.1' in supabase_url
    
    print(f"\n🗄️  Database Configuration")
    print(f"Supabase URL: {supabase_url}")
    print(f"Connection: {'LOCAL (supabase start)' if is_local else 'REMOTE'}")
    
    # API info
    fb_token = env_vars.get('FB_ACCESS_TOKEN')
    if fb_token:
        print(f"\n📱 Facebook API: Configured ({fb_token[:20]}...)")
    else:
        print(f"\n📱 Facebook API: Not configured (development mode)")
    
    # Security
    secret_key = env_vars.get('SECRET_KEY')
    if secret_key:
        print(f"🔐 Secret Key: Configured ({secret_key[:10]}...)")
    else:
        print(f"🔐 Secret Key: Not configured")
    
    print("\n" + "=" * 50)
    
    if environment == 'development':
        print("✅ Ready for local development with Supabase!")
    elif environment == 'staging':
        print("🟡 Configured for staging environment")
    elif environment == 'production':
        print("🔴 Configured for production environment")
    else:
        print("⚠️  Unknown environment configuration")

if __name__ == "__main__":
    main() 
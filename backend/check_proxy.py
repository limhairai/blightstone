#!/usr/bin/env python3
"""
Proxy Configuration Checker
Tests the complete proxy setup between frontend and backend
"""

import os
import sys
import requests
import json
import time
from urllib.parse import urljoin

# Colors for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_status(message, status="info"):
    colors = {
        "success": Colors.GREEN + "✅ ",
        "error": Colors.RED + "❌ ",
        "warning": Colors.YELLOW + "⚠️  ",
        "info": Colors.BLUE + "ℹ️  "
    }
    print(f"{colors.get(status, '')}{message}{Colors.END}")

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
        print_status(f"{filename} file not found", "warning")
    return env_vars

def test_backend_health():
    """Test if backend is running and healthy"""
    print_status("Testing Backend Health", "info")
    
    backend_urls = [
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    for url in backend_urls:
        try:
            # Test basic connectivity
            response = requests.get(f"{url}/docs", timeout=5)
            if response.status_code == 200:
                print_status(f"Backend accessible at {url}", "success")
                
                # Test API endpoint
                try:
                    api_response = requests.get(f"{url}/api/v1/health", timeout=5)
                    if api_response.status_code == 200:
                        print_status("Backend API endpoints working", "success")
                    else:
                        print_status(f"Backend API returned {api_response.status_code}", "warning")
                except:
                    print_status("Backend API health endpoint not found (may be normal)", "warning")
                
                return url
        except requests.exceptions.RequestException as e:
            print_status(f"Backend not accessible at {url}: {str(e)}", "error")
    
    print_status("Backend is not running on any expected port", "error")
    return None

def test_frontend_proxy():
    """Test if frontend proxy is working"""
    print_status("Testing Frontend Proxy", "info")
    
    frontend_urls = [
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    for url in frontend_urls:
        try:
            # Test proxy test endpoint
            response = requests.get(f"{url}/api/proxy/test", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print_status(f"Frontend proxy test endpoint working at {url}", "success")
                print_status(f"Response: {data.get('message', 'No message')}", "info")
                return url
        except requests.exceptions.RequestException as e:
            print_status(f"Frontend proxy not accessible at {url}: {str(e)}", "error")
    
    print_status("Frontend proxy is not responding", "error")
    return None

def test_cors_configuration():
    """Test CORS configuration"""
    print_status("Testing CORS Configuration", "info")
    
    # Load backend env
    backend_env = load_env_file('.env')
    cors_origins = backend_env.get('CORS_ORIGINS_STRING', '')
    
    if cors_origins:
        origins = [origin.strip() for origin in cors_origins.split(',')]
        print_status(f"CORS origins configured: {', '.join(origins)}", "success")
        
        # Test CORS preflight
        try:
            response = requests.options(
                "http://localhost:8000/api/v1/health",
                headers={
                    'Origin': 'http://localhost:3000',
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'authorization,content-type'
                },
                timeout=5
            )
            
            if 'access-control-allow-origin' in response.headers:
                print_status("CORS preflight working", "success")
            else:
                print_status("CORS headers not found in response", "warning")
                
        except requests.exceptions.RequestException as e:
            print_status(f"CORS test failed: {str(e)}", "error")
    else:
        print_status("CORS_ORIGINS_STRING not configured", "warning")

def test_proxy_routing():
    """Test if proxy correctly routes requests"""
    print_status("Testing Proxy Routing", "info")
    
    # Test if frontend can proxy to backend
    try:
        # This should go through the proxy
        response = requests.get("http://localhost:3000/api/proxy/v1/health", timeout=10)
        if response.status_code == 200:
            print_status("Proxy routing working correctly", "success")
        elif response.status_code == 404:
            print_status("Proxy routing to backend, but endpoint not found (normal)", "warning")
        else:
            print_status(f"Proxy returned status {response.status_code}", "warning")
    except requests.exceptions.RequestException as e:
        print_status(f"Proxy routing test failed: {str(e)}", "error")

def check_environment_config():
    """Check environment configuration"""
    print_status("Checking Environment Configuration", "info")
    
    # Backend config
    backend_env = load_env_file('.env')
    required_backend = ['SUPABASE_URL', 'API_URL']
    optional_backend = ['CORS_ORIGINS_STRING', 'SECRET_KEY']
    
    print_status("Backend Configuration:", "info")
    for key in required_backend:
        if key in backend_env:
            print_status(f"  {key}: ✓ Configured", "success")
        else:
            print_status(f"  {key}: ✗ Missing", "error")
    
    for key in optional_backend:
        if key in backend_env:
            print_status(f"  {key}: ✓ Configured", "success")
        else:
            print_status(f"  {key}: - Not set", "warning")
    
    # Frontend config
    frontend_env = load_env_file('../frontend/.env.local')
    required_frontend = ['NEXT_PUBLIC_SUPABASE_URL']
    optional_frontend = ['BACKEND_API_URL', 'NEXT_PUBLIC_API_URL']
    
    print_status("Frontend Configuration:", "info")
    for key in required_frontend:
        if key in frontend_env:
            print_status(f"  {key}: ✓ Configured", "success")
        else:
            print_status(f"  {key}: ✗ Missing", "error")
    
    for key in optional_frontend:
        if key in frontend_env:
            print_status(f"  {key}: ✓ Configured", "success")
        else:
            print_status(f"  {key}: - Not set", "warning")

def main():
    print(f"{Colors.BOLD}🔍 Proxy Configuration Checker{Colors.END}")
    print("=" * 50)
    
    # Check environment configuration
    check_environment_config()
    print()
    
    # Test backend
    backend_url = test_backend_health()
    print()
    
    # Test frontend proxy
    frontend_url = test_frontend_proxy()
    print()
    
    # Test CORS
    test_cors_configuration()
    print()
    
    # Test proxy routing
    test_proxy_routing()
    print()
    
    # Summary
    print("=" * 50)
    print(f"{Colors.BOLD}Summary:{Colors.END}")
    
    if backend_url and frontend_url:
        print_status("✅ Basic proxy setup is working", "success")
        print_status("Frontend can communicate with backend through proxy", "success")
    elif backend_url and not frontend_url:
        print_status("⚠️  Backend is running but frontend proxy has issues", "warning")
        print_status("Check if frontend development server is running", "info")
    elif not backend_url and frontend_url:
        print_status("⚠️  Frontend is running but backend is not accessible", "warning")
        print_status("Start the backend server with: uvicorn app.main:app --reload", "info")
    else:
        print_status("❌ Both frontend and backend have connectivity issues", "error")
        print_status("Start both servers and check configuration", "info")
    
    print()
    print(f"{Colors.BOLD}Quick Start Commands:{Colors.END}")
    print("Backend: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    print("Frontend: cd ../frontend && npm run dev")

if __name__ == "__main__":
    main() 
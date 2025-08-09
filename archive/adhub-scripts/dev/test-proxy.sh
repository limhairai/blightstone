#!/bin/bash

# Quick Proxy Test Script
# Tests proxy configuration and connectivity

echo "🔍 Quick Proxy Configuration Test"
echo "=================================="

# Test backend connectivity
echo "🔧 Testing Backend..."
if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
    echo "✅ Backend is running on port 8000"
    
    # Test API endpoint
    if curl -s http://localhost:8000/api/v1/health > /dev/null 2>&1; then
        echo "✅ Backend API endpoints accessible"
    else
        echo "⚠️  Backend API health endpoint not found (may be normal)"
    fi
else
    echo "❌ Backend not running on port 8000"
    echo "   Start with: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
fi

echo ""

# Test frontend connectivity
echo "🎨 Testing Frontend..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is running on port 3000"
    
    # Test proxy endpoint
    if curl -s http://localhost:3000/api/proxy/test > /dev/null 2>&1; then
        echo "✅ Frontend proxy test endpoint working"
        PROXY_RESPONSE=$(curl -s http://localhost:3000/api/proxy/test)
        echo "   Response: $PROXY_RESPONSE"
    else
        echo "❌ Frontend proxy test endpoint not responding"
    fi
else
    echo "❌ Frontend not running on port 3000"
    echo "   Start with: cd frontend && npm run dev"
fi

echo ""

# Test proxy routing (if both servers are running)
echo "🔄 Testing Proxy Routing..."
if curl -s http://localhost:3000/api/proxy/v1/health > /dev/null 2>&1; then
    echo "✅ Proxy routing working correctly"
elif curl -s http://localhost:3000 > /dev/null 2>&1 && curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "⚠️  Proxy routing to backend, but endpoint not found (may be normal)"
else
    echo "❌ Cannot test proxy routing - servers not running"
fi

echo ""
echo "💡 For comprehensive testing, run: cd backend && source venv/bin/activate && python check_proxy.py" 
#!/bin/bash

# AdHub Service Monitor
# Quick health check for both frontend and backend

echo "🔍 AdHub Service Health Check"
echo "=================================="

# Backend Health Check
echo ""
echo "📡 Backend (Render):"
echo "URL: https://adhub-backend-prod.onrender.com"
backend_status=$(curl -s -o /dev/null -w "%{http_code}" https://adhub-backend-prod.onrender.com/health)
if [ "$backend_status" = "200" ]; then
    echo "✅ Backend: HEALTHY ($backend_status)"
else
    echo "❌ Backend: ERROR ($backend_status)"
fi

# Frontend Health Check  
echo ""
echo "🌐 Frontend (Vercel):"
echo "URL: https://adhub-gj5sdccf3-ad-hub.vercel.app"
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" https://adhub-gj5sdccf3-ad-hub.vercel.app)
if [ "$frontend_status" = "200" ]; then
    echo "✅ Frontend: HEALTHY ($frontend_status)"
else
    echo "❌ Frontend: ERROR ($frontend_status)"
fi

# API Connection Test
echo ""
echo "🔗 API Connection Test:"
api_status=$(curl -s -o /dev/null -w "%{http_code}" https://adhub-backend-prod.onrender.com/api/auth/me)
if [ "$api_status" = "401" ]; then
    echo "✅ API: RESPONDING (401 = requires auth token, which is correct)"
elif [ "$api_status" = "200" ]; then
    echo "✅ API: RESPONDING (200)"
else
    echo "❌ API: ERROR ($api_status)"
fi

echo ""
echo "🚀 Test login now: https://adhub-gj5sdccf3-ad-hub.vercel.app/login"
echo "" 
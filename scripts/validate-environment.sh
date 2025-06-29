#!/bin/bash

# 🔍 ADHUB ENVIRONMENT VALIDATION SCRIPT
# Validates that environment is properly configured

set -e

echo "🔍 AdHub Environment Validation"
echo "==============================="

# Check current directory
if [ ! -f "package.json" ] && [ ! -f "frontend/package.json" ]; then
    echo "❌ Please run this script from the AdHub root directory"
    exit 1
fi

# Frontend validation
echo ""
echo "🔧 Frontend Environment Check:"
cd frontend 2>/dev/null || cd .

if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
    
    # Check required variables
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo "✅ NEXT_PUBLIC_SUPABASE_URL configured"
    else
        echo "⚠️  NEXT_PUBLIC_SUPABASE_URL missing"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY configured"
    else
        echo "⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY missing"
    fi
    
    # Check demo data setting
    if grep -q "NEXT_PUBLIC_USE_DEMO_DATA=true" .env.local; then
        echo "🧪 Using demo data (development mode)"
    elif grep -q "NEXT_PUBLIC_USE_DEMO_DATA=false" .env.local; then
        echo "🗄️  Using real Supabase data"
    else
        echo "⚠️  NEXT_PUBLIC_USE_DEMO_DATA not set"
    fi
else
    echo "❌ .env.local missing - run setup script first"
fi

# Backend validation
echo ""
echo "🔧 Backend Environment Check:"
cd ../backend 2>/dev/null || cd ../backend

if [ -f ".env" ]; then
    echo "✅ .env exists"
    
    # Check required variables
    if grep -q "SUPABASE_URL" .env; then
        echo "✅ SUPABASE_URL configured"
    else
        echo "⚠️  SUPABASE_URL missing"
    fi
    
    if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env; then
        echo "✅ SUPABASE_SERVICE_ROLE_KEY configured"
    else
        echo "⚠️  SUPABASE_SERVICE_ROLE_KEY missing"
    fi
else
    echo "❌ backend/.env missing - run setup script first"
fi

# Deployment validation
echo ""
echo "🚀 Deployment Configuration Check:"
cd ..

if [ -f "config/render/render.yaml" ]; then
    echo "✅ Production Render config exists"
else
    echo "⚠️  Production Render config missing"
fi

if [ -f "config/render/render-staging.yaml" ]; then
    echo "✅ Staging Render config exists"
else
    echo "⚠️  Staging Render config missing"
fi

echo ""
echo "🎯 Environment Validation Complete!"
echo ""
echo "Next steps:"
echo "1. If any items show ⚠️  or ❌, run: ./scripts/setup-environment.sh development"
echo "2. Edit .env files with your actual credentials"
echo "3. Test with: cd frontend && npm run dev"

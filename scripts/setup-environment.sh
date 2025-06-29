#!/bin/bash

# 🌍 ADHUB ENVIRONMENT SETUP SCRIPT
# Sets up development, staging, or production environment

set -e

echo "🌍 AdHub Environment Setup"
echo "=========================="

# Check if environment argument is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 [development|staging|production]"
    echo ""
    echo "Examples:"
    echo "  $0 development    # Set up local development"
    echo "  $0 staging        # Configure for staging deployment"
    echo "  $0 production     # Configure for production deployment"
    exit 1
fi

ENVIRONMENT=$1

case $ENVIRONMENT in
    development)
        echo "🔧 Setting up DEVELOPMENT environment..."
        
        # Frontend setup
        cd frontend
        if [ ! -f .env.local ]; then
            cp .env.example .env.local
            echo "✅ Created frontend/.env.local from template"
            echo "⚠️  Please edit .env.local with your Supabase credentials"
        else
            echo "✅ frontend/.env.local already exists"
        fi
        
        # Backend setup
        cd ../backend
        if [ ! -f .env ]; then
            cp .env.example .env
            echo "✅ Created backend/.env from template"
            echo "⚠️  Please edit .env with your configuration"
        else
            echo "✅ backend/.env already exists"
        fi
        
        echo ""
        echo "🎯 Development environment ready!"
        echo "Next steps:"
        echo "1. Edit frontend/.env.local with your Supabase credentials"
        echo "2. Edit backend/.env with your configuration"
        echo "3. Run 'npm run dev' in frontend/"
        echo "4. Run 'uvicorn main:app --reload' in backend/"
        ;;
        
    staging)
        echo "🧪 Setting up STAGING environment..."
        echo ""
        echo "📋 Staging Environment Variables for Render:"
        echo ""
        echo "Backend (adhub-backend-staging):"
        echo "ENVIRONMENT=staging"
        echo "SUPABASE_URL=https://your-staging-project.supabase.co"
        echo "SUPABASE_SERVICE_ROLE_KEY=eyJ...staging-service-key"
        echo "STRIPE_SECRET_KEY=sk_test_...  # Test mode"
        echo "DOLPHIN_CLOUD_TOKEN=your-staging-token"
        echo ""
        echo "Frontend (adhub-frontend-staging):"
        echo "NODE_ENV=production"
        echo "NEXT_PUBLIC_ENVIRONMENT=staging"
        echo "NEXT_PUBLIC_USE_DEMO_DATA=false"
        echo "NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co"
        echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...staging-anon-key"
        echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Test mode"
        echo ""
        echo "🎯 Copy these to your Render dashboard!"
        ;;
        
    production)
        echo "🚀 Setting up PRODUCTION environment..."
        echo ""
        echo "📋 Production Environment Variables for Render:"
        echo ""
        echo "Backend (adhub-backend-prod):"
        echo "ENVIRONMENT=production"
        echo "SUPABASE_URL=https://your-production-project.supabase.co"
        echo "SUPABASE_SERVICE_ROLE_KEY=eyJ...production-service-key"
        echo "STRIPE_SECRET_KEY=sk_live_...  # LIVE mode"
        echo "DOLPHIN_CLOUD_TOKEN=your-production-token"
        echo ""
        echo "Frontend (adhub-frontend-prod):"
        echo "NODE_ENV=production"
        echo "NEXT_PUBLIC_ENVIRONMENT=production"
        echo "NEXT_PUBLIC_USE_DEMO_DATA=false"
        echo "NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co"
        echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...production-anon-key"
        echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # LIVE mode"
        echo ""
        echo "⚠️  CRITICAL: Use LIVE Stripe keys for production!"
        echo "🎯 Copy these to your Render dashboard!"
        ;;
        
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        echo "Valid options: development, staging, production"
        exit 1
        ;;
esac

echo ""
echo "✅ Environment setup complete!"

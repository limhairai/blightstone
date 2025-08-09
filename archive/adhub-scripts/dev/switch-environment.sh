#!/bin/bash

# Environment Switcher Script
# Switches between local, development, and production environments
# Handles BOTH frontend and backend consistently

show_usage() {
    echo "🔄 Blightstone Environment Switcher"
    echo "============================"
    echo ""
    echo "Usage: $0 [local|development|production|restore]"
    echo ""
    echo "Environments:"
    echo "  local       - Local Supabase + Demo data (fast iteration)"
    echo "  development - Remote Supabase + Real data (full testing)"
    echo "  production  - Production Supabase + Live data (⚠️  LIVE MONEY)"
    echo ""
    echo "Examples:"
    echo "  $0 local       # Switch BOTH frontend and backend to local"
    echo "  $0 development # Switch BOTH frontend and backend to development"
    echo "  $0 production  # Switch BOTH frontend and backend to production"
    echo ""
    echo "This script switches BOTH frontend/.env.local AND backend/.env consistently"
}

backup_current_configs() {
    echo "💾 Backing up current configurations..."
    
    # Backup backend config
    if [ -f "backend/.env" ]; then
        cp backend/.env backend/.env.backup
        echo "✅ Backed up backend/.env"
    fi
    
    # Backup frontend config
    if [ -f "frontend/.env.local" ]; then
        cp frontend/.env.local frontend/.env.local.backup
        echo "✅ Backed up frontend/.env.local"
    fi
}

switch_to_local() {
    echo "🔄 Switching to LOCAL environment..."
    backup_current_configs
    
    # Switch backend to local
    if [ -f "backend/.env.local" ]; then
        cp backend/.env.local backend/.env
        echo "✅ Backend: Switched to local configuration"
    else
        echo "❌ Error: backend/.env.local not found!"
        exit 1
    fi
    
    # Switch frontend to local (demo mode)
    if [ -f "frontend/.env.local.template" ]; then
        cp frontend/.env.local.template frontend/.env.local
    else
        # Create local frontend config
        cat > frontend/.env.local << 'EOF'
# 🔧 LOCAL DEVELOPMENT ENVIRONMENT
NODE_ENV=development
ENVIRONMENT=local
NEXT_PUBLIC_USE_DEMO_DATA=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_disabled_for_local
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_PAYMENTS=false
JWT_SECRET=local-jwt-secret-change-in-production
EOF
    fi
    echo "✅ Frontend: Switched to local configuration (demo mode)"
    
    echo ""
    echo "✅ Environment switched to LOCAL"
    echo "📊 Backend:  Local Supabase (localhost:54321)"
    echo "🌐 Frontend: Demo data + Local URLs (localhost:3000)"
    echo "💡 Use: npm run dev"
}

switch_to_development() {
    echo "🔄 Switching to DEVELOPMENT environment..."
    backup_current_configs
    
    # Switch backend to development
    if [ -f "backend/.env.development" ]; then
        cp backend/.env.development backend/.env
        echo "✅ Backend: Switched to development configuration"
    else
        echo "❌ Error: backend/.env.development not found!"
        exit 1
    fi
    
    # Switch frontend to development
    if [ -f "frontend/.env.development" ]; then
        cp frontend/.env.development frontend/.env.local
        echo "✅ Frontend: Switched to development configuration"
    else
        echo "❌ Error: frontend/.env.development not found!"
        exit 1
    fi
    
    echo ""
    echo "✅ Environment switched to DEVELOPMENT"
    echo "📊 Backend:  Remote Supabase (development instance)"
    echo "🌐 Frontend: Real data + Development URLs (dev.adhub.tech)"
    echo "💳 Payments: Stripe test mode"
    echo "🔐 Auth:     Real JWT authentication"
    echo "💡 Use: npm run dev (will behave like dev.adhub.tech)"
}

switch_to_production() {
    echo "🔄 Switching to PRODUCTION environment..."
    echo "⚠️  WARNING: This will use LIVE data and REAL payments!"
    
    # Production safety check
    read -p "⚠️  Are you sure you want to switch to PRODUCTION? (yes/no): " confirm
    if [[ $confirm != "yes" ]]; then
        echo "❌ Production switch cancelled"
        exit 1
    fi
    
    backup_current_configs
    
    # Switch backend to production
    if [ -f "backend/.env.production" ]; then
        cp backend/.env.production backend/.env
        echo "✅ Backend: Switched to production configuration"
    else
        echo "❌ Error: backend/.env.production not found!"
        exit 1
    fi
    
    # Switch frontend to production
    if [ -f "frontend/.env.production" ]; then
        cp frontend/.env.production frontend/.env.local
        echo "✅ Frontend: Switched to production configuration"
    else
        echo "❌ Error: frontend/.env.production not found!"
        exit 1
    fi
    
    # Production security checks
    echo "🔒 Running production security checks..."
    if grep -q "CHANGE_THIS\|localhost\|demo" backend/.env frontend/.env.local; then
        echo "❌ ERROR: Production config contains unsafe values!"
        echo "💡 Check backend/.env.production and frontend/.env.production"
        exit 1
    fi
    
    echo ""
    echo "✅ Environment switched to PRODUCTION"
    echo "📊 Backend:  Production Supabase"
    echo "🌐 Frontend: Live data + Production URLs (adhub.tech)"
    echo "💳 Payments: Stripe LIVE mode"
    echo "🔐 Auth:     Production JWT authentication"
    echo "🚨 WARNING: You are now in PRODUCTION mode!"
    echo "💡 Use: npm run build && npm run start"
}

restore_from_backup() {
    echo "🔄 Restoring from backup..."
    
    if [ -f "backend/.env.backup" ]; then
        cp backend/.env.backup backend/.env
        rm backend/.env.backup
        echo "✅ Restored backend/.env"
    fi
    
    if [ -f "frontend/.env.local.backup" ]; then
        cp frontend/.env.local.backup frontend/.env.local
        rm frontend/.env.local.backup
        echo "✅ Restored frontend/.env.local"
    fi
    
    echo "✅ Configurations restored"
}

# Check arguments
if [ $# -eq 0 ]; then
    show_usage
    exit 1
fi

case $1 in
    local)
        switch_to_local
        ;;
    development)
        switch_to_development
        ;;
    production)
        switch_to_production
        ;;
    restore)
        restore_from_backup
        ;;
    *)
        echo "❌ Error: Unknown environment '$1'"
        echo ""
        show_usage
        exit 1
        ;;
esac

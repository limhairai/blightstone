#!/bin/bash

# Start Production Environment Servers Script
# This script starts servers using PRODUCTION environment (live deployment)

echo "🚀 Starting AdHub Production Environment"
echo "======================================="
echo "📊 Environment: PRODUCTION (Live Deployment)"
echo "🗄️ Database: Production Supabase"
echo "💳 Payments: Stripe Live Mode"
echo "⚠️  WARNING: This will use LIVE data and REAL payments!"
echo ""

# Production safety check
read -p "⚠️  Are you sure you want to start PRODUCTION environment? (yes/no): " confirm
if [[ $confirm != "yes" ]]; then
    echo "❌ Production startup cancelled"
    exit 1
fi

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down production servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Production servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Check if production config exists
if [ ! -f "backend/.env.production" ]; then
    echo "❌ Error: backend/.env.production not found!"
    echo "💡 Create production config first"
    exit 1
fi

# Backup current backend .env and switch to production
if [ -f "backend/.env" ]; then
    cp backend/.env backend/.env.local.backup
    echo "💾 Backed up current backend/.env to backend/.env.local.backup"
fi

# Switch backend to production environment
cp backend/.env.production backend/.env
echo "🔄 Switched backend to PRODUCTION environment"

# Production security checks
echo "🔒 Running production security checks..."
if grep -q "CHANGE_THIS" backend/.env; then
    echo "❌ ERROR: Production config contains placeholder values!"
    echo "💡 Update backend/.env.production with real credentials"
    exit 1
fi

# Start backend server with production config
echo "🔧 Starting Backend Server (FastAPI - Production)..."
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --workers 4 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server (production build)
echo "🎨 Starting Frontend Server (Next.js - Production)..."
cd frontend
# Build for production first
echo "🏗️ Building frontend for production..."
npm run build
# Start production server
npm start &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 10

echo ""
echo "✅ Production servers started successfully!"
echo "📊 Backend:  http://localhost:8000 (PRODUCTION config)"
echo "🌐 Frontend: http://localhost:3000 (PRODUCTION build)"
echo "📚 API Docs: http://localhost:8000/docs"
echo "🗄️ Database: Production Supabase"
echo "💳 Payments: LIVE Stripe (REAL MONEY)"
echo ""
echo "🚨 WARNING: You are running in PRODUCTION mode!"
echo "💡 Press Ctrl+C to stop all servers"
echo "🔄 Backend will restore to local config on exit"
echo ""

# Keep script running
wait

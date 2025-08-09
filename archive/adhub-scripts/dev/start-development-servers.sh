#!/bin/bash

# Start Development Environment Servers Script
# This script starts servers using DEVELOPMENT environment (remote Supabase)

echo "🚀 Starting Blightstone Development Environment"
echo "========================================"
echo "📊 Environment: DEVELOPMENT (Remote Supabase)"
echo "🗄️ Database: Remote Supabase"
echo "💳 Payments: Stripe Test Mode"
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Development servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Check if development config exists
if [ ! -f "backend/.env.development" ]; then
    echo "❌ Error: backend/.env.development not found!"
    echo "💡 Run the local development script instead: ./scripts/dev/start-dev-servers.sh"
    exit 1
fi

# Backup current backend .env and switch to development
if [ -f "backend/.env" ]; then
    cp backend/.env backend/.env.local.backup
    echo "💾 Backed up current backend/.env to backend/.env.local.backup"
fi

# Switch backend to development environment
cp backend/.env.development backend/.env
echo "🔄 Switched backend to DEVELOPMENT environment"

# Start backend server with development config
echo "🔧 Starting Backend Server (FastAPI - Development)..."
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server (will use .env.development automatically in production)
echo "�� Starting Frontend Server (Next.js - Development)..."
cd frontend
# Set NODE_ENV to ensure it uses .env.development in some setups
NODE_ENV=development npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 5

echo ""
echo "✅ Development servers started successfully!"
echo "📊 Backend:  http://localhost:8000 (DEVELOPMENT config)"
echo "🌐 Frontend: http://localhost:3000 (DEVELOPMENT config)"
echo "📚 API Docs: http://localhost:8000/docs"
echo "🗄️ Database: Remote Supabase (xewhfrwuzkfbnpwtdxuf.supabase.co)"
echo ""
echo "💡 Press Ctrl+C to stop all servers"
echo "🔄 Backend will restore to local config on exit"
echo ""

# Keep script running
wait

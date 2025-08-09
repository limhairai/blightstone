#!/bin/bash

# Start Local Development Servers Script
# This script starts servers using LOCAL environment (local Supabase + demo data)

echo "🚀 Starting Blightstone CRM Development Environment"
echo "================================================="
echo "📊 Environment: DEVELOPMENT (Remote Supabase)"
echo "🗄️ Database: Remote Supabase (vddtsunsahhccmtamdcg.supabase.co)"
echo "💾 Data: Production Database"
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down local servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    
    # Ask if user wants to stop Supabase too
    echo ""
    read -p "🗄️  Stop local Supabase as well? (y/n): " stop_supabase
    if [[ $stop_supabase == "y" ]]; then
        echo "🛑 Stopping local Supabase..."
        supabase stop
        echo "✅ Supabase stopped"
    else
        echo "💡 Supabase left running - stop manually with: supabase stop"
    fi
    
    echo "✅ Local servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Check if environment files exist
if [ ! -f "frontend/.env.local" ]; then
    echo "❌ Error: frontend/.env.local not found!"
    echo "💡 Run the setup script first: ./setup-environment.sh"
    exit 1
fi

if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env not found!"
    echo "💡 Run the setup script first: ./setup-environment.sh"
    exit 1
fi

echo "✅ Environment files found"
echo "🔗 Using remote Supabase: vddtsunsahhccmtamdcg.supabase.co"
echo ""

# Start backend server with local config
echo "🔧 Starting Backend Server (FastAPI - Local)..."
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting Frontend Server (Next.js - Local)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 5

echo ""
echo "✅ Blightstone CRM development environment started successfully!"
echo "📊 Backend:  http://localhost:8000"
echo "🌐 Frontend: http://localhost:3000"
echo "📚 API Docs: http://localhost:8000/docs"
echo "🗄️ Database: Remote Supabase (vddtsunsahhccmtamdcg.supabase.co)"
echo "📊 Supabase Dashboard: https://supabase.com/dashboard/project/vddtsunsahhccmtamdcg"
echo ""
echo "💡 Press Ctrl+C to stop all servers"
echo ""

# Keep script running
wait 

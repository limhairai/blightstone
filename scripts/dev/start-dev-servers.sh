#!/bin/bash

# Start Local Development Servers Script
# This script starts servers using LOCAL environment (local Supabase + demo data)

echo "🚀 Starting AdHub Local Development Environment"
echo "=============================================="
echo "📊 Environment: LOCAL (Local Supabase + Demo Data)"
echo "🗄️ Database: Local Supabase (localhost:54321)"
echo "💾 Data: Demo/Mock Data (fast iteration)"
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

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "💡 Install it with: npm install -g supabase"
    echo "📚 Or visit: https://supabase.com/docs/guides/cli"
    echo ""
    echo "⚠️  Continuing without local Supabase (app will use demo data)"
    echo ""
else
    # Check if local Supabase is running
    echo "🔍 Checking local Supabase status..."
    if ! curl -s http://localhost:54321/health >/dev/null 2>&1; then
        echo "🚀 Starting local Supabase..."
        supabase start
        
        if [ $? -eq 0 ]; then
            echo "✅ Local Supabase started successfully"
            echo "📊 Supabase Studio: http://localhost:54323"
        else
            echo "❌ Failed to start Supabase"
            echo "💡 Continuing without local Supabase (app will use demo data)"
        fi
    else
        echo "✅ Local Supabase already running"
        echo "📊 Supabase Studio: http://localhost:54323"
    fi
    echo ""
fi

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
echo "✅ Local development environment started successfully!"
echo "📊 Backend:  http://localhost:8000 (LOCAL config)"
echo "🌐 Frontend: http://localhost:3000 (LOCAL config)"
echo "📚 API Docs: http://localhost:8000/docs"
if curl -s http://localhost:54321/health >/dev/null 2>&1; then
    echo "🗄️ Database: Local Supabase (localhost:54321)"
    echo "📊 Supabase Studio: http://localhost:54323"
else
    echo "🗄️ Database: Demo Data (Supabase not running)"
fi
echo ""
echo "💡 Press Ctrl+C to stop all servers"
echo ""

# Keep script running
wait 

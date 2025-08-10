#!/bin/bash

# Start Blightstone CRM Development Environment
# Frontend + API: http://localhost:3000

echo "🚀 Starting Blightstone CRM Development Environment"
echo "=================================================="
echo "📊 Environment: DEVELOPMENT (Local)"
echo "🗄️ Database: Local Supabase (127.0.0.1:54323)"
echo "🌐 Frontend + API: http://localhost:3000"
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    kill $FRONTEND_PID 2>/dev/null
    wait $FRONTEND_PID 2>/dev/null
    echo "🛑 Stopping local Supabase..."
    supabase stop 2>/dev/null
    echo "✅ Development servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Check if environment files exist
if [ ! -f "frontend/.env.local" ]; then
    echo "❌ Error: frontend/.env.local not found!"
    echo "💡 Create frontend/.env.local with your Supabase credentials"
    exit 1
fi

# Check if npm dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Start local Supabase
echo "🗄️ Starting Local Supabase..."
supabase start
if [ $? -ne 0 ]; then
    echo "❌ Failed to start local Supabase"
    echo "💡 Make sure you have Supabase CLI installed and supabase/config.toml exists"
    exit 1
fi

echo ""

# Start Next.js development server (includes API routes)
echo "🎨 Starting Next.js Development Server (Frontend + API)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a moment for server to start
sleep 5

echo ""
echo "✅ Blightstone CRM development environment started successfully!"
echo "=================================================="
echo "🌐 Frontend:      http://localhost:3000"
echo "🔧 API Routes:    http://localhost:3000/api/*"
echo "🗄️ Local DB:     http://127.0.0.1:54323"
echo "📊 Supabase Studio: http://127.0.0.1:54324"
echo ""
echo "💡 Press Ctrl+C to stop all servers"
echo "🔄 Servers will auto-reload on file changes"
echo ""

# Keep script running
wait
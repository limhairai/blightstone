#!/bin/bash

# Start Blightstone CRM Development Environment
# Frontend: http://localhost:3000
# Backend: http://localhost:8000

echo "🚀 Starting Blightstone CRM Development Environment"
echo "=================================================="
echo "📊 Environment: DEVELOPMENT"
echo "🗄️ Database: Remote Supabase (vddtsunsahhccmtamdcg.supabase.co)"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000"
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

# Check if npm dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Check if Python dependencies are installed (optional)
if [ -f "backend/requirements/dev.txt" ]; then
    echo "🐍 Checking Python dependencies..."
    if ! python -c "import uvicorn" 2>/dev/null; then
        echo "📦 Installing backend dependencies..."
        cd backend
        pip install -r requirements/dev.txt
        cd ..
    fi
fi

# Start backend server
echo "🔧 Starting Backend Server (FastAPI)..."
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting Frontend Server (Next.js)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 5

echo ""
echo "✅ Blightstone CRM development environment started successfully!"
echo "=================================================="
echo "🌐 Frontend:      http://localhost:3000"
echo "🔧 Backend:       http://localhost:8000"
echo "📚 API Docs:      http://localhost:8000/docs"
echo "🗄️ Database:      Remote Supabase"
echo "📊 Supabase:      https://supabase.com/dashboard/project/vddtsunsahhccmtamdcg"
echo ""
echo "💡 Press Ctrl+C to stop all servers"
echo "🔄 Both servers will auto-reload on file changes"
echo ""

# Keep script running
wait
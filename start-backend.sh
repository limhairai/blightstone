#!/bin/bash

# Start Blightstone CRM Backend Only
# Backend: http://localhost:8000

echo "🔧 Starting Blightstone CRM Backend..."
echo "====================================="

# Check if environment file exists
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env not found!"
    echo "💡 Run the setup script first: ./setup-environment.sh"
    exit 1
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
echo "🚀 Starting FastAPI development server..."
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
#!/bin/bash

# Start Blightstone CRM Frontend Only
# Frontend: http://localhost:3000

echo "🎨 Starting Blightstone CRM Frontend..."
echo "======================================"

# Check if environment file exists
if [ ! -f "frontend/.env.local" ]; then
    echo "❌ Error: frontend/.env.local not found!"
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

# Start frontend server
echo "🚀 Starting Next.js development server..."
cd frontend
npm run dev
#!/bin/bash
# Blightstone CRM - Environment Setup Script
# This script sets up the environment files with the new Supabase configuration

echo "🔧 Setting up Blightstone CRM environment..."

# Create frontend .env.local
echo "📝 Creating frontend/.env.local..."
cat > frontend/.env.local << 'EOF'
# Blightstone CRM - Frontend Environment Configuration
# This file contains environment variables for local development

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://vddtsunsahhccmtamdcg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZHRzdW5zYWhoY2NtdGFtZGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTA5NTAsImV4cCI6MjA2OTc4Njk1MH0.c06yTFuQSD33RhbpEmtL9EpUAlUzA7QWN0BFJtFHh3o

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Environment
NODE_ENV=development
NEXT_PUBLIC_ENVIRONMENT=development

# Demo Data (set to false for production)
NEXT_PUBLIC_USE_DEMO_DATA=false

# Sentry (optional - leave empty for development)
NEXT_PUBLIC_SENTRY_DSN=

# Stripe (optional - for payment features)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EOF

# Create backend .env
echo "📝 Creating backend/.env..."
cat > backend/.env << 'EOF'
# Blightstone CRM - Backend Environment Configuration
# This file contains environment variables for local development

# Environment
ENVIRONMENT=development
DEBUG=true

# Database Configuration
DATABASE_URL=sqlite:///./blightstone.db

# API Configuration
API_URL=http://localhost:8000
WS_API_URL=ws://localhost:8000

# CORS Origins
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Supabase Configuration
SUPABASE_URL=https://vddtsunsahhccmtamdcg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZHRzdW5zYWhoY2NtdGFtZGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTA5NTAsImV4cCI6MjA2OTc4Njk1MH0.c06yTFuQSD33RhbpEmtL9EpUAlUzA7QWN0BFJtFHh3o
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZHRzdW5zYWhoY2NtdGFtZGNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIxMDk1MCwiZXhwIjoyMDY5Nzg2OTUwfQ.vsGed684_OfCgI4pDxslJ0QooVVA_L0on_-rhzWuoDc
SUPABASE_JWT_SECRET=

# Stripe Configuration (optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Dolphin API Configuration (optional)
DOLPHIN_API_URL=
DOLPHIN_API_KEY=

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600

# Logging
LOG_LEVEL=INFO

# Sentry (optional)
SENTRY_DSN=
EOF

echo "✅ Environment files created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Run this script: chmod +x setup-environment.sh && ./setup-environment.sh"
echo "2. Install dependencies: cd frontend && npm install"
echo "3. Set up the database: cd ../supabase && supabase db reset"
echo "4. Start the development servers"
echo ""
echo "🔗 Supabase Dashboard: https://supabase.com/dashboard/project/vddtsunsahhccmtamdcg"
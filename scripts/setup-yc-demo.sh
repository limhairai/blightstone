#!/bin/bash

# YC Demo Account Setup for AdHub
echo "🚀 Setting up YC Demo Account for AdHub Staging"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

# Check for service key
if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_SERVICE_KEY not found in environment${NC}"
    echo ""
    echo "📋 To get your service key:"
    echo "1. Go to: https://supabase.com/dashboard/project/xewhfrwuzkfbnpwtdxuf/settings/api"
    echo "2. Copy the 'service_role' key"
    echo "3. Run: export SUPABASE_SERVICE_KEY=your_service_key_here"
    echo "4. Run this script again"
    echo ""
    exit 1
fi

echo -e "${BLUE}📦 Installing dependencies...${NC}"
cd frontend
npm install @supabase/supabase-js > /dev/null 2>&1

echo -e "${BLUE}🎯 Creating YC demo account...${NC}"
echo ""

# Run the demo account creation script
if node ../scripts/create-yc-demo-user.js; then
    echo ""
    echo -e "${GREEN}✨ YC Demo Account Ready!${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}📋 Share these credentials with YC investors:${NC}"
    echo ""
    echo -e "${YELLOW}🌐 URL:${NC} https://staging.adhub.tech"
    echo -e "${YELLOW}📧 Email:${NC} yc-demo@adhub.com"
    echo -e "${YELLOW}🔑 Password:${NC} YC2025Demo!"
    echo ""
    echo -e "${GREEN}💡 This account showcases a high-value customer ($8.5k/month spend)${NC}"
    echo -e "${GREEN}   with multiple businesses and realistic transaction history.${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
else
    echo -e "${RED}❌ Failed to create demo account${NC}"
    echo "Check the error messages above and try again."
    exit 1
fi 
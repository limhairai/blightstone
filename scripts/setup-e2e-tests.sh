#!/bin/bash

# Blightstone E2E Testing Setup Script
# This script sets up the complete E2E testing environment

set -e

echo "🚀 Setting up Blightstone E2E Testing Environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
npx playwright install --with-deps

# Create necessary directories
echo "📁 Creating test directories..."
mkdir -p playwright/.auth
mkdir -p test-results/screenshots

# Create .env.test file if it doesn't exist
if [ ! -f ".env.test" ]; then
    echo "⚙️ Creating .env.test file..."
    cat > .env.test << EOF
# Test Environment Configuration
NODE_ENV=test

# Base URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase Configuration (replace with your test database)
NEXT_PUBLIC_SUPABASE_URL=your-test-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-supabase-anon-key
SUPABASE_SERVICE_KEY=your-test-supabase-service-key

# Stripe Configuration (use test keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
STRIPE_SECRET_KEY=sk_test_your_test_key

# Playwright Configuration
PLAYWRIGHT_BASE_URL=http://localhost:3000
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000

# Test Database Settings
DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/adhub_test

# Disable external services in tests
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_SENTRY=false
NEXT_PUBLIC_ENABLE_HOTJAR=false

# Test-specific settings
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_LOG_LEVEL=debug
EOF
    echo "✅ Created .env.test file - please update with your actual credentials"
else
    echo "✅ .env.test file already exists"
fi

# Add .env.test to .gitignore if not already there
if ! grep -q ".env.test" .gitignore; then
    echo ".env.test" >> .gitignore
    echo "✅ Added .env.test to .gitignore"
fi

# Create a simple test runner script
cat > run-e2e-tests.sh << 'EOF'
#!/bin/bash

# Simple E2E test runner
# Usage: ./run-e2e-tests.sh [environment]

ENVIRONMENT=${1:-local}

echo "🧪 Running E2E tests for environment: $ENVIRONMENT"

case $ENVIRONMENT in
    local)
        echo "🏠 Running local tests..."
        npm run test:e2e
        ;;
    staging)
        echo "🏗️ Running staging tests..."
        npm run test:e2e:staging
        ;;
    production)
        echo "🚀 Running production smoke tests..."
        npm run test:e2e:production
        ;;
    ui)
        echo "🎨 Running tests with UI..."
        npm run test:e2e:ui
        ;;
    debug)
        echo "🐛 Running tests in debug mode..."
        npm run test:e2e:debug
        ;;
    *)
        echo "❌ Unknown environment: $ENVIRONMENT"
        echo "Available environments: local, staging, production, ui, debug"
        exit 1
        ;;
esac
EOF

chmod +x run-e2e-tests.sh

# Run a quick test to verify setup
echo "🔍 Verifying Playwright installation..."
if npx playwright --version > /dev/null 2>&1; then
    echo "✅ Playwright is installed and working"
else
    echo "❌ Playwright installation failed"
    exit 1
fi

echo ""
echo "🎉 E2E Testing Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Update .env.test with your actual Supabase and Stripe credentials"
echo "2. Start your development servers:"
echo "   - Frontend: cd frontend && npm run dev"
echo "   - Backend: cd backend && python -m uvicorn app.main:app --reload"
echo "3. Run your first test:"
echo "   - npm run test:e2e (run all tests)"
echo "   - npm run test:e2e:ui (run with UI)"
echo "   - ./run-e2e-tests.sh ui (using the helper script)"
echo ""
echo "📖 Documentation:"
echo "   - Read tests/README.md for detailed instructions"
echo "   - Check playwright.config.ts for configuration options"
echo ""
echo "🚀 Your Blightstone application is now ready for production with comprehensive E2E testing!" 
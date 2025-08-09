#!/bin/bash

# Blightstone Comprehensive Test Runner
# This script runs the comprehensive authentication and wallet tests

set -e

echo "🚀 Starting Blightstone Comprehensive Test Suite"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check environment variables
echo "🔍 Checking environment variables..."

required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '   - %s\n' "${missing_vars[@]}"
    echo ""
    echo "Please set these variables in your .env.local file"
    exit 1
fi

# Check optional variables
optional_vars=(
    "RESEND_API_KEY"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
)

missing_optional=()
for var in "${optional_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_optional+=("$var")
    fi
done

if [ ${#missing_optional[@]} -ne 0 ]; then
    echo "⚠️  Missing optional environment variables:"
    printf '   - %s\n' "${missing_optional[@]}"
    echo "   Some tests may be skipped or use mock data"
    echo ""
fi

# Check if development server is running
echo "🔍 Checking if development server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Development server is not running on http://localhost:3000"
    echo "Please start the development server with: npm run dev"
    exit 1
fi

# Check if backend is running (if applicable)
echo "🔍 Checking backend server..."
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "⚠️  Backend server is not running on http://localhost:8000"
    echo "   Some tests may fail if they require backend endpoints"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Install Playwright browsers if needed
echo "🎭 Checking Playwright browsers..."
if ! npx playwright --version > /dev/null 2>&1; then
    echo "📦 Installing Playwright browsers..."
    npx playwright install
fi

# Run the tests
echo "🧪 Running comprehensive authentication and wallet tests..."
echo ""

# Set test environment
export NODE_ENV=test
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Run tests with different configurations
echo "1️⃣  Running essential user flows (baseline)..."
npm run test:e2e:essential

echo ""
echo "2️⃣  Running comprehensive authentication flows..."
npm run test:e2e:comprehensive

echo ""
echo "3️⃣  Running tests across all browsers..."
npx playwright test --config=config/playwright.config.ts tests/auth-flows-comprehensive.spec.ts

echo ""
echo "✅ All tests completed!"
echo ""
echo "📊 Test Results Summary:"
echo "========================"
echo "Check the test-results/ directory for detailed reports"
echo "Run 'npx playwright show-report' to view the HTML report"
echo ""

# Generate test report
if command -v npx &> /dev/null; then
    echo "📈 Generating test report..."
    npx playwright show-report --host 0.0.0.0 --port 9323 &
    REPORT_PID=$!
    
    echo "📊 Test report available at: http://localhost:9323"
    echo "Press Ctrl+C to stop the report server"
    
    # Wait for user to stop the server
    wait $REPORT_PID
fi

echo "🎉 Test suite completed successfully!" 
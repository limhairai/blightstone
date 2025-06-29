#!/bin/bash
# AdHub Comprehensive Test Runner

set -e

echo "🧪 Starting AdHub Test Suite..."
cd frontend

echo "📝 Running TypeScript & Lint checks..."
npm run type-check
npm run lint

echo "🔬 Running Unit Tests..."
npm run test -- --watchAll=false

echo "🏗️  Testing Production Build..."
npm run build

echo "🎭 Running E2E Tests..."
npx playwright test

echo "✅ All tests passed! Ready for deployment 🚀"

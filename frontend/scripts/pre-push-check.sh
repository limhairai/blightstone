#!/bin/bash
# Pre-push hook to run TypeScript checks

set -e

echo "🔍 Running TypeScript checks before push..."

cd frontend

# Run TypeScript check
npm run type-check

if [ $? -eq 0 ]; then
    echo "✅ TypeScript check passed!"
else
    echo "❌ TypeScript check failed. Please fix errors before pushing."
    exit 1
fi

echo "🎉 All checks passed! Safe to push." 
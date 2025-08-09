#!/bin/bash

echo "🎨 Converting auth components to light backgrounds..."

# Fix all bg-black in auth components
find frontend/src/components/auth -name "*.tsx" -type f -exec sed -i '' 's/bg-black/bg-background/g' {} \;

# Fix gradient backgrounds
find frontend/src/components/auth -name "*.tsx" -type f -exec sed -i '' 's/bg-gradient-to-br from-gray-900\/50 via-black to-gray-900\/30/bg-background/g' {} \;
find frontend/src/components/auth -name "*.tsx" -type f -exec sed -i '' 's/bg-gradient-to-bl from-gray-800\/20 via-transparent to-transparent/bg-muted\/10/g' {} \;

# Fix text colors for light mode
find frontend/src/components/auth -name "*.tsx" -type f -exec sed -i '' 's/text-gray-400/text-muted-foreground/g' {} \;
find frontend/src/components/auth -name "*.tsx" -type f -exec sed -i '' 's/text-white/text-foreground/g' {} \;
find frontend/src/components/auth -name "*.tsx" -type f -exec sed -i '' 's/hover:text-white/hover:text-foreground/g' {} \;

echo "✅ Auth background conversion complete!"
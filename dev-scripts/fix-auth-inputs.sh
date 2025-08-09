#!/bin/bash

echo "🎨 Fixing all auth input fields and buttons for light mode..."

# Fix input field backgrounds and borders
find frontend/src/components/auth -name "*.tsx" -type f -exec sed -i '' 's/bg-gray-900/bg-input/g' {} \;
find frontend/src/components/auth -name "*.tsx" -type f -exec sed -i '' 's/border-gray-700/border-border/g' {} \;
find frontend/src/components/auth -name "*.tsx" -type f -exec sed -i '' 's/placeholder-gray-500/placeholder-muted-foreground/g' {} \;
find frontend/src/components/auth -name "*.tsx" -type f -exec sed -i '' 's/focus:border-gray-500/focus:border-ring/g' {} \;

# Fix button backgrounds
find frontend/src/components/auth -name "*.tsx" -type f -exec sed -i '' 's/bg-gray-800/bg-secondary/g' {} \;
find frontend/src/components/auth -name "*.tsx" -type f -exec sed -i '' 's/hover:bg-gray-700/hover:bg-secondary\/80/g' {} \;
find frontend/src/components/auth -name "*.tsx" -type f -exec sed -i '' 's/border-gray-600/border-border/g' {} \;

# Fix any remaining gray text colors
find frontend/src/components/auth -name "*.tsx" -type f -exec sed -i '' 's/text-gray-500/text-muted-foreground/g' {} \;

echo "✅ Auth input and button fixes complete!"
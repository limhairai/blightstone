#!/bin/bash

echo "🎨 Converting all colors to black and white..."

# Color replacements for text colors
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/text-blue-[0-9][0-9][0-9]/text-foreground/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/text-green-[0-9][0-9][0-9]/text-foreground/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/text-purple-[0-9][0-9][0-9]/text-foreground/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/text-red-[0-9][0-9][0-9]/text-muted-foreground/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/text-yellow-[0-9][0-9][0-9]/text-muted-foreground/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/text-orange-[0-9][0-9][0-9]/text-muted-foreground/g' {} \;

# Background color replacements
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/bg-blue-[0-9][0-9][0-9]/bg-secondary/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/bg-green-[0-9][0-9][0-9]/bg-secondary/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/bg-purple-[0-9][0-9][0-9]/bg-secondary/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/bg-red-[0-9][0-9][0-9]/bg-muted/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/bg-yellow-[0-9][0-9][0-9]/bg-muted/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/bg-orange-[0-9][0-9][0-9]/bg-muted/g' {} \;

# Border color replacements
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/border-blue-[0-9][0-9][0-9]/border-border/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/border-green-[0-9][0-9][0-9]/border-border/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/border-purple-[0-9][0-9][0-9]/border-border/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/border-red-[0-9][0-9][0-9]/border-border/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/border-yellow-[0-9][0-9][0-9]/border-border/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/border-orange-[0-9][0-9][0-9]/border-border/g' {} \;

# Color variations with opacity
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/bg-blue-[0-9][0-9][0-9]\/[0-9][0-9]/bg-secondary/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/bg-green-[0-9][0-9][0-9]\/[0-9][0-9]/bg-secondary/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/bg-purple-[0-9][0-9][0-9]\/[0-9][0-9]/bg-secondary/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/bg-red-[0-9][0-9][0-9]\/[0-9][0-9]/bg-muted/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/bg-yellow-[0-9][0-9][0-9]\/[0-9][0-9]/bg-muted/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/bg-orange-[0-9][0-9][0-9]\/[0-9][0-9]/bg-muted/g' {} \;

# Specific gradient fixes
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/from-blue-[0-9][0-9][0-9]/from-primary/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/to-purple-[0-9][0-9][0-9]/to-primary/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/hover:from-blue-[0-9][0-9][0-9]/hover:from-primary\/90/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/hover:to-purple-[0-9][0-9][0-9]/hover:to-primary\/90/g' {} \;

echo "✅ Color conversion to black and white complete!"
#!/bin/bash

echo "🎨 Converting all gradients to black and white..."

# Replace all colorful gradient buttons with black and white
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/bg-gradient-to-r from-\[#b4a0ff\] to-\[#ffb4a0\]/bg-primary/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/bg-gradient-to-r from-\[#c4b5fd\] to-\[#ffc4b5\]/bg-primary/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/bg-gradient-to-r from-\[#b19cd9\] to-\[#f8c4b4\]/bg-primary/g' {} \;

# Replace hover states
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/hover:opacity-90 text-black/hover:bg-primary\/90 text-primary-foreground/g' {} \;

# Replace text gradients in bg-clip-text
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/bg-gradient-to-r from-\[#c4b5fd\] to-\[#ffc4b5\] bg-clip-text text-transparent/text-foreground/g' {} \;

# Replace background gradients with subtle variants
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/bg-gradient-to-r from-\[#b4a0ff\]\/10 to-\[#ffb4a0\]\/10/bg-muted/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/bg-gradient-to-r from-\[#b4a0ff\]\/20 to-\[#ffb4a0\]\/20/bg-muted/g' {} \;

# Replace avatar fallback gradients
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/bg-gradient-to-r from-\[#b4a0ff\] to-\[#ffb4a0\] text-white/bg-primary text-primary-foreground/g' {} \;

# Replace specific color combinations
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/from-blue-600 to-purple-600/from-primary to-primary/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/from-blue-500 to-indigo-500/from-primary to-primary/g' {} \;

echo "✅ Gradient conversion complete!"
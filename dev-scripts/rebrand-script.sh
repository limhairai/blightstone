#!/bin/bash

echo "🔄 Rebranding from AdHub to Blightstone..."

# Update all AdHubLogo imports to BlightstoneLogo
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/AdHubLogo/BlightstoneLogo/g' {} \;
find frontend/src -name "*.ts" -type f -exec sed -i '' 's/AdHubLogo/BlightstoneLogo/g' {} \;

# Update import paths
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/AdHubLogo/BlightstoneLogo/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/core\/AdHubLogo/core\/BlightstoneLogo/g' {} \;

# Update UI text references
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/AdHub/Blightstone/g' {} \;

# Update page titles and meta
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/AdHub - /Blightstone - /g' {} \;

# Update localStorage keys
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/adhub_/blightstone_/g' {} \;
find frontend/src -name "*.ts" -type f -exec sed -i '' 's/adhub_/blightstone_/g' {} \;

# Update email references
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/adhub\.com/blightstone.com/g' {} \;
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/adhub\.tech/blightstone.com/g' {} \;

# Update admin email
find frontend/src -name "*.tsx" -type f -exec sed -i '' 's/admin@adhub\.com/admin@blightstone.com/g' {} \;

echo "✅ Frontend rebranding complete!"

# Update script references
echo "🔄 Updating scripts..."
find scripts -name "*.sh" -type f -exec sed -i '' 's/AdHub/Blightstone/g' {} \;
find scripts -name "*.js" -type f -exec sed -i '' 's/AdHub/Blightstone/g' {} \;

echo "✅ All rebranding complete!"
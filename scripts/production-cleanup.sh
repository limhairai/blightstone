#!/bin/bash

# 🧹 AdHub Production Cleanup Script
# Removes development artifacts, backup files, and debug code for production deployment

set -e

echo "🚀 AdHub Production Cleanup"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track cleanup statistics
REMOVED_FILES=0
CLEANED_CONSOLE_LOGS=0
REMOVED_TODOS=0

# Function to log actions
log_action() {
    echo -e "${GREEN}✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

log_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

# 1. Remove backup files
echo "🗑️  Removing backup files..."
echo "----------------------------"

# Remove .backup, .bak, .old files (excluding node_modules and .next)
find . -name "*.backup" -not -path "./frontend/node_modules/*" -not -path "./frontend/.next/*" -type f -delete 2>/dev/null && REMOVED_FILES=$((REMOVED_FILES + 1)) || true
find . -name "*.bak" -not -path "./frontend/node_modules/*" -not -path "./frontend/.next/*" -type f -delete 2>/dev/null && REMOVED_FILES=$((REMOVED_FILES + 1)) || true
find . -name "*.old" -not -path "./frontend/node_modules/*" -not -path "./frontend/.next/*" -type f -delete 2>/dev/null && REMOVED_FILES=$((REMOVED_FILES + 1)) || true

# Remove specific backup files
backup_files=(
    "frontend/src/contexts/ProductionDataContext.tsx.backup"
    "frontend/src/contexts/AppDataContext.tsx.bak" 
    "frontend/src/contexts/UnifiedDataContext.tsx.backup"
    "frontend/src/contexts/DemoStateContext.tsx.backup"
    "frontend/src/app/layout.tsx.backup"
    "frontend/src/lib/config/financial.ts.backup"
    "frontend/src/lib/env-config.ts.bak"
    "frontend/src/lib/env-config.ts.backup"
    "telegram-bot/.env.backup"
    "tests/adhub-full-flow.spec.ts.bak"
    "backend/app/main.py.backup"
    "backend/.env.local.backup"
    "frontend/next.config.mjs.bak"
)

for file in "${backup_files[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        log_action "Removed backup file: $file"
        REMOVED_FILES=$((REMOVED_FILES + 1))
    fi
done

# 2. Clean up console.log statements (but keep essential ones)
echo ""
echo "🔇 Cleaning debug console.log statements..."
echo "-------------------------------------------"

# List of files to clean console.log from (production code only)
production_files=(
    "frontend/src/contexts/AuthContext.tsx"
    "frontend/src/app/admin/analytics/page.tsx"
    "frontend/src/components/admin/ManageAssetDialog.tsx"
    "frontend/src/app/admin/assets/page.tsx"
    "frontend/src/app/admin/applications/history/page.tsx"
    "frontend/src/components/admin/application-asset-binding-dialog.tsx"
    "frontend/src/components/admin/applications-review-table.tsx"
    "frontend/src/app/api/debug/fix-membership/route.ts"
    "frontend/src/lib/wallet-service.ts"
)

for file in "${production_files[@]}"; do
    if [ -f "$file" ]; then
        # Count console.log statements
        count=$(grep -c "console\.log" "$file" 2>/dev/null || echo "0")
        if [ "$count" -gt 0 ]; then
            # Comment out console.log statements instead of removing (safer)
            sed -i.tmp 's/^[[:space:]]*console\.log/\/\/ console.log/g' "$file"
            rm "$file.tmp" 2>/dev/null || true
            log_action "Commented out $count console.log statements in $file"
            CLEANED_CONSOLE_LOGS=$((CLEANED_CONSOLE_LOGS + count))
        fi
    fi
done

# 3. Remove debug API routes
echo ""
echo "🔧 Removing debug API routes..."
echo "-------------------------------"

debug_routes=(
    "frontend/src/app/api/debug"
)

for route in "${debug_routes[@]}"; do
    if [ -d "$route" ]; then
        rm -rf "$route"
        log_action "Removed debug route directory: $route"
        REMOVED_FILES=$((REMOVED_FILES + 1))
    fi
done

# 4. Clean up development environment files
echo ""
echo "🌍 Cleaning development environment files..."
echo "--------------------------------------------"

dev_files=(
    ".env.local"
    "frontend/.env.local"
    "backend/.env.development"
    "backend/.env.local"
)

for file in "${dev_files[@]}"; do
    if [ -f "$file" ]; then
        log_warning "Development env file found: $file (review before production)"
    fi
done

# 5. Remove unused demo components (already done, but verify)
echo ""
echo "🎭 Verifying demo components removal..."
echo "--------------------------------------"

demo_patterns=(
    "demo"
    "mock"
    "test-data"
)

# Check for remaining demo references in production code
for pattern in "${demo_patterns[@]}"; do
    matches=$(find frontend/src -name "*.tsx" -o -name "*.ts" | xargs grep -l "$pattern" 2>/dev/null | grep -v ".backup" | grep -v "node_modules" || echo "")
    if [ -n "$matches" ]; then
        log_warning "Found potential demo references in: $matches"
    fi
done

# 6. Validate production configuration
echo ""
echo "⚙️  Validating production configuration..."
echo "-----------------------------------------"

# Check for required environment variables
required_env_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    "NEXT_PUBLIC_API_URL"
    "NEXT_PUBLIC_APP_URL"
)

missing_vars=()
for var in "${required_env_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    log_error "Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
else
    log_action "All required environment variables are set"
fi

# 7. Security checks
echo ""
echo "🔐 Running security checks..."
echo "-----------------------------"

# Check for hardcoded secrets
secret_patterns=(
    "sk_test_"
    "sk_live_"
    "password.*=.*[\"'][^\"']*[\"']"
    "secret.*=.*[\"'][^\"']*[\"']"
    "token.*=.*[\"'][^\"']*[\"']"
)

security_issues=0
for pattern in "${secret_patterns[@]}"; do
    matches=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" | grep -v node_modules | xargs grep -l "$pattern" 2>/dev/null || echo "")
    if [ -n "$matches" ]; then
        log_error "Potential hardcoded secrets found in: $matches"
        security_issues=$((security_issues + 1))
    fi
done

if [ $security_issues -eq 0 ]; then
    log_action "No hardcoded secrets detected"
fi

# 8. Performance checks
echo ""
echo "⚡ Running performance checks..."
echo "-------------------------------"

# Check bundle size (if .next exists)
if [ -d "frontend/.next" ]; then
    bundle_size=$(du -sh frontend/.next 2>/dev/null | cut -f1 || echo "unknown")
    log_info "Next.js bundle size: $bundle_size"
    
    # Check for large chunks
    large_chunks=$(find frontend/.next -name "*.js" -size +500k 2>/dev/null || echo "")
    if [ -n "$large_chunks" ]; then
        log_warning "Large JavaScript chunks found (>500KB):"
        echo "$large_chunks"
    else
        log_action "No oversized JavaScript chunks detected"
    fi
fi

# 9. Final verification
echo ""
echo "✅ Final verification..."
echo "-----------------------"

# Check TypeScript compilation
if command -v npm &> /dev/null; then
    cd frontend
    if npm run build:check &> /dev/null; then
        log_action "TypeScript compilation successful"
    else
        log_error "TypeScript compilation failed - check for type errors"
    fi
    cd ..
fi

# 10. Generate cleanup report
echo ""
echo "📊 Cleanup Summary"
echo "=================="
echo "Files removed: $REMOVED_FILES"
echo "Console.log statements cleaned: $CLEANED_CONSOLE_LOGS"
echo "Security issues found: $security_issues"
echo ""

if [ $security_issues -eq 0 ] && [ ${#missing_vars[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 Production cleanup completed successfully!${NC}"
    echo ""
    echo "✅ Ready for production deployment"
    echo ""
    echo "Next steps:"
    echo "1. Set production environment variables"
    echo "2. Configure production Stripe keys"
    echo "3. Set up monitoring and alerting"
    echo "4. Run final security audit"
    echo "5. Deploy to production"
else
    echo -e "${RED}⚠️  Production cleanup completed with issues${NC}"
    echo ""
    echo "❌ Issues need to be resolved before production deployment"
    echo ""
    echo "Required actions:"
    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo "- Set missing environment variables"
    fi
    if [ $security_issues -gt 0 ]; then
        echo "- Fix security issues"
    fi
fi

echo ""
echo "📋 For complete production readiness, review:"
echo "- docs/PRODUCTION_READINESS_AUDIT.md"
echo "- Set up error monitoring (Sentry)"
echo "- Configure production database backups"
echo "- Set up SSL certificates"
echo "- Configure CDN and caching"
echo ""

exit 0 
# 🔧 Environment Configuration Guide

## Overview
This guide ensures your AdHub app is properly configured for each environment and prevents development code from reaching production.

## 🚨 CRITICAL: Production Safety

### Environment Files Status
- ✅ `.env.production` - PRODUCTION READY
- ⚠️ `.env.staging` - STAGING READY  
- ❌ `.env.local` - DEVELOPMENT ONLY (DANGEROUS FOR PRODUCTION)

### Current Issues in `.env.local`
```bash
NEXT_PUBLIC_USE_MOCK_DATA=true    # ❌ BLOCKS PRODUCTION
NEXT_PUBLIC_DEMO_MODE=true        # ❌ BLOCKS PRODUCTION  
NEXT_PUBLIC_USE_DEMO_DATA=true    # ❌ BLOCKS PRODUCTION
BACKEND_URL=http://localhost:8000 # ❌ BLOCKS PRODUCTION
```

## 📋 Environment Configuration Matrix

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| `NODE_ENV` | development | production | production |
| `NEXT_PUBLIC_ENVIRONMENT` | development | staging | production |
| `NEXT_PUBLIC_USE_MOCK_DATA` | true | false | false |
| `NEXT_PUBLIC_DEMO_MODE` | true | false | false |
| `NEXT_PUBLIC_USE_DEMO_DATA` | true | false | false |
| `BACKEND_URL` | localhost:8000 | api-staging.adhub.tech | api.adhub.tech |
| `NEXT_PUBLIC_API_URL` | localhost:8000 | api-staging.adhub.tech | api.adhub.tech |

## 🔒 Production Environment Validation

### Automatic Validation
The app now includes automatic production validation:

```typescript
// src/lib/production-guard.ts
import { requireProductionEnvironment } from '@/lib/production-guard';

// This will throw an error if production environment is unsafe
requireProductionEnvironment();
```

### Build-Time Protection
```json
{
  "scripts": {
    "build": "npm run audit:production && next build",
    "audit:production": "node scripts/production-readiness-audit.js"
  }
}
```

## 🎯 Environment Setup Instructions

### 1. Development Environment (`.env.local`)
```bash
# Development - Mock data allowed
NODE_ENV=development
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_USE_DEMO_DATA=true

# Development URLs
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000

# Development Stripe (test keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Bot username
NEXT_PUBLIC_BOT_USERNAME=adhubtechbot
```

### 2. Staging Environment (`.env.staging`)
```bash
# Staging - No mock data
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_USE_DEMO_DATA=false

# Staging URLs
BACKEND_URL=https://api-staging.adhub.tech
NEXT_PUBLIC_API_URL=https://api-staging.adhub.tech

# Production Stripe keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Bot username
NEXT_PUBLIC_BOT_USERNAME=adhubtechbot
```

### 3. Production Environment (`.env.production`)
```bash
# Production - Strict configuration
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_USE_DEMO_DATA=false

# Production URLs
BACKEND_URL=https://api.adhub.tech
NEXT_PUBLIC_API_URL=https://api.adhub.tech

# Production Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xewhfrwuzkfbnpwtdxuf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Production Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Bot username
NEXT_PUBLIC_BOT_USERNAME=adhubtechbot
```

## 🔍 Validation Commands

### Check Current Environment
```bash
# Run production audit
npm run audit:production

# Check environment variables
node -e "console.log(process.env.NODE_ENV, process.env.NEXT_PUBLIC_USE_MOCK_DATA)"
```

### Validate Before Deployment
```bash
# This MUST pass before production deployment
npm run build

# If build fails, check the audit report
cat PRODUCTION_READINESS_REPORT.md
```

## 🚨 Production Deployment Checklist

### Before Deployment
- [ ] Environment variables set correctly
- [ ] `npm run audit:production` passes (0 high-priority issues)
- [ ] `npm run build` succeeds
- [ ] No mock data references in production build
- [ ] All URLs point to production endpoints
- [ ] Supabase configuration is production
- [ ] Stripe keys are production keys (pk_live_)

### Deployment Verification
- [ ] App loads without errors
- [ ] Authentication works with real Supabase
- [ ] Database operations use production database
- [ ] Payment integration works with production Stripe
- [ ] No demo/mock data visible in UI
- [ ] All API calls go to production endpoints

## 🔧 Environment Switching

### Local Development
```bash
# Use development environment
cp .env.local .env
npm run dev
```

### Staging Testing
```bash
# Use staging environment
cp .env.staging .env
npm run build
npm run start
```

### Production Deployment
```bash
# Use production environment
cp .env.production .env
npm run build  # This will run production audit first
npm run start
```

## 🚨 Common Mistakes to Avoid

### ❌ DON'T DO THIS
```bash
# Never use development flags in production
NEXT_PUBLIC_USE_MOCK_DATA=true     # ❌ DANGEROUS
NEXT_PUBLIC_DEMO_MODE=true         # ❌ DANGEROUS
BACKEND_URL=http://localhost:8000  # ❌ DANGEROUS
```

### ✅ DO THIS
```bash
# Always use production-safe configuration
NEXT_PUBLIC_USE_MOCK_DATA=false    # ✅ SAFE
NEXT_PUBLIC_DEMO_MODE=false        # ✅ SAFE
BACKEND_URL=https://api.adhub.tech # ✅ SAFE
```

## 🔍 Troubleshooting

### Build Fails with "Production audit failed"
1. Run `npm run audit:production` to see issues
2. Check `PRODUCTION_READINESS_REPORT.md`
3. Fix high-priority issues
4. Re-run `npm run build`

### App Shows Mock Data in Production
1. Check environment variables: `echo $NEXT_PUBLIC_USE_MOCK_DATA`
2. Verify `.env.production` is being used
3. Clear Next.js cache: `rm -rf .next`
4. Rebuild: `npm run build`

### Authentication Fails in Production
1. Verify Supabase URLs are production URLs
2. Check Supabase anon key is correct
3. Ensure no demo auth code is running

## 📞 Support

If you encounter issues:
1. Run the production audit: `npm run audit:production`
2. Check the detailed report: `PRODUCTION_READINESS_REPORT.md`
3. Follow the cleanup strategy: `PRODUCTION_CLEANUP_STRATEGY.md`

## 🎯 Success Metrics

Your environment is production-ready when:
- ✅ Production audit passes (0 high-priority issues)
- ✅ Build succeeds without warnings
- ✅ App runs completely without mock data
- ✅ All features work with real data sources
- ✅ No development code accessible in production 
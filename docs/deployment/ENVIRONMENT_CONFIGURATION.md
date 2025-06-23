# Environment Configuration Guide

This guide explains how to configure AdHub for different environments (development, staging, production).

## Environment Files

AdHub uses environment-specific configuration files:

- `.env.local` - Local development
- `.env.staging` - Staging environment  
- `.env.production` - Production environment

## Required Environment Variables

### Core Configuration

| Variable | Development | Staging | Production | Description |
|----------|-------------|---------|------------|-------------|
| `NODE_ENV` | development | production | production | Node.js environment |
| `NEXT_PUBLIC_ENVIRONMENT` | development | staging | production | App environment |
| `NEXT_PUBLIC_USE_MOCK_DATA` | true | false | false | Use demo data |
| `NEXT_PUBLIC_DEMO_MODE` | true | false | false | Enable demo mode |

### API URLs

| Variable | Development | Staging | Production | Description |
|----------|-------------|---------|------------|-------------|
| `BACKEND_URL` | http://localhost:8000 | https://api-staging.adhub.tech | https://api.adhub.tech | Backend API URL |
| `NEXT_PUBLIC_API_URL` | http://localhost:8000 | https://api-staging.adhub.tech | https://api.adhub.tech | Public API URL |
| `NEXT_PUBLIC_APP_URL` | http://localhost:3000 | https://staging.adhub.tech | https://adhub.tech | Frontend URL |
| `FRONTEND_URL` | http://localhost:3000 | https://staging.adhub.tech | https://adhub.tech | Frontend URL (for tests) |
| `BACKEND_API_URL` | http://localhost:8000 | https://api-staging.adhub.tech | https://api.adhub.tech | Backend API URL (for proxy) |

### External Services

| Variable | Development | Staging | Production | Description |
|----------|-------------|---------|------------|-------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | pk_live_... | pk_live_... | pk_live_... | Stripe publishable key |
| `NEXT_PUBLIC_BOT_USERNAME` | adhubtechbot | adhubtechbot | adhubtechbot | Telegram bot username |
| `NEXT_PUBLIC_SUPABASE_URL` | (optional) | https://...supabase.co | https://...supabase.co | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (optional) | eyJ... | eyJ... | Supabase anonymous key |

## Environment Setup

### Development

```bash
# Copy the development environment file
cp .env.local.example .env.local

# Or create manually:
cat > .env.local << 'EOF'
NODE_ENV=development
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_DEMO_MODE=true
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
```

### Staging

```bash
# Set staging environment variables
export NODE_ENV=production
export NEXT_PUBLIC_ENVIRONMENT=staging
export BACKEND_URL=https://api-staging.adhub.tech
export NEXT_PUBLIC_API_URL=https://api-staging.adhub.tech
export NEXT_PUBLIC_APP_URL=https://staging.adhub.tech
```

### Production

```bash
# Set production environment variables
export NODE_ENV=production
export NEXT_PUBLIC_ENVIRONMENT=production
export BACKEND_URL=https://api.adhub.tech
export NEXT_PUBLIC_API_URL=https://api.adhub.tech
export NEXT_PUBLIC_APP_URL=https://adhub.tech
```

## Environment Detection

The app automatically detects the environment using:

```typescript
// Environment detection helpers
export const isStaging = () => process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging';
export const isProduction = () => process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
export const isDevelopment = () => process.env.NEXT_PUBLIC_ENVIRONMENT === 'development';
```

## Data Source Configuration

| Environment | Data Source | Description |
|-------------|-------------|-------------|
| Development | Demo Data | Uses mock data for development |
| Staging | Supabase | Uses real database with test data |
| Production | Supabase | Uses real database with production data |

## URL Configuration

All hardcoded localhost URLs have been replaced with environment variables:

### Before (❌ Hardcoded)
```typescript
const API_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:3000';
```

### After (✅ Environment-based)
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 
                process.env.BACKEND_URL || 
                (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '');

const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || 
                    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');
```

## Testing Configuration

Playwright tests now use environment variables:

```typescript
// Environment-based URLs for tests
const FRONTEND_URL = process.env.FRONTEND_URL || 
                    process.env.NEXT_PUBLIC_APP_URL || 
                    'http://localhost:3000';

const BACKEND_URL = process.env.BACKEND_URL || 
                   process.env.BACKEND_API_URL || 
                   'http://localhost:8000';
```

## Deployment

### Vercel

Set environment variables in Vercel dashboard:

```bash
# Production
vercel env add NEXT_PUBLIC_ENVIRONMENT production
vercel env add BACKEND_URL https://api.adhub.tech
vercel env add NEXT_PUBLIC_API_URL https://api.adhub.tech

# Staging  
vercel env add NEXT_PUBLIC_ENVIRONMENT staging
vercel env add BACKEND_URL https://api-staging.adhub.tech
vercel env add NEXT_PUBLIC_API_URL https://api-staging.adhub.tech
```

### Docker

Use environment files with Docker:

```bash
# Development
docker run --env-file .env.local adhub:latest

# Production
docker run --env-file .env.production adhub:latest
```

## Security Notes

1. **Never commit `.env.local`** - Contains development secrets
2. **Use different keys per environment** - Staging vs Production
3. **Validate environment variables** - Check required vars on startup
4. **Use HTTPS in production** - All production URLs must use HTTPS

## Troubleshooting

### Common Issues

1. **"Backend URL not configured"**
   - Ensure `BACKEND_URL` or `NEXT_PUBLIC_API_URL` is set
   - Check environment file is loaded correctly

2. **"Localhost URLs in production"**
   - Verify production environment variables are set
   - Check `NEXT_PUBLIC_ENVIRONMENT=production`

3. **API calls failing**
   - Verify backend is running and accessible
   - Check CORS configuration allows frontend domain

### Debug Environment

```typescript
// Add to your component for debugging
console.log('Environment Info:', {
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  backendUrl: process.env.BACKEND_URL,
  nodeEnv: process.env.NODE_ENV
});
```

## Migration from Hardcoded URLs

All hardcoded URLs have been systematically replaced:

✅ **Files Updated:**
- `playwright.config.ts` - Test configuration
- `tests/adhub-full-flow.spec.ts` - Test URLs
- `frontend/src/lib/config/api.ts` - API configuration
- `frontend/src/lib/data/config.ts` - Data configuration
- `frontend/src/lib/env-config.ts` - Environment configuration
- `frontend/src/pages/api/proxy/[...path].ts` - Proxy configuration

✅ **Environment Files Created:**
- `.env.local` - Development configuration
- `.env.staging` - Staging configuration  
- `.env.production` - Production configuration

## Next Steps

1. **Phase 3: Supabase Integration** - Replace mock data with real database
2. **Phase 4: Advanced Onboarding** - Implement database-backed onboarding
3. **Monitoring** - Add environment-specific monitoring and logging 
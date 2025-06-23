# 🌍 Environment Switching Guide

## Quick Environment Switching

### 🔧 Demo Mode (Current)
```bash
# Use .env.local (already active)
cp frontend/.env.local frontend/.env.local.active
npm run dev
```
**Features**: Mock data, no auth, fast development

### 🔬 Development Mode (Real Data)
```bash
# Switch to development environment
cp frontend/.env.development frontend/.env.local
npm run dev
```
**Features**: Real Supabase, test Stripe, JWT auth

### 🚀 Production Build
```bash
# Build for production
cp frontend/.env.production frontend/.env.local
npm run build
npm run start
```
**Features**: Live data, live Stripe, full security

## 🎯 Build Strategy for Production

### Option 1: Environment-Specific Builds
```bash
# Development build
ENVIRONMENT=development npm run build

# Production build  
ENVIRONMENT=production npm run build
```

### Option 2: Runtime Environment Detection
Your current setup already supports this! The middleware checks:
```typescript
const isDemoMode = process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true'
const isProduction = process.env.NODE_ENV === 'production'
```

## 🔄 Deployment Strategy

### Vercel/Netlify Deployment
1. Set environment variables in deployment platform:
   ```
   NEXT_PUBLIC_USE_DEMO_DATA=false
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

2. Your middleware automatically switches to production mode

### Docker Deployment
```dockerfile
# Copy appropriate env file
COPY .env.production .env.local
```

## 🛡️ Security Considerations

### Demo Mode (Safe)
- No real data exposed
- Mock authentication
- Safe for public demos

### Development Mode (Careful)
- Real test data
- Test payment processing
- Secure development environment

### Production Mode (Secure)
- Live user data
- Real payments
- Full security stack

## 🎪 Current Advantage

Your setup is **already production-ready**! You can:

1. **Keep demo mode for development** (current state)
2. **Deploy to production** by setting `NEXT_PUBLIC_USE_DEMO_DATA=false`
3. **Switch environments instantly** without code changes

The middleware, AuthContext, and AppRouter all automatically adapt based on environment variables! 
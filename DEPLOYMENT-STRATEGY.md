# 🚀 AdHub Deployment Strategy

## 🌿 Branch Strategy

```
main (production) ← adhub.tech
├── staging ← staging.adhub.tech  
├── develop (integration)
└── feature/* (feature branches)
```

## 📋 Vercel Configuration

### Step 1: Configure Branch Deployments

1. **Go to Vercel Project Settings**
   - Navigate to your AdHub project in Vercel dashboard
   - Go to **Settings** → **Git**

2. **Configure Production Branch**
   - **Production Branch**: `main`
   - **Domain**: `adhub.tech`
   - **Environment**: Production variables

3. **Configure Staging Branch**
   - **Preview Branch**: `staging`
   - **Domain**: `staging.adhub.tech`
   - **Environment**: Staging variables

### Step 2: Environment Variables by Branch

#### Production Environment (`main` branch):
```env
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_KEY=your_production_service_key
NEXT_PUBLIC_API_URL=https://api.adhub.tech
```

#### Staging Environment (`staging` branch):
```env
NODE_ENV=staging
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_SUPABASE_URL=https://xewhfrwuzkfbnpwtdxuf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhld2hmcnd1emtmYm5wd3RkeHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjA3NDAsImV4cCI6MjA2NDYzNjc0MH0.uiDOEgNu2sbG9ZinYDBDfew2eXw_gIItZL9CuV7k_TE
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhld2hmcnd1emtmYm5wd3RkeHVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA2MDc0MCwiZXhwIjoyMDY0NjM2NzQwfQ.uiDOEgNu2sbG9ZinYDBDfew2eXw_gIItZL9CuV7k_TE
NEXT_PUBLIC_API_URL=https://api-staging.adhub.tech
```

### Step 3: Domain Configuration

1. **Production Domain** (`adhub.tech`):
   - Assigned to `main` branch
   - Uses production environment variables

2. **Staging Domain** (`staging.adhub.tech`):
   - Assigned to `staging` branch
   - Uses staging environment variables

## 🖥️ Backend Deployment (Render)

### Step 1: Create Two Services

#### Production Backend:
- **Name**: `adhub-api-production`
- **Branch**: `main`
- **Domain**: `api.adhub.tech`
- **Environment**: Production variables from `backend/.env.production`

#### Staging Backend:
- **Name**: `adhub-api-staging`
- **Branch**: `staging`
- **Domain**: `api-staging.adhub.tech`
- **Environment**: Staging variables from `backend/.env.staging`

### Step 2: Render Configuration

#### Build Settings:
```
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Root Directory: backend
```

#### Environment Variables (Production):
```env
ENVIRONMENT=production
DEBUG=false
SUPABASE_URL=your_production_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
SUPABASE_ANON_KEY=your_production_anon_key
CORS_ORIGINS_STRING=https://adhub.tech
API_URL=https://api.adhub.tech
SECRET_KEY=your_production_secret_key
```

#### Environment Variables (Staging):
```env
ENVIRONMENT=staging
DEBUG=false
SUPABASE_URL=https://xewhfrwuzkfbnpwtdxuf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhld2hmcnd1emtmYm5wd3RkeHVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA2MDc0MCwiZXhwIjoyMDY0NjM2NzQwfQ.uiDOEgNu2sbG9ZinYDBDfew2eXw_gIItZL9CuV7k_TE
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhld2hmcnd1emtmYm5wd3RkeHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjA3NDAsImV4cCI6MjA2NDYzNjc0MH0.uiDOEgNu2sbG9ZinYDBDfew2eXw_gIItZL9CuV7k_TE
CORS_ORIGINS_STRING=https://staging.adhub.tech
API_URL=https://api-staging.adhub.tech
SECRET_KEY=00bda706c0fa8651c92caa4380fa401e6fd0226779937801ec8ee90c5b9d3fb4
```

## 🔄 Workflow

### Development Workflow:
1. **Feature Development**: `feature/new-feature` → `develop`
2. **Integration Testing**: `develop` → `staging` (triggers staging deployment)
3. **QA & Testing**: Test on `staging.adhub.tech`
4. **Production Release**: `staging` → `main` (triggers production deployment)

### Deployment Triggers:
- **Push to `main`** → Deploys to production (`adhub.tech` + `api.adhub.tech`)
- **Push to `staging`** → Deploys to staging (`staging.adhub.tech` + `api-staging.adhub.tech`)
- **Push to `develop`** → No deployment (integration only)

## 🎯 Benefits

✅ **Controlled Releases** - Nothing goes to production without staging approval  
✅ **Parallel Development** - Multiple features can be integrated in develop  
✅ **Safe Testing** - Staging environment mirrors production  
✅ **Quick Rollbacks** - Production branch is always stable  
✅ **Team Collaboration** - Clear workflow for all developers  

## 🚨 Important Notes

1. **Never push directly to `main`** - Always go through staging
2. **Test thoroughly on staging** before promoting to production
3. **Keep environment variables secure** - Use Vercel/Render secret management
4. **Monitor deployments** - Set up alerts for failed builds
5. **Database migrations** - Apply to staging first, then production

## ✅ Verification Checklist

- [ ] Vercel configured with branch-based deployments
- [ ] Render services created for both environments
- [ ] Environment variables set correctly
- [ ] Domains pointing to correct branches
- [ ] Staging deployment working
- [ ] Production deployment working
- [ ] Database connections verified
- [ ] CORS configured properly 
# AdHub Deployment Guide

## URL Configuration ✅

Your AdHub project is now configured with the following URLs:

### Development (Local)
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:8000`
- **Proxy**: Frontend → Backend direct

### Staging
- **Frontend**: `https://staging.adhub.tech`
- **Backend**: `https://api-staging.adhub.tech`
- **Proxy**: `https://staging.adhub.tech/api/proxy/*` → `https://api-staging.adhub.tech/api/*`

### Production
- **Frontend**: `https://adhub.tech`
- **Backend**: `https://api.adhub.tech`
- **Proxy**: `https://adhub.tech/api/proxy/*` → `https://api.adhub.tech/api/*`

## DNS Configuration Required

You'll need to set up these DNS records in your domain registrar (where you bought `adhub.tech`):

### Production DNS Records
```
Type    Name    Value                           TTL
A       @       [Your-Frontend-Server-IP]       300
A       api     [Your-Backend-Server-IP]        300
```

### Staging DNS Records
```
Type    Name        Value                           TTL
A       staging     [Your-Staging-Frontend-IP]      300
A       api-staging [Your-Staging-Backend-IP]       300
```

## Deployment Options

### Option 1: Vercel + Railway (Recommended)

**Frontend (Vercel)**:
1. Connect your GitHub repo to Vercel
2. Set custom domain: `adhub.tech` (production), `staging.adhub.tech` (staging)
3. Environment variables will be loaded from your `.env.production` / `.env.staging`

**Backend (Railway)**:
1. Deploy FastAPI app to Railway
2. Set custom domain: `api.adhub.tech` (production), `api-staging.adhub.tech` (staging)
3. Environment variables from your backend `.env` files

### Option 2: Netlify + Render

**Frontend (Netlify)**:
1. Connect GitHub repo
2. Build command: `cd frontend && npm run build`
3. Publish directory: `frontend/out` or `frontend/.next`
4. Custom domains: `adhub.tech`, `staging.adhub.tech`

**Backend (Render)**:
1. Deploy FastAPI service
2. Custom domains: `api.adhub.tech`, `api-staging.adhub.tech`

### Option 3: AWS/DigitalOcean VPS

**Frontend**:
- Deploy Next.js with PM2 or Docker
- Use Nginx reverse proxy
- SSL with Let's Encrypt

**Backend**:
- Deploy FastAPI with Gunicorn/Uvicorn
- Use Nginx reverse proxy
- SSL with Let's Encrypt

## Environment Setup Steps

### 1. Development (Already Working)
```bash
./start-dev-servers.sh
```

### 2. Staging Deployment

**Before deploying**, you need to:

1. **Set up DNS**: Point `staging.adhub.tech` and `api-staging.adhub.tech` to your staging servers
2. **Deploy Backend**: Deploy to your chosen platform with staging environment
3. **Deploy Frontend**: Deploy to your chosen platform with staging environment
4. **Test**: Verify the staging environment works

**Commands**:
```bash
# Switch to staging environment
./set-env.sh staging

# Test staging configuration (after deployment)
curl https://staging.adhub.tech
curl https://api-staging.adhub.tech/docs
```

### 3. Production Deployment

**Before deploying**, you need to:

1. **Set up DNS**: Point `adhub.tech` and `api.adhub.tech` to your production servers
2. **Deploy Backend**: Deploy to production with production environment
3. **Deploy Frontend**: Deploy to production with production environment
4. **Test**: Verify everything works

**Commands**:
```bash
# Switch to production environment
./set-env.sh production

# Test production configuration (after deployment)
curl https://adhub.tech
curl https://api.adhub.tech/docs
```

## Deployment Checklist

### Pre-Deployment
- [ ] DNS records configured
- [ ] SSL certificates ready (automatic with Vercel/Netlify)
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Supabase production instance configured

### Staging Deployment
- [ ] Backend deployed to `api-staging.adhub.tech`
- [ ] Frontend deployed to `staging.adhub.tech`
- [ ] Proxy routing working
- [ ] Authentication working
- [ ] Database connected
- [ ] All features tested

### Production Deployment
- [ ] Backend deployed to `api.adhub.tech`
- [ ] Frontend deployed to `adhub.tech`
- [ ] Proxy routing working
- [ ] Authentication working
- [ ] Database connected
- [ ] Performance optimized
- [ ] Monitoring set up

## Platform-Specific Instructions

### Vercel (Frontend)

1. **Connect Repository**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   cd frontend
   vercel --prod
   ```

2. **Set Custom Domain**:
   - Go to Vercel dashboard
   - Project Settings → Domains
   - Add `adhub.tech` and `staging.adhub.tech`

3. **Environment Variables**:
   - Copy from your `.env.production` / `.env.staging`
   - Set in Vercel dashboard under Environment Variables

### Railway (Backend)

1. **Deploy**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   cd backend
   railway deploy
   ```

2. **Set Custom Domain**:
   - Railway dashboard → Settings → Domains
   - Add `api.adhub.tech` and `api-staging.adhub.tech`

3. **Environment Variables**:
   - Copy from your `.env.production` / `.env.staging`
   - Set in Railway dashboard

## Testing Your Deployment

### Staging Tests
```bash
# Test staging frontend
curl https://staging.adhub.tech

# Test staging backend
curl https://api-staging.adhub.tech/docs

# Test staging proxy
curl https://staging.adhub.tech/api/proxy/test
```

### Production Tests
```bash
# Test production frontend
curl https://adhub.tech

# Test production backend
curl https://api.adhub.tech/docs

# Test production proxy
curl https://adhub.tech/api/proxy/test
```

## Troubleshooting

### Common Issues

1. **DNS Not Propagating**:
   - Wait 24-48 hours for full propagation
   - Use `dig adhub.tech` to check DNS status

2. **SSL Certificate Issues**:
   - Vercel/Netlify handle this automatically
   - For custom servers, use Let's Encrypt

3. **CORS Errors**:
   - Verify `CORS_ORIGINS_STRING` includes your frontend domain
   - Check environment variables are loaded correctly

4. **Proxy 502 Errors**:
   - Ensure backend is running and accessible
   - Check backend URL in frontend environment variables

### Monitoring

Set up monitoring for:
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Log aggregation (LogRocket, DataDog)

## Next Steps

1. **Choose your deployment platforms** (Vercel + Railway recommended)
2. **Set up DNS records** for your domains
3. **Deploy staging environment** first
4. **Test thoroughly** on staging
5. **Deploy to production** when ready
6. **Set up monitoring** and alerts

Your proxy configuration is ready for deployment! 🚀 
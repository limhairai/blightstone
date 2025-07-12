# AdHub Production Deployment Guide

This guide covers the complete setup for deploying AdHub to production with automated CI/CD.

## 🚀 Overview

AdHub uses a multi-stage deployment pipeline:
- **Development** → **Staging** → **Production**
- Automated testing at each stage
- Security scanning and health checks
- Rollback capabilities

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │     Staging     │    │   Production    │
│                 │    │                 │    │                 │
│ localhost:3000  │───▶│ staging.adhub   │───▶│  adhub.tech     │
│ localhost:8000  │    │     .tech       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

### 1. GitHub Repository Setup
- [x] Repository exists: `limhairai/adhub`
- [x] Branches: `main` (production), `staging` (staging)
- [x] CI/CD workflow created: `.github/workflows/ci-cd.yml`

### 2. Required Accounts
- **GitHub** (repository and actions)
- **Render** (hosting platform)
- **Supabase** (database)
- **Stripe** (payments)
- **Sentry** (error tracking)

## 🔧 Environment Setup

### GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions

#### Production Secrets
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key

# Render
RENDER_API_KEY=your-render-api-key
RENDER_PRODUCTION_SERVICE_ID=your-production-service-id
RENDER_STAGING_SERVICE_ID=your-staging-service-id

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Other
SENTRY_DSN=https://your-sentry-dsn
DOLPHIN_API_KEY=your-dolphin-api-key
```

## 🚀 Deployment Process

### 1. Staging Deployment
```bash
# Push to staging branch
git checkout staging
git push origin staging

# This triggers:
# ✅ Frontend tests
# ✅ Backend tests  
# ✅ Security scan
# ✅ Deploy to staging.adhub.tech
# ✅ Health check
```

### 2. Production Deployment
```bash
# Merge staging to main
git checkout main
git merge staging
git push origin main

# This triggers:
# ✅ All tests (unit, integration, e2e)
# ✅ Security scan
# ✅ Deploy to adhub.tech
# ✅ Health check
# ✅ Deployment tracking
```

## 📊 Monitoring & Health Checks

### Health Endpoints
- **Frontend**: `https://adhub.tech/api/health`
- **Backend**: `https://adhub-backend-prod.onrender.com/health`

### Monitoring Tools
- **Sentry**: Error tracking and performance monitoring
- **Render**: Infrastructure monitoring
- **GitHub Actions**: Deployment status

## 🔒 Security Measures

### 1. Environment Variables
- All secrets stored in GitHub Secrets
- No hardcoded credentials in code
- Environment-specific configurations

### 2. Security Scanning
- **Trivy**: Vulnerability scanning
- **GitHub CodeQL**: Code analysis
- **Dependency scanning**: Automated security updates

### 3. Access Control
- **GitHub**: Branch protection rules
- **Render**: Team access controls
- **Supabase**: Row Level Security (RLS)

## 📦 Services Configuration

### Render Services

#### Production Backend
```yaml
name: adhub-backend-prod
type: web
env: python
region: oregon
plan: starter
rootDir: backend
buildCommand: pip install -r requirements/prod.txt
startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

#### Production Frontend
```yaml
name: adhub-frontend-prod
type: web
env: node
region: oregon
plan: starter
rootDir: frontend
buildCommand: npm ci && npm run build
startCommand: npm start
```

### Environment Variables Setup

#### Backend Environment Variables
```bash
ENVIRONMENT=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET_KEY=your-jwt-secret
CORS_ORIGINS=https://adhub.tech,https://www.adhub.tech
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENTRY_DSN=https://your-sentry-dsn
DOLPHIN_API_URL=https://cloud.dolphin.tech
DOLPHIN_API_KEY=your-dolphin-api-key
```

#### Frontend Environment Variables
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://adhub-backend-prod.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
```

## 🗄️ Database Setup

### Supabase Production Database
1. **Create Production Project**
   ```bash
   # Create new Supabase project for production
   # Copy connection details
   ```

2. **Run Migrations**
   ```bash
   # Connect to production database
   supabase link --project-ref your-production-ref
   
   # Apply all migrations
   supabase db push
   ```

3. **Setup Row Level Security**
   ```sql
   -- Enable RLS on all tables
   -- Configure policies for production
   ```

## 🔄 CI/CD Pipeline Details

### Workflow Triggers
- **Push to staging**: Deploys to staging environment
- **Push to main**: Deploys to production environment
- **Pull requests**: Runs tests only

### Pipeline Stages

#### 1. Testing Stage
```yaml
- Frontend tests (Jest, TypeScript, ESLint)
- Backend tests (pytest, flake8)
- E2E tests (Playwright)
- Security scanning (Trivy)
```

#### 2. Staging Deployment
```yaml
- Deploy to staging.adhub.tech
- Run health checks
- Notify team
```

#### 3. Production Deployment
```yaml
- Deploy to adhub.tech
- Run comprehensive health checks
- Update deployment status
- Notify team
```

## 🚨 Rollback Procedures

### Automatic Rollback
- Health checks fail → Automatic rollback
- Critical errors detected → Manual rollback available

### Manual Rollback
```bash
# Rollback to previous version
git checkout main
git reset --hard HEAD~1
git push --force origin main
```

## 📈 Performance Monitoring

### Key Metrics
- **Response time**: < 200ms average
- **Uptime**: > 99.9%
- **Error rate**: < 0.1%
- **Database queries**: < 100ms average

### Alerts Setup
- **Sentry**: Error rate thresholds
- **Render**: Resource usage alerts
- **GitHub**: Deployment failure notifications

## 🔧 Maintenance

### Regular Tasks
- **Weekly**: Review error logs and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and update CI/CD pipeline

### Backup Strategy
- **Database**: Daily automated backups via Supabase
- **Code**: Git repository with multiple branches
- **Configs**: Environment variables backed up securely

## 🎯 Launch Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] Security scan clean
- [ ] Performance benchmarks met
- [ ] Monitoring configured
- [ ] Backup strategy in place

### Launch Day
- [ ] Deploy to production
- [ ] Verify all services running
- [ ] Test critical user flows
- [ ] Monitor error rates
- [ ] Confirm payment processing

### Post-Launch
- [ ] Monitor for 24 hours
- [ ] Review performance metrics
- [ ] Gather user feedback
- [ ] Plan next iteration

## 📞 Support & Escalation

### Issue Severity Levels
- **P0 (Critical)**: Site down, payment failures
- **P1 (High)**: Major feature broken
- **P2 (Medium)**: Minor feature issues
- **P3 (Low)**: Cosmetic issues

### Contact Information
- **Technical Lead**: [Your contact]
- **DevOps**: [DevOps contact]
- **On-call**: [On-call rotation]

---

## 🎉 You're Ready for Production!

With this setup, AdHub has:
- ✅ Automated testing and deployment
- ✅ Security scanning and monitoring
- ✅ Staging environment for testing
- ✅ Rollback capabilities
- ✅ Performance monitoring
- ✅ Error tracking

Your production deployment is now ready to scale! 🚀 
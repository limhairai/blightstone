# 🚀 GitHub CI/CD Setup Guide

## Overview

AdHub has a comprehensive CI/CD pipeline with multiple workflows for different purposes. This guide will help you set up and configure GitHub Actions for automated testing, security scanning, and deployment.

## 📋 Available Workflows

### 1. **Basic CI** (`ci.yml`)
- **Triggers**: Push/PR to `main` branch
- **Purpose**: Simple build and test validation
- **Features**: Node.js setup, linting, testing, Playwright E2E tests

### 2. **Comprehensive CI/CD** (`ci-cd.yml`) ⭐ **Primary Workflow**
- **Triggers**: Push/PR to `staging` and `main` branches
- **Purpose**: Complete testing, security, and deployment pipeline
- **Features**: 
  - Frontend testing (TypeScript, ESLint, Jest)
  - Backend testing (Python, pytest)
  - E2E testing (Playwright)
  - Security scanning (Trivy)
  - Automated deployment to staging and production

### 3. **Comprehensive Testing** (`comprehensive-testing.yml`)
- **Triggers**: Push/PR to `main` and `develop` branches
- **Purpose**: Enterprise-grade testing and security validation
- **Features**: Security audits, configuration validation, detailed reporting

## 🔧 Setup Instructions

### Step 1: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and Variables → Actions

#### Required Secrets:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Render Deployment (Backend)
RENDER_API_KEY=your-render-api-key
RENDER_STAGING_SERVICE_ID=your-staging-service-id
RENDER_PRODUCTION_SERVICE_ID=your-production-service-id

# Vercel Deployment (Frontend) - REQUIRED
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-organization-id
VERCEL_PROJECT_ID=your-project-id
```

#### How to Get These Secrets:

**Supabase Secrets:**
1. Go to your Supabase project dashboard
2. Settings → API → Project URL (`SUPABASE_URL`)
3. Settings → API → Project API keys → `anon public` (`SUPABASE_ANON_KEY`)
4. Settings → API → Project API keys → `service_role` (`SUPABASE_SERVICE_KEY`)

**Render Secrets (Backend):**
1. Go to Render Dashboard → Account Settings → API Keys
2. Create new API key (`RENDER_API_KEY`)
3. Go to your backend service → Settings → Copy Service ID (`RENDER_STAGING_SERVICE_ID`)
4. Go to your production backend service → Settings → Copy Service ID (`RENDER_PRODUCTION_SERVICE_ID`)

**Vercel Secrets (Frontend):**
1. Go to Vercel Dashboard → Account Settings → Tokens
2. Create new token (`VERCEL_TOKEN`)
3. Go to Account Settings → General → Team ID (`VERCEL_ORG_ID`)
4. Go to your project → Settings → General → Project ID (`VERCEL_PROJECT_ID`)

#### ⚠️ Important: Update Backend URLs

In your `.github/workflows/ci-cd.yml` file, update these placeholder URLs with your actual Render service URLs:

```yaml
# Find and replace these URLs in the workflow file:
https://your-backend.onrender.com        → https://your-actual-backend.onrender.com
https://your-backend-staging.onrender.com → https://your-actual-staging-backend.onrender.com
```

You can find these URLs in your Render dashboard for each service.

### Step 2: Set Up Branch Protection

1. Go to repository Settings → Branches
2. Add protection rules for `main` and `staging`:

```yaml
Branch Protection Rules:
✅ Require a pull request before merging
✅ Require status checks to pass before merging
  - frontend-tests
  - backend-tests
  - security-scan
✅ Require branches to be up to date before merging
✅ Require conversation resolution before merging
✅ Restrict pushes that create files larger than 100MB
```

### Step 3: Configure Environments

1. Go to repository Settings → Environments
2. Create two environments:

#### **Staging Environment**
- Name: `staging`
- URL: `https://staging.adhub.tech`
- Protection rules: None (auto-deploy)

#### **Production Environment**
- Name: `production`
- URL: `https://adhub.tech`
- Protection rules:
  - ✅ Required reviewers: Add your team
  - ✅ Wait timer: 5 minutes
  - ✅ Deployment branches: `main` only

## 🔄 Workflow Triggers

### Automatic Triggers

| Workflow | Trigger | Branch | Action |
|----------|---------|---------|---------|
| `ci.yml` | Push/PR | `main` | Basic testing |
| `ci-cd.yml` | Push | `staging` | Deploy to staging |
| `ci-cd.yml` | Push | `main` | Deploy to production |
| `comprehensive-testing.yml` | Push/PR | `main`, `develop` | Full testing suite |

### Manual Triggers

You can also trigger workflows manually:
1. Go to Actions tab
2. Select the workflow
3. Click "Run workflow"

## 📦 Deployment Flow

### Development → Staging → Production

1. **Feature Development**
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git push origin feature/new-feature
   # Create PR to staging
   ```

2. **Staging Deployment**
   ```bash
   # Merge PR to staging branch
   git checkout staging
   git merge feature/new-feature
   git push origin staging
   # → Automatically deploys to staging
   ```

3. **Production Deployment**
   ```bash
   # After testing on staging
   git checkout main
   git merge staging
   git push origin main
   # → Automatically deploys to production (with approval)
   ```

## 🔍 Monitoring and Troubleshooting

### Viewing Workflow Results

1. Go to Actions tab in your repository
2. Click on any workflow run to see details
3. Check individual job logs for debugging

### Common Issues and Solutions

#### 1. **Test Failures**
```bash
# Check the specific test that failed
npm test -- --verbose

# Run tests locally to debug
cd frontend && npm test
cd backend && python -m pytest tests/ -v
```

#### 2. **Build Failures**
```bash
# Check environment variables
echo $NEXT_PUBLIC_API_URL

# Verify build locally
npm run build
```

#### 3. **Deployment Failures**
```bash
# Check health endpoint
curl -f https://staging.adhub.tech/health

# Verify secrets are set correctly
# Go to Settings → Secrets and Variables → Actions
```

### Health Check Endpoints

The workflows include health checks:
- **Staging**: `https://staging.adhub.tech/health`
- **Production**: `https://adhub.tech/health`

Make sure these endpoints return 200 OK for deployments to succeed.

## 📊 Security Features

### Included Security Checks

1. **Vulnerability Scanning** (Trivy)
   - Scans for known vulnerabilities
   - Uploads results to GitHub Security tab

2. **Dependency Auditing** (npm audit)
   - Checks for vulnerable packages
   - Blocks deployment if critical issues found

3. **Secret Detection**
   - Scans for hardcoded secrets
   - Prevents accidental exposure

4. **Code Quality** (ESLint, flake8)
   - Enforces coding standards
   - Catches potential bugs

### Security Best Practices

1. **Never commit secrets** to the repository
2. **Use environment variables** for configuration
3. **Regularly update dependencies**
4. **Review security alerts** in GitHub Security tab
5. **Use least privilege** for deployment keys

## 🎯 Customization

### Adding New Tests

1. **Frontend Tests**
   ```bash
   cd frontend
   npm test -- --coverage
   ```

2. **Backend Tests**
   ```bash
   cd backend
   python -m pytest tests/ -v --cov=app
   ```

3. **E2E Tests**
   ```bash
   npx playwright test
   ```

### Adding New Deployment Targets

Edit `.github/workflows/ci-cd.yml`:

```yaml
deploy-new-environment:
  name: Deploy to New Environment
  runs-on: ubuntu-latest
  needs: [frontend-tests, backend-tests]
  if: github.ref == 'refs/heads/feature-branch'
  
  steps:
    - name: Deploy to New Environment
      run: |
        # Your deployment commands here
```

## 📝 Maintenance

### Regular Tasks

1. **Update Dependencies**
   ```bash
   # Update GitHub Actions versions
   # Check for @v4 → @v5 updates
   
   # Update Node.js version
   # Update Python version
   ```

2. **Review Security Alerts**
   - Check GitHub Security tab weekly
   - Update vulnerable dependencies
   - Review and dismiss false positives

3. **Monitor Performance**
   - Check workflow run times
   - Optimize slow steps
   - Consider parallel execution

### Backup and Recovery

1. **Workflow Backups**
   - Workflows are version controlled
   - Can be restored from git history

2. **Secrets Recovery**
   - Maintain secure backup of secrets
   - Document secret rotation procedures

## 🔗 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Render Deployment Guide](https://render.com/docs/deploy-from-github)
- [Supabase CI/CD Guide](https://supabase.com/docs/guides/cli/cicd-workflows)
- [Playwright Testing Guide](https://playwright.dev/docs/ci)

## 🆘 Support

If you encounter issues:

1. Check the workflow logs in GitHub Actions
2. Verify all secrets are properly set
3. Test the deployment locally
4. Review the health check endpoints
5. Check the repository Settings → Environments

Your CI/CD pipeline is production-ready with enterprise-grade security and testing! 🚀 
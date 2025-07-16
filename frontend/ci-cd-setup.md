# 🚀 CI/CD Integration Setup Guide

## Overview

Set up automated testing and deployment pipeline for your AdHub application.

## 1. GitHub Actions Workflow

Create `.github/workflows/test-and-deploy.yml`:

```yaml
name: Test and Deploy

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: 'frontend/package-lock.json'
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run Jest tests
      run: |
        cd frontend
        npm test -- --coverage --watchAll=false
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./frontend/coverage/lcov.info
    
    - name: Install Playwright browsers
      run: |
        cd frontend
        npx playwright install --with-deps
    
    - name: Run Playwright tests
      run: |
        cd frontend
        npx playwright test
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    
    - name: Upload Playwright report
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: frontend/playwright-report/
        retention-days: 30

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment"
        # Add your staging deployment commands here
    
  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to production
      run: |
        echo "Deploying to production environment"
        # Add your production deployment commands here
```

## 2. Test Coverage Reporting

### Setup Codecov

1. **Install Codecov**:
```bash
npm install --save-dev @codecov/codecov-action
```

2. **Update package.json**:
```json
{
  "scripts": {
    "test:coverage": "jest --coverage --watchAll=false",
    "test:coverage:report": "jest --coverage --coverageReporters=lcov"
  }
}
```

3. **Add to GitHub Secrets**:
- `CODECOV_TOKEN` (from codecov.io)

### Coverage Badge

Add to your README.md:
```markdown
[![codecov](https://codecov.io/gh/yourusername/adhub/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/adhub)
```

## 3. Performance Monitoring

### Setup Lighthouse CI

1. **Install Lighthouse CI**:
```bash
npm install --save-dev @lhci/cli
```

2. **Create `lighthouserc.js`**:
```javascript
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      startServerCommand: 'npm run dev',
      startServerReadyPattern: 'ready on',
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', {minScore: 0.8}],
        'categories:accessibility': ['error', {minScore: 0.9}],
        'categories:best-practices': ['warn', {minScore: 0.8}],
        'categories:seo': ['warn', {minScore: 0.8}],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

3. **Add to GitHub Actions**:
```yaml
- name: Run Lighthouse CI
  run: |
    cd frontend
    npx lhci autorun
```

## 4. Automated Security Scanning

### Setup Snyk

1. **Install Snyk**:
```bash
npm install -g snyk
```

2. **Add to GitHub Actions**:
```yaml
- name: Run Snyk security scan
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  with:
    args: --severity-threshold=high
```

## 5. Database Migration Testing

### Setup Test Database

1. **Create test migration script**:
```bash
#!/bin/bash
# scripts/test-migrations.sh

echo "Setting up test database..."
supabase db reset --db-url $TEST_DATABASE_URL
supabase db push --db-url $TEST_DATABASE_URL

echo "Running migration tests..."
npm run test:migrations
```

2. **Add to GitHub Actions**:
```yaml
- name: Test database migrations
  run: |
    chmod +x scripts/test-migrations.sh
    ./scripts/test-migrations.sh
  env:
    TEST_DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

## 6. Deployment Strategies

### Blue-Green Deployment

```yaml
deploy-production:
  steps:
  - name: Deploy to green environment
    run: |
      # Deploy to green environment
      vercel --prod --env production-green
  
  - name: Run smoke tests
    run: |
      npm run test:smoke -- --baseUrl=https://green.adhub.com
  
  - name: Switch traffic to green
    run: |
      # Switch DNS/load balancer to green
      vercel alias green.adhub.com adhub.com
```

### Canary Deployment

```yaml
deploy-canary:
  steps:
  - name: Deploy canary version
    run: |
      # Deploy to 10% of traffic
      vercel --prod --regions=sfo1 --scale=1
  
  - name: Monitor canary metrics
    run: |
      # Monitor error rates, performance
      npm run monitor:canary
  
  - name: Full rollout or rollback
    run: |
      if [ "$CANARY_SUCCESS" == "true" ]; then
        vercel --prod --scale=10
      else
        vercel rollback
      fi
```

## 7. Monitoring and Alerting

### Setup Sentry

1. **Install Sentry**:
```bash
npm install @sentry/nextjs
```

2. **Configure Sentry**:
```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

3. **Add alerts**:
```yaml
- name: Check error rates
  run: |
    ERROR_RATE=$(curl -s "https://sentry.io/api/0/projects/adhub/events/" | jq '.errorRate')
    if (( $(echo "$ERROR_RATE > 0.05" | bc -l) )); then
      echo "High error rate detected: $ERROR_RATE"
      exit 1
    fi
```

## 8. Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test:all": "npm run test && npm run test:e2e",
    "test:e2e": "playwright test",
    "test:coverage": "jest --coverage --watchAll=false",
    "test:smoke": "playwright test --grep='@smoke'",
    "build:analyze": "ANALYZE=true npm run build",
    "deploy:staging": "vercel --env staging",
    "deploy:prod": "vercel --prod",
    "monitor:performance": "lighthouse http://localhost:3000 --output=json",
    "security:scan": "snyk test",
    "db:test": "supabase db reset && supabase db push"
  }
}
```

## 9. Environment Management

### Development
```bash
# .env.development
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-key
NODE_ENV=development
```

### Staging
```bash
# .env.staging
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-key
NODE_ENV=staging
```

### Production
```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-key
NODE_ENV=production
```

## 10. Quality Gates

### Pre-commit Hooks

1. **Install husky**:
```bash
npm install --save-dev husky lint-staged
```

2. **Setup pre-commit**:
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --findRelatedTests --passWithNoTests"
    ]
  }
}
```

## Implementation Timeline

### Week 1: Foundation
- ✅ Jest tests (COMPLETED)
- 🔄 Fix E2E tests syntax
- 🔄 Basic GitHub Actions workflow

### Week 2: Enhanced Testing
- 🔄 Test coverage reporting
- 🔄 Performance monitoring
- 🔄 Security scanning

### Week 3: Advanced CI/CD
- 🔄 Blue-green deployment
- 🔄 Monitoring and alerting
- 🔄 Quality gates

## Benefits

### Development Speed
- **Instant feedback** on code changes
- **Automated testing** prevents manual testing time
- **Parallel testing** across multiple environments

### Code Quality
- **100% test coverage** enforcement
- **Security vulnerability** detection
- **Performance regression** prevention

### Deployment Confidence
- **Automated rollbacks** on failure
- **Canary deployments** for risk mitigation
- **Comprehensive monitoring** for early issue detection

## Next Steps

1. **Choose your deployment platform** (Vercel, Netlify, AWS, etc.)
2. **Set up GitHub secrets** for API keys and tokens
3. **Configure monitoring tools** (Sentry, DataDog, etc.)
4. **Test the pipeline** with a small change
5. **Gradually add more sophisticated features** 
# 🎭 Playwright E2E Tests Setup Guide

## Current Issues to Fix

### 1. Replace Jest Syntax with Playwright Syntax

**Before (Jest):**
```javascript
describe('Auth Workflows', () => {
  const mockService = {
    login: jest.fn(),
  };
  
  it('should login user', () => {
    expect(result).toBe(true);
  });
});
```

**After (Playwright):**
```javascript
import { test, expect } from '@playwright/test';

test.describe('Auth Workflows', () => {
  test('should login user', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');
  });
});
```

### 2. Environment Variables Setup

Create `.env.test` file:
```bash
# Supabase Test Environment
NEXT_PUBLIC_SUPABASE_URL=https://test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

### 3. Playwright Configuration Update

Update `playwright.config.ts`:
```typescript
export default defineConfig({
  testDir: './src/__tests__/e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

## Benefits of E2E Tests

### 1. Real Browser Testing
- **Cross-browser compatibility** (Chrome, Firefox, Safari, Edge)
- **Actual DOM interactions** (clicks, forms, navigation)
- **JavaScript execution** in real browser environment

### 2. Visual Regression Testing
```javascript
test('dashboard visual regression', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard.png');
});
```

### 3. Performance Monitoring
```javascript
test('page load performance', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/dashboard');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(2000); // Under 2 seconds
});
```

### 4. Real User Flows
```javascript
test('complete user journey', async ({ page }) => {
  // Register
  await page.goto('/register');
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="register-button"]');
  
  // Verify email (mock)
  await page.goto('/dashboard');
  
  // Create organization
  await page.click('[data-testid="create-org-button"]');
  await page.fill('[data-testid="org-name"]', 'Test Org');
  await page.click('[data-testid="save-org"]');
  
  // Request business manager
  await page.click('[data-testid="request-bm"]');
  await page.fill('[data-testid="domain"]', 'example.com');
  await page.click('[data-testid="submit-bm"]');
  
  // Verify success
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

## Implementation Priority

### High Priority (Essential)
1. **Authentication flows** - Login, register, logout
2. **Core business flows** - BM requests, ad account creation
3. **Payment flows** - Wallet funding, subscription billing

### Medium Priority (Valuable)
1. **Admin panel** - User management, approvals
2. **Organization management** - Team collaboration
3. **Visual regression** - UI consistency

### Low Priority (Nice to have)
1. **Cross-browser testing** - Firefox, Safari, Edge
2. **Performance monitoring** - Load times, Core Web Vitals
3. **Accessibility testing** - Screen readers, keyboard navigation

## Next Steps

1. **Fix syntax** - Convert Jest to Playwright syntax
2. **Add environment variables** - Supabase test keys
3. **Update configuration** - Playwright config
4. **Run tests** - Verify E2E functionality
5. **Add data-testid attributes** - For reliable element selection 
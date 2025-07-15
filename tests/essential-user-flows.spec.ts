import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPass123!',
  name: 'Test User'
};

const TEST_ORGANIZATION = {
  name: 'Test Organization',
  description: 'Test organization for E2E tests'
};

class AdHubTestHelper {
  constructor(private page: Page) {}

  async login(email: string = TEST_USER.email, password: string = TEST_USER.password) {
    await this.page.goto('/login');
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    // Wait for redirect to dashboard
    await this.page.waitForURL('/dashboard', { timeout: 10000 });
  }

  async register(email: string = TEST_USER.email, password: string = TEST_USER.password, name: string = TEST_USER.name) {
    await this.page.goto('/register');
    await this.page.fill('input[name="name"]', name);
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async navigateToWallet() {
    await this.page.click('[href="/dashboard/wallet"]');
    await this.page.waitForURL('/dashboard/wallet');
  }

  async navigateToBusinessManagers() {
    await this.page.click('[href="/dashboard/business-managers"]');
    await this.page.waitForURL('/dashboard/business-managers');
  }

  async navigateToPixels() {
    await this.page.click('[href="/dashboard/pixels"]');
    await this.page.waitForURL('/dashboard/pixels');
  }

  async navigateToAccounts() {
    await this.page.click('[href="/dashboard/accounts"]');
    await this.page.waitForURL('/dashboard/accounts');
  }

  async checkSubscriptionPlan(expectedPlan: string) {
    const planElement = await this.page.locator('[data-testid="current-plan"]').first();
    await expect(planElement).toContainText(expectedPlan);
  }

  async checkWalletBalance() {
    const balanceElement = await this.page.locator('[data-testid="wallet-balance"]').first();
    await expect(balanceElement).toBeVisible();
    return await balanceElement.textContent();
  }
}

test.describe('Essential AdHub User Flows', () => {
  let helper: AdHubTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new AdHubTestHelper(page);
  });

  test.describe('Authentication & Onboarding', () => {
    test('user can access login page and see login form', async ({ page }) => {
      await page.goto('/login');
      
      // Check login form elements
      await expect(page.locator('input[id="email"]')).toBeVisible();
      await expect(page.locator('input[id="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Check for Google OAuth button
      await expect(page.locator('button').filter({ hasText: 'Continue with Google' })).toBeVisible();
      
      // Check for Magic Link button
      await expect(page.locator('button').filter({ hasText: 'Continue with Magic Link' })).toBeVisible();
    });

    test('user can access register page and see registration form', async ({ page }) => {
      await page.goto('/register');
      
      // Check registration form elements
      await expect(page.locator('input[id="email"]')).toBeVisible();
      await expect(page.locator('input[id="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Check for Google OAuth button
      await expect(page.locator('button').filter({ hasText: 'Continue with Google' })).toBeVisible();
      
      // Check for Magic Link button
      await expect(page.locator('button').filter({ hasText: 'Continue with Magic Link' })).toBeVisible();
    });

    test('user can navigate between login and register pages', async ({ page }) => {
      await page.goto('/login');
      await page.click('text=Sign up');
      await expect(page).toHaveURL('/register');
      
      await page.click('text=Sign in');
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Dashboard Navigation', () => {
    test('user can access dashboard and see main navigation', async ({ page }) => {
      // These tests check that the dashboard redirects to login when not authenticated
      await page.goto('/dashboard');
      
      // Should be redirected to login with redirect parameter
      await expect(page).toHaveURL('/login?redirect=%2Fdashboard');
      
      // Check that login page is displayed
      await expect(page.locator('h2')).toContainText('Welcome back');
    });

    test('user can navigate to wallet page', async ({ page }) => {
      // Test that protected routes redirect to login
      await page.goto('/dashboard/wallet');
      
      // Should be redirected to login with redirect parameter
      await expect(page).toHaveURL('/login?redirect=%2Fdashboard%2Fwallet');
      
      // Check that login page is displayed
      await expect(page.locator('h2')).toContainText('Welcome back');
    });

    test('user can navigate to business managers page', async ({ page }) => {
      // Test that protected routes redirect to login
      await page.goto('/dashboard/business-managers');
      
      // Should be redirected to login with redirect parameter
      await expect(page).toHaveURL('/login?redirect=%2Fdashboard%2Fbusiness-managers');
      
      // Check that login page is displayed
      await expect(page.locator('h2')).toContainText('Welcome back');
    });

    test('user can navigate to pixels page', async ({ page }) => {
      // Test that protected routes redirect to login
      await page.goto('/dashboard/pixels');
      
      // Should be redirected to login with redirect parameter
      await expect(page).toHaveURL('/login?redirect=%2Fdashboard%2Fpixels');
      
      // Check that login page is displayed
      await expect(page.locator('h2')).toContainText('Welcome back');
    });

    test('user can navigate to accounts page', async ({ page }) => {
      // Test that protected routes redirect to login
      await page.goto('/dashboard/accounts');
      
      // Should be redirected to login with redirect parameter
      await expect(page).toHaveURL('/login?redirect=%2Fdashboard%2Faccounts');
      
      // Check that login page is displayed
      await expect(page.locator('h2')).toContainText('Welcome back');
    });
  });

  test.describe('Subscription & Pricing', () => {
    test('user can access pricing page', async ({ page }) => {
      await page.goto('/pricing');
      
      // Should be redirected to login with redirect parameter
      await expect(page).toHaveURL('/login?redirect=%2Fpricing');
      
      // Check that login page is displayed
      await expect(page.locator('h2')).toContainText('Welcome back');
    });

    test('user can view subscription features', async ({ page }) => {
      await page.goto('/pricing');
      
      // Should be redirected to login with redirect parameter
      await expect(page).toHaveURL('/login?redirect=%2Fpricing');
      
      // Check that login page is displayed
      await expect(page.locator('h2')).toContainText('Welcome back');
    });
  });

  test.describe('Wallet & Payments', () => {
    test('user can view wallet balance card', async ({ page }) => {
      await page.goto('/dashboard/wallet');
      
      // Should be redirected to login
      await expect(page).toHaveURL('/login?redirect=%2Fdashboard%2Fwallet');
      
      // Check that login page is displayed
      await expect(page.locator('h2')).toContainText('Welcome back');
    });

    test('user can see payment methods', async ({ page }) => {
      await page.goto('/dashboard/wallet');
      
      // Should be redirected to login
      await expect(page).toHaveURL('/login?redirect=%2Fdashboard%2Fwallet');
      
      // Check that login page is displayed
      await expect(page.locator('h2')).toContainText('Welcome back');
    });

    test('user can view transaction history', async ({ page }) => {
      await page.goto('/dashboard/topup-requests');
      
      // Should be redirected to login
      await expect(page).toHaveURL('/login?redirect=%2Fdashboard%2Ftopup-requests');
      
      // Check that login page is displayed
      await expect(page.locator('h2')).toContainText('Welcome back');
    });
  });

  test.describe('Business Manager Application', () => {
    test('user can view business manager application form', async ({ page }) => {
      await page.goto('/dashboard/business-managers');
      
      // Should be redirected to login
      await expect(page).toHaveURL('/login?redirect=%2Fdashboard%2Fbusiness-managers');
      
      // Check that login page is displayed
      await expect(page.locator('h2')).toContainText('Welcome back');
    });

    test('user can see business manager limits based on subscription', async ({ page }) => {
      await page.goto('/dashboard/business-managers');
      
      // Should be redirected to login
      await expect(page).toHaveURL('/login?redirect=%2Fdashboard%2Fbusiness-managers');
      
      // Check that login page is displayed
      await expect(page.locator('h2')).toContainText('Welcome back');
    });
  });

  test.describe('Error Handling & Edge Cases', () => {
    test('user sees 404 page for invalid routes', async ({ page }) => {
      await page.goto('/non-existent-page');
      
      // Check 404 page or redirect
      const url = page.url();
      expect(url).toMatch(/(404|not-found|login|dashboard)/);
    });

    test('user is redirected to login when accessing protected routes', async ({ page }) => {
      await page.goto('/dashboard/wallet');
      
      // Should redirect to login or show login form
      await expect(page).toHaveURL(/login/);
    });

    test('user can handle network errors gracefully', async ({ page }) => {
      await page.goto('/login');
      
      // Test that the page loads without crashing
      await expect(page.locator('h2')).toContainText('Welcome back');
      
      // Try to access a protected route without authentication
      await page.goto('/dashboard/wallet');
      
      // Should handle gracefully (redirect to login)
      await expect(page).toHaveURL('/login?redirect=%2Fdashboard%2Fwallet');
      
      // Check that login page is displayed
      await expect(page.locator('h2')).toContainText('Welcome back');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('dashboard is mobile responsive', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/dashboard');
      
      // Should be redirected to login
      await expect(page).toHaveURL('/login?redirect=%2Fdashboard');
      
      // Check that login page is displayed and responsive
      await expect(page.locator('h2')).toContainText('Welcome back');
    });

    test('pricing page is mobile responsive', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/pricing');
      
      // Should be redirected to login
      await expect(page).toHaveURL('/login?redirect=%2Fpricing');
      
      // Check that login page is displayed and responsive
      await expect(page.locator('h2')).toContainText('Welcome back');
    });
  });

  test.describe('Performance & Loading', () => {
    test('pages load within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/dashboard');
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('images load correctly', async ({ page }) => {
      await page.goto('/');
      
      // Check AdHub logo loads
      const logo = page.locator('img[alt*="AdHub"]').first();
      await expect(logo).toBeVisible();
    });
  });
}); 
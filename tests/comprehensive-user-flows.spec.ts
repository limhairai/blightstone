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
    await this.page.fill('[data-testid="email"]', email);
    await this.page.fill('[data-testid="password"]', password);
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('/dashboard');
  }

  async register(email: string = TEST_USER.email, password: string = TEST_USER.password, name: string = TEST_USER.name) {
    await this.page.goto('/register');
    await this.page.fill('[data-testid="name"]', name);
    await this.page.fill('[data-testid="email"]', email);
    await this.page.fill('[data-testid="password"]', password);
    await this.page.fill('[data-testid="confirm-password"]', password);
    await this.page.click('[data-testid="register-button"]');
    await this.page.waitForURL('/dashboard');
  }

  async createOrganization(name: string = TEST_ORGANIZATION.name, description: string = TEST_ORGANIZATION.description) {
    await this.page.click('[data-testid="create-organization-button"]');
    await this.page.fill('[data-testid="organization-name"]', name);
    await this.page.fill('[data-testid="organization-description"]', description);
    await this.page.click('[data-testid="create-organization-submit"]');
    await this.page.waitForSelector('[data-testid="organization-created"]');
  }

  async navigateToWallet() {
    await this.page.click('[data-testid="wallet-nav"]');
    await this.page.waitForURL('/dashboard/wallet');
  }

  async createTopupRequest(amount: number, paymentMethod: string = 'crypto') {
    await this.navigateToWallet();
    await this.page.fill('[data-testid="topup-amount"]', amount.toString());
    await this.page.click(`[data-testid="payment-method-${paymentMethod}"]`);
    await this.page.click('[data-testid="submit-topup"]');
    await this.page.waitForSelector('[data-testid="topup-success"]');
  }

  async waitForBalance(expectedBalance: number, timeout: number = 30000) {
    await this.page.waitForFunction(
      (balance) => {
        const balanceElement = document.querySelector('[data-testid="wallet-balance"]');
        return balanceElement?.textContent?.includes(balance.toString());
      },
      expectedBalance,
      { timeout }
    );
  }
}

test.describe('Authentication Flows', () => {
  test('should register new user successfully', async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    const uniqueEmail = `test-${Date.now()}@example.com`;
    
    await helper.register(uniqueEmail, TEST_USER.password, TEST_USER.name);
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should show welcome message
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome');
    
    // Should show user profile
    await expect(page.locator('[data-testid="user-profile"]')).toContainText(TEST_USER.name);
  });

  test('should login existing user successfully', async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    
    await helper.login();
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should show dashboard content
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'invalid@example.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    
    // Should stay on login page
    await expect(page).toHaveURL('/login');
  });

  test('should logout user successfully', async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    
    await helper.login();
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Should be redirected to login
    await expect(page).toHaveURL('/login');
    
    // Should not be able to access dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Organization Management', () => {
  test.beforeEach(async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    await helper.login();
  });

  test('should create new organization', async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    const uniqueName = `Test Org ${Date.now()}`;
    
    await helper.createOrganization(uniqueName, 'Test organization description');
    
    // Should show organization in list
    await expect(page.locator('[data-testid="organization-list"]')).toContainText(uniqueName);
    
    // Should set as current organization
    await expect(page.locator('[data-testid="current-organization"]')).toContainText(uniqueName);
  });

  test('should switch between organizations', async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    
    // Create two organizations
    await helper.createOrganization('Org 1', 'First organization');
    await helper.createOrganization('Org 2', 'Second organization');
    
    // Switch to first organization
    await page.click('[data-testid="organization-switcher"]');
    await page.click('[data-testid="select-org-1"]');
    
    await expect(page.locator('[data-testid="current-organization"]')).toContainText('Org 1');
    
    // Switch to second organization
    await page.click('[data-testid="organization-switcher"]');
    await page.click('[data-testid="select-org-2"]');
    
    await expect(page.locator('[data-testid="current-organization"]')).toContainText('Org 2');
  });

  test('should update organization settings', async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    
    await helper.createOrganization();
    
    // Navigate to organization settings
    await page.click('[data-testid="organization-settings"]');
    
    // Update organization name
    const newName = `Updated Org ${Date.now()}`;
    await page.fill('[data-testid="organization-name"]', newName);
    await page.click('[data-testid="save-organization"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Organization updated');
    
    // Should reflect new name
    await expect(page.locator('[data-testid="current-organization"]')).toContainText(newName);
  });
});

test.describe('Wallet Management', () => {
  test.beforeEach(async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    await helper.login();
    await helper.createOrganization();
  });

  test('should display wallet balance', async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    
    await helper.navigateToWallet();
    
    // Should show balance section
    await expect(page.locator('[data-testid="wallet-balance"]')).toBeVisible();
    
    // Should show balance amount
    await expect(page.locator('[data-testid="balance-amount"]')).toContainText('$');
    
    // Should show available balance
    await expect(page.locator('[data-testid="available-balance"]')).toBeVisible();
  });

  test('should create crypto topup request', async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    
    await helper.navigateToWallet();
    
    // Fill topup form
    await page.fill('[data-testid="topup-amount"]', '500');
    await page.click('[data-testid="payment-method-crypto"]');
    await page.click('[data-testid="submit-topup"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="topup-success"]')).toContainText('Topup request submitted');
    
    // Should show request in history
    await expect(page.locator('[data-testid="topup-history"]')).toContainText('$500.00');
    await expect(page.locator('[data-testid="topup-history"]')).toContainText('Crypto');
    await expect(page.locator('[data-testid="topup-history"]')).toContainText('Pending');
  });

  test('should validate topup amount limits', async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    
    await helper.navigateToWallet();
    
    // Test minimum amount validation
    await page.fill('[data-testid="topup-amount"]', '5');
    await page.click('[data-testid="payment-method-crypto"]');
    await page.click('[data-testid="submit-topup"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Minimum amount');
    
    // Test maximum amount validation (for starter plan)
    await page.fill('[data-testid="topup-amount"]', '10000');
    await page.click('[data-testid="submit-topup"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('exceeds limit');
  });

  test('should filter topup requests by status', async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    
    // Create multiple topup requests
    await helper.createTopupRequest(100, 'crypto');
    await helper.createTopupRequest(200, 'bank_transfer');
    
    await helper.navigateToWallet();
    
    // Filter by pending status
    await page.click('[data-testid="filter-pending"]');
    
    // Should show only pending requests
    await expect(page.locator('[data-testid="topup-history"] [data-status="pending"]')).toHaveCount(2);
    
    // Clear filter
    await page.click('[data-testid="filter-all"]');
    
    // Should show all requests
    await expect(page.locator('[data-testid="topup-history"] tr')).toHaveCount(2);
  });

  test('should show monthly topup usage', async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    
    await helper.createTopupRequest(1000, 'crypto');
    await helper.createTopupRequest(2000, 'crypto');
    
    await helper.navigateToWallet();
    
    // Should show monthly usage
    await expect(page.locator('[data-testid="monthly-usage"]')).toContainText('$3,000.00');
    
    // Should show remaining limit
    await expect(page.locator('[data-testid="remaining-limit"]')).toContainText('$3,000.00');
  });
});

test.describe('Asset Management', () => {
  test.beforeEach(async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    await helper.login();
    await helper.createOrganization();
  });

  test('should display assets page', async ({ page }) => {
    await page.click('[data-testid="assets-nav"]');
    await page.waitForURL('/dashboard/assets');
    
    // Should show assets table
    await expect(page.locator('[data-testid="assets-table"]')).toBeVisible();
    
    // Should show filter options
    await expect(page.locator('[data-testid="asset-filters"]')).toBeVisible();
  });

  test('should filter assets by type', async ({ page }) => {
    await page.click('[data-testid="assets-nav"]');
    
    // Filter by business managers
    await page.click('[data-testid="filter-business-managers"]');
    
    // Should show only business manager assets
    await expect(page.locator('[data-testid="asset-type-business_manager"]')).toHaveCount(1);
    
    // Filter by ad accounts
    await page.click('[data-testid="filter-ad-accounts"]');
    
    // Should show only ad account assets
    await expect(page.locator('[data-testid="asset-type-ad_account"]')).toHaveCount(1);
  });

  test('should bind new asset', async ({ page }) => {
    await page.click('[data-testid="assets-nav"]');
    
    // Click bind asset button
    await page.click('[data-testid="bind-asset-button"]');
    
    // Fill asset details
    await page.fill('[data-testid="asset-name"]', 'Test Business Manager');
    await page.fill('[data-testid="asset-id"]', 'bm-123456');
    await page.selectOption('[data-testid="asset-type"]', 'business_manager');
    
    // Submit binding
    await page.click('[data-testid="submit-binding"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="binding-success"]')).toContainText('Asset bound successfully');
    
    // Should appear in assets list
    await expect(page.locator('[data-testid="assets-table"]')).toContainText('Test Business Manager');
  });
});

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    await helper.login();
    await helper.createOrganization();
  });

  test('should navigate between dashboard sections', async ({ page }) => {
    // Test navigation to different sections
    const sections = [
      { nav: 'overview-nav', url: '/dashboard', title: 'Overview' },
      { nav: 'assets-nav', url: '/dashboard/assets', title: 'Assets' },
      { nav: 'wallet-nav', url: '/dashboard/wallet', title: 'Wallet' },
      { nav: 'topup-requests-nav', url: '/dashboard/topup-requests', title: 'Topup Requests' },
      { nav: 'settings-nav', url: '/dashboard/settings', title: 'Settings' }
    ];

    for (const section of sections) {
      await page.click(`[data-testid="${section.nav}"]`);
      await expect(page).toHaveURL(section.url);
      await expect(page.locator('[data-testid="page-title"]')).toContainText(section.title);
    }
  });

  test('should show breadcrumb navigation', async ({ page }) => {
    await page.click('[data-testid="assets-nav"]');
    
    // Should show breadcrumb
    await expect(page.locator('[data-testid="breadcrumb"]')).toContainText('Dashboard');
    await expect(page.locator('[data-testid="breadcrumb"]')).toContainText('Assets');
    
    // Click breadcrumb to navigate back
    await page.click('[data-testid="breadcrumb-dashboard"]');
    await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    await helper.login();
    await helper.createOrganization();
    
    // Simulate network failure
    await page.route('**/api/wallet/topup', route => route.abort());
    
    await helper.navigateToWallet();
    
    // Try to create topup request
    await page.fill('[data-testid="topup-amount"]', '500');
    await page.click('[data-testid="payment-method-crypto"]');
    await page.click('[data-testid="submit-topup"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Network error');
    
    // Should not show success message
    await expect(page.locator('[data-testid="topup-success"]')).not.toBeVisible();
  });

  test('should handle session expiration', async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    await helper.login();
    
    // Simulate session expiration
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 401,
        body: JSON.stringify({ message: 'Unauthorized' })
      });
    });
    
    // Try to navigate to protected page
    await page.click('[data-testid="wallet-nav"]');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    
    // Should show session expired message
    await expect(page.locator('[data-testid="session-expired"]')).toContainText('Session expired');
  });

  test('should handle API validation errors', async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    await helper.login();
    await helper.createOrganization();
    
    // Mock validation error response
    await page.route('**/api/wallet/topup', route => {
      route.fulfill({
        status: 422,
        body: JSON.stringify({
          detail: [
            {
              loc: ['body', 'amount'],
              msg: 'Amount must be greater than 0',
              type: 'value_error'
            }
          ]
        })
      });
    });
    
    await helper.navigateToWallet();
    
    // Submit invalid form
    await page.fill('[data-testid="topup-amount"]', '0');
    await page.click('[data-testid="payment-method-crypto"]');
    await page.click('[data-testid="submit-topup"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('Amount must be greater than 0');
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    const helper = new AdHubTestHelper(page);
    await helper.login();
    await helper.createOrganization();
    
    // Should show mobile navigation
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    
    // Should hide desktop navigation
    await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();
    
    // Should be able to open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Should be able to navigate on mobile
    await page.click('[data-testid="mobile-wallet-nav"]');
    await expect(page).toHaveURL('/dashboard/wallet');
  });

  test('should work on tablet devices', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    
    const helper = new AdHubTestHelper(page);
    await helper.login();
    await helper.createOrganization();
    
    // Should show tablet-optimized layout
    await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
    
    // Should be able to create topup request on tablet
    await helper.navigateToWallet();
    await page.fill('[data-testid="topup-amount"]', '500');
    await page.click('[data-testid="payment-method-crypto"]');
    await page.click('[data-testid="submit-topup"]');
    
    await expect(page.locator('[data-testid="topup-success"]')).toContainText('Topup request submitted');
  });
});

test.describe('Performance', () => {
  test('should load dashboard quickly', async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    await helper.login();
    
    // Measure page load time
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Should show all critical elements
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    const helper = new AdHubTestHelper(page);
    await helper.login();
    await helper.createOrganization();
    
    // Mock large dataset
    await page.route('**/api/wallet/topup*', route => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        requestId: `req-${i}`,
        amount: 100 + i,
        status: i % 3 === 0 ? 'completed' : 'pending',
        paymentMethod: 'crypto',
        createdAt: new Date(Date.now() - i * 86400000).toISOString()
      }));
      
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          requests: largeDataset.slice(0, 20), // Paginated
          total: largeDataset.length,
          page: 1,
          limit: 20
        })
      });
    });
    
    await helper.navigateToWallet();
    
    // Should load efficiently with pagination
    await expect(page.locator('[data-testid="topup-history"] tr')).toHaveCount(20);
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    
    // Should show total count
    await expect(page.locator('[data-testid="total-count"]')).toContainText('1000');
  });
}); 
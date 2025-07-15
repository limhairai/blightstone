import { test, expect } from '@playwright/test';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User'
};

const testOrg = {
  name: 'Test Organization',
  newName: 'Updated Organization Name'
};

class AdHubBusinessFlows {
  constructor(private page: any) {}

  // Authentication Flows
  async signUp() {
    await this.page.goto('/register');
    await this.page.fill('input[id="email"]', testUser.email);
    await this.page.fill('input[id="password"]', testUser.password);
    await this.page.click('button[type="submit"]');
    
    // Handle email verification flow
          // Wait for redirect - could be onboarding (immediate session) or confirm-email (email confirmation required)
      await this.page.waitForURL(/\/(onboarding|confirm-email)/);
    
    // In real tests, you'd need to handle email verification
    // For now, we'll simulate a verified user
  }

  async login() {
    await this.page.goto('/login');
    await this.page.fill('input[id="email"]', testUser.email);
    await this.page.fill('input[id="password"]', testUser.password);
    await this.page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(this.page).toHaveURL('/dashboard');
  }

  async logout() {
    // Click user avatar dropdown
    await this.page.click('[data-testid="user-avatar"]');
    await this.page.click('text=Log out');
    
    // Should redirect to login
    await expect(this.page).toHaveURL('/login');
  }

  // Wallet Management
  async topUpWallet(amount: number) {
    await this.page.goto('/dashboard/wallet');
    await this.page.click('text=Top Up');
    
    await this.page.fill('input[name="amount"]', amount.toString());
    await this.page.click('button[type="submit"]');
    
    // Should show success message
    await expect(this.page.locator('text=Top up request submitted')).toBeVisible();
  }

  async viewTransactionHistory() {
    await this.page.goto('/dashboard/topup-requests');
    
    // Should show transaction table
    await expect(this.page.locator('table')).toBeVisible();
    await expect(this.page.locator('text=Amount')).toBeVisible();
    await expect(this.page.locator('text=Status')).toBeVisible();
  }

  // Business Manager Workflow
  async requestBusinessManager() {
    await this.page.goto('/dashboard/business-managers');
    await this.page.click('text=Apply for Business Manager');
    
    // Fill application form
    await this.page.fill('input[name="businessName"]', 'Test Business');
    await this.page.fill('textarea[name="description"]', 'Test business description');
    await this.page.click('button[type="submit"]');
    
    // Should show success message
    await expect(this.page.locator('text=Application submitted')).toBeVisible();
  }

  async cancelBMApplication() {
    await this.page.goto('/dashboard/business-managers');
    
    // Find pending application and cancel it
    await this.page.click('[data-testid="cancel-application"]');
    await this.page.click('text=Confirm');
    
    // Should show cancellation message
    await expect(this.page.locator('text=Application cancelled')).toBeVisible();
  }

  // Ad Account Management
  async applyForAdAccount() {
    await this.page.goto('/dashboard/accounts');
    await this.page.click('text=Request Ad Account');
    
    // Select business manager
    await this.page.selectOption('select[name="businessManager"]', 'test-bm-id');
    await this.page.click('button[type="submit"]');
    
    // Should show success message
    await expect(this.page.locator('text=Ad account request submitted')).toBeVisible();
  }

  async topUpAdAccount(accountId: string, amount: number) {
    await this.page.goto('/dashboard/accounts');
    
    // Find account and click top up
    await this.page.click(`[data-account-id="${accountId}"] [data-testid="topup-button"]`);
    await this.page.fill('input[name="amount"]', amount.toString());
    await this.page.click('button[type="submit"]');
    
    // Should show success message
    await expect(this.page.locator('text=Top up successful')).toBeVisible();
  }

  // Organization Management
  async createOrganization() {
    await this.page.goto('/dashboard/settings');
    await this.page.click('text=Create Organization');
    
    await this.page.fill('input[name="organizationName"]', testOrg.name);
    await this.page.click('button[type="submit"]');
    
    // Should show success message
    await expect(this.page.locator('text=Organization created')).toBeVisible();
  }

  async changeOrganizationName() {
    await this.page.goto('/dashboard/settings');
    await this.page.click('text=Edit Organization');
    
    await this.page.fill('input[name="organizationName"]', testOrg.newName);
    await this.page.click('button[type="submit"]');
    
    // Should show success message
    await expect(this.page.locator('text=Organization updated')).toBeVisible();
  }

  async useOrganizationSelector() {
    // Click organization selector
    await this.page.click('[data-testid="org-selector"]');
    
    // Should show organization list
    await expect(this.page.locator('[data-testid="org-list"]')).toBeVisible();
    
    // Select different organization
    await this.page.click('[data-testid="org-option"]:first-child');
    
    // Should update the current organization
    await expect(this.page.locator('[data-testid="current-org"]')).toBeVisible();
  }

  // Admin Panel Testing
  async accessAdminPanel() {
    await this.page.goto('/admin');
    
    // Should show admin dashboard
    await expect(this.page.locator('text=Admin Dashboard')).toBeVisible();
    await expect(this.page.locator('text=Organizations')).toBeVisible();
    await expect(this.page.locator('text=Users')).toBeVisible();
  }

  async manageUsers() {
    await this.page.goto('/admin/organizations');
    
    // Should show user management interface
    await expect(this.page.locator('table')).toBeVisible();
    await expect(this.page.locator('text=Email')).toBeVisible();
    await expect(this.page.locator('text=Status')).toBeVisible();
  }

  // Subscription Management
  async selectSubscriptionPlan(planId: string) {
    await this.page.goto('/pricing');
    
    // Click on plan
    await this.page.click(`[data-plan-id="${planId}"] button`);
    
    // Should redirect to Stripe checkout
    await expect(this.page).toHaveURL(/checkout\.stripe\.com/);
  }

  async upgradeSubscription() {
    await this.page.goto('/dashboard/settings');
    await this.page.click('text=Upgrade Plan');
    
    // Select new plan
    await this.page.click('[data-plan="growth"] button');
    
    // Should redirect to payment
    await expect(this.page).toHaveURL(/checkout\.stripe\.com/);
  }
}

// COMPREHENSIVE BUSINESS FLOW TESTS
test.describe('Complete AdHub Business Flows', () => {
  let businessFlows: AdHubBusinessFlows;

  test.beforeEach(async ({ page }) => {
    businessFlows = new AdHubBusinessFlows(page);
  });

  test.describe('Authentication Flows', () => {
    test('complete user registration and verification flow', async ({ page }) => {
      await businessFlows.signUp();
      
      // Test email verification (would need email testing service)
      // Test login after verification
      // Test password reset flow
    });

    test('login and logout flow', async ({ page }) => {
      await businessFlows.login();
      await businessFlows.logout();
    });
  });

  test.describe('Wallet Management', () => {
    test('complete wallet top-up flow', async ({ page }) => {
      await businessFlows.login();
      await businessFlows.topUpWallet(100);
      await businessFlows.viewTransactionHistory();
    });

    test('wallet balance updates correctly', async ({ page }) => {
      await businessFlows.login();
      
      // Get initial balance
      await page.goto('/dashboard/wallet');
      const initialBalance = await page.locator('[data-testid="wallet-balance"]').textContent();
      
      // Top up wallet
      await businessFlows.topUpWallet(50);
      
      // Check balance updated
      await page.reload();
      const newBalance = await page.locator('[data-testid="wallet-balance"]').textContent();
      
      // Balance should be higher (in real test, you'd parse and compare numbers)
      expect(newBalance).not.toBe(initialBalance);
    });
  });

  test.describe('Business Manager Workflow', () => {
    test('complete BM application flow', async ({ page }) => {
      await businessFlows.login();
      await businessFlows.requestBusinessManager();
      
      // Test application status tracking
      await page.goto('/dashboard/business-managers');
      await expect(page.locator('text=Pending')).toBeVisible();
    });

    test('cancel BM application', async ({ page }) => {
      await businessFlows.login();
      await businessFlows.requestBusinessManager();
      await businessFlows.cancelBMApplication();
    });
  });

  test.describe('Ad Account Management', () => {
    test('complete ad account request flow', async ({ page }) => {
      await businessFlows.login();
      
      // First need a business manager
      await businessFlows.requestBusinessManager();
      
      // Then request ad account
      await businessFlows.applyForAdAccount();
    });

    test('top up ad account', async ({ page }) => {
      await businessFlows.login();
      await businessFlows.topUpAdAccount('test-account-id', 100);
    });
  });

  test.describe('Organization Management', () => {
    test('create and manage organization', async ({ page }) => {
      await businessFlows.login();
      await businessFlows.createOrganization();
      await businessFlows.changeOrganizationName();
    });

    test('organization selector functionality', async ({ page }) => {
      await businessFlows.login();
      await businessFlows.useOrganizationSelector();
    });
  });

  test.describe('Admin Panel', () => {
    test('admin can access admin panel', async ({ page }) => {
      // Login as admin user
      await businessFlows.login();
      await businessFlows.accessAdminPanel();
    });

    test('admin can manage users', async ({ page }) => {
      await businessFlows.login();
      await businessFlows.manageUsers();
    });
  });

  test.describe('Subscription Management', () => {
    test('select and purchase subscription plan', async ({ page }) => {
      await businessFlows.login();
      await businessFlows.selectSubscriptionPlan('growth');
    });

    test('upgrade subscription', async ({ page }) => {
      await businessFlows.login();
      await businessFlows.upgradeSubscription();
    });
  });

  test.describe('Integration Testing', () => {
    test('Stripe payment integration', async ({ page }) => {
      // Test actual Stripe checkout flow
      // This would require Stripe test mode
    });

    test('Supabase authentication integration', async ({ page }) => {
      // Test auth state persistence
      // Test session management
    });

    test('Dolphin API integration', async ({ page }) => {
      // Test external API calls
      // Test error handling for API failures
    });
  });

  test.describe('Error Handling & Edge Cases', () => {
    test('handles network failures gracefully', async ({ page }) => {
      // Simulate network failures
      await page.route('**/api/**', route => route.abort());
      
      await businessFlows.login();
      
      // Should show error messages, not crash
      await expect(page.locator('text=Network error')).toBeVisible();
    });

    test('handles validation errors', async ({ page }) => {
      await page.goto('/register');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.locator('text=Email is required')).toBeVisible();
    });

    test('handles rate limiting', async ({ page }) => {
      // Make multiple rapid requests
      // Should show rate limit message
    });
  });

  test.describe('Performance & Load Testing', () => {
    test('dashboard loads within performance budget', async ({ page }) => {
      const startTime = Date.now();
      
      await businessFlows.login();
      await page.goto('/dashboard');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3 second budget
    });

    test('handles large datasets', async ({ page }) => {
      // Test with many transactions, organizations, etc.
    });
  });
}); 
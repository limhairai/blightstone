import { Page, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

export class TestHelpers {
  constructor(private page: Page) {}

  // Authentication helpers
  async loginAsUser(email: string = 'test@example.com', password: string = 'testpassword123') {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('/dashboard');
  }

  async loginAsAdmin(email: string = 'admin@example.com', password: string = 'adminpassword123') {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('/admin');
  }

  async logout() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForURL('/login');
  }

  // Application helpers
  async createApplication(data: {
    name: string;
    websiteUrl: string;
    requestType: 'new_business_manager' | 'additional_accounts';
    notes?: string;
  }) {
    await this.page.goto('/dashboard/applications/new');
    
    await this.page.fill('[data-testid="business-name-input"]', data.name);
    await this.page.fill('[data-testid="website-url-input"]', data.websiteUrl);
    await this.page.selectOption('[data-testid="request-type-select"]', data.requestType);
    
    if (data.notes) {
      await this.page.fill('[data-testid="client-notes-textarea"]', data.notes);
    }
    
    await this.page.click('[data-testid="submit-application-button"]');
    await expect(this.page.locator('[data-testid="success-message"]')).toBeVisible();
  }

  // Navigation helpers
  async navigateToSection(section: 'dashboard' | 'applications' | 'wallet' | 'subscription' | 'transactions') {
    await this.page.click(`[data-testid="${section}-nav"]`);
    await this.page.waitForURL(`/dashboard/${section === 'dashboard' ? '' : section}`);
  }

  async navigateToAdminSection(section: 'dashboard' | 'applications' | 'organizations' | 'analytics') {
    await this.page.click(`[data-testid="admin-${section}-nav"]`);
    await this.page.waitForURL(`/admin/${section === 'dashboard' ? '' : section}`);
  }

  // Wallet helpers
  async topUpWallet(amount: number) {
    await this.page.goto('/dashboard/wallet');
    await this.page.click('[data-testid="top-up-button"]');
    await this.page.fill('[data-testid="amount-input"]', amount.toString());
    await this.page.click('[data-testid="proceed-payment-button"]');
    
    // Return to complete payment flow in individual tests
    return this.page.locator('[data-testid="payment-form"]');
  }

  // Subscription helpers
  async upgradeToPlan(plan: 'growth' | 'scale' | 'enterprise') {
    await this.page.goto('/dashboard/subscription');
    await this.page.click(`[data-testid="upgrade-to-${plan}"]`);
    await this.page.click('[data-testid="confirm-upgrade-button"]');
    await expect(this.page.locator('[data-testid="upgrade-success"]')).toBeVisible();
  }

  // Admin helpers
  async updateApplicationStatus(applicationId: string, status: 'approved' | 'rejected' | 'processing') {
    await this.page.goto('/admin/applications');
    const row = this.page.locator(`[data-testid="application-row-${applicationId}"]`);
    await row.locator('[data-testid="status-select"]').selectOption(status);
    await this.page.click('[data-testid="update-status-button"]');
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
  }

  // Verification helpers
  async verifyElementVisible(selector: string, timeout: number = 10000) {
    await expect(this.page.locator(selector)).toBeVisible({ timeout });
  }

  async verifyElementContainsText(selector: string, text: string) {
    await expect(this.page.locator(selector)).toContainText(text);
  }

  async verifyCurrentUrl(expectedUrl: string) {
    await expect(this.page).toHaveURL(expectedUrl);
  }

  // Wait helpers
  async waitForLoadingToFinish() {
    await this.page.waitForSelector('[data-testid="loading-spinner"]', { state: 'detached' });
  }

  async waitForToastMessage(message?: string) {
    const toast = this.page.locator('[data-testid="toast"]');
    await expect(toast).toBeVisible();
    
    if (message) {
      await expect(toast).toContainText(message);
    }
    
    return toast;
  }

  // Database helpers (for test data management)
  async cleanupTestData() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) return;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
      // Delete test data
      await supabase.from('organizations').delete().ilike('name', '%test%');
      await supabase.from('application').delete().ilike('name', '%test%');
    } catch (error) {
      console.warn('Error cleaning up test data:', error);
    }
  }
}

// Form helpers
export const fillForm = async (page: Page, formData: Record<string, string>) => {
  for (const [field, value] of Object.entries(formData)) {
    await page.fill(`[data-testid="${field}"]`, value);
  }
};

// Table helpers
export const getTableRowCount = async (page: Page, tableSelector: string) => {
  const rows = page.locator(`${tableSelector} [data-testid*="row"]`);
  return await rows.count();
};

// Mock API responses for testing
export const mockApiResponse = async (page: Page, endpoint: string, response: any) => {
  await page.route(`**/api/${endpoint}`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
};

// Screenshot helpers
export const takeScreenshot = async (page: Page, name: string) => {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
};

// Environment helpers
export const isProduction = () => process.env.NODE_ENV === 'production';
export const isStaging = () => process.env.NODE_ENV === 'staging';
export const isDevelopment = () => process.env.NODE_ENV === 'development';

// Test data generators
export const generateTestData = {
  user: (override?: Partial<any>) => ({
    email: `test-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Test User',
    ...override,
  }),
  
  organization: (override?: Partial<any>) => ({
    name: `Test Organization ${Date.now()}`,
    subscriptionTier: 'starter',
    status: 'active',
    ...override,
  }),
  
  application: (override?: Partial<any>) => ({
    name: `Test Application ${Date.now()}`,
    websiteUrl: 'https://example-test.com',
    requestType: 'new_business_manager',
    notes: 'Test application for E2E testing',
    ...override,
  }),
}; 
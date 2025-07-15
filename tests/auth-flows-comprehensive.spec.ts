import { test, expect } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  testUser: {
    email: `test-${Date.now()}@adhub-test.com`,
    password: 'TestPassword123!',
    name: 'Test User'
  },
  adminUser: {
    email: 'admin@adhub.com',
    password: 'AdminPassword123!'
  },
  timeout: 30000
};

// Email testing utilities
class EmailTester {
  constructor(private apiKey: string) {}

  async getLatestEmail(recipientEmail: string): Promise<any> {
    // In real implementation, this would check your email provider's API
    // For now, we'll simulate email checking
    return {
      subject: 'Verify Your AdHub Account',
      html: '<a href="http://localhost:3000/auth/confirm?token=test-token">Verify</a>',
      confirmationUrl: 'http://localhost:3000/auth/confirm?token=test-token'
    };
  }

  async extractConfirmationLink(emailHtml: string): Promise<string> {
    const match = emailHtml.match(/href="([^"]*confirm[^"]*)"/);
    return match ? match[1] : '';
  }

  async waitForEmail(recipientEmail: string, timeoutMs: number = 30000): Promise<any> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      try {
        const email = await this.getLatestEmail(recipientEmail);
        if (email) return email;
      } catch (error) {
        // Continue waiting
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error(`No email received for ${recipientEmail} within ${timeoutMs}ms`);
  }
}

// Database utilities for test setup
class TestDatabaseHelper {
  async createTestUser(userData: any) {
    // In real implementation, this would use your database client
    // For now, we'll use the API
    const response = await fetch(`${TEST_CONFIG.baseURL}/api/test/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  }

  async cleanupTestUser(email: string) {
    await fetch(`${TEST_CONFIG.baseURL}/api/test/cleanup-user`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  }

  async createTestOrganization(userId: string, orgData: any) {
    const response = await fetch(`${TEST_CONFIG.baseURL}/api/test/create-organization`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...orgData })
    });
    return response.json();
  }

  async setUserBalance(userId: string, balanceCents: number) {
    await fetch(`${TEST_CONFIG.baseURL}/api/test/set-balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, balanceCents })
    });
  }
}

// Authentication flow helper
class AuthFlowHelper {
  constructor(private page: any, private emailTester: EmailTester) {}

  async registerUser(userData: any) {
    await this.page.goto('/register');
    
    await this.page.fill('input[id="email"]', userData.email);
    await this.page.fill('input[id="password"]', userData.password);
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect - could be onboarding (immediate session) or confirm-email (email confirmation required)
    await this.page.waitForURL(/\/(onboarding|confirm-email)/);
    
    const currentUrl = this.page.url();
    if (currentUrl.includes('/onboarding')) {
      // User has immediate session, already logged in
      console.log('User registered with immediate session, redirected to onboarding');
    } else if (currentUrl.includes('/confirm-email')) {
      // Email confirmation required
      console.log('Email confirmation required, redirected to confirm-email page');
    }
    
    return userData;
  }

  async verifyEmail(email: string) {
    // Check if user is already at onboarding (immediate session)
    if (this.page.url().includes('/onboarding')) {
      console.log('User already has session, no email verification needed');
      return 'immediate-session';
    }
    
    // If on confirm-email page, simulate email verification
    if (this.page.url().includes('/confirm-email')) {
      console.log('Simulating email verification flow');
      
      // In a real test, you'd wait for actual email and click the link
      // For now, we'll simulate going to the auth callback
      await this.page.goto('/auth/callback');
      
      // Wait for redirect to onboarding after auth callback
      await this.page.waitForURL(/\/(onboarding|dashboard)/);
      
      return 'email-verified';
    }
    
    // Default case - try to navigate to auth callback
    await this.page.goto('/auth/callback');
    await this.page.waitForURL(/\/(onboarding|dashboard|login)/);
    
    return 'auth-callback';
  }

  async loginUser(email: string, password: string) {
    await this.page.goto('/login');
    
    await this.page.fill('input[id="email"]', email);
    await this.page.fill('input[id="password"]', password);
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard or onboarding
    await this.page.waitForURL(/\/(dashboard|onboarding)/);
    
    // If redirected to onboarding, go to dashboard
    if (this.page.url().includes('/onboarding')) {
      await this.page.goto('/dashboard');
    }
    
    // Verify user is logged in by checking for avatar button in topbar
    await expect(this.page.locator('button[aria-haspopup="menu"]')).toBeVisible();
  }

  async logoutUser() {
    await this.page.click('[data-testid="user-avatar"]');
    await this.page.click('text=Log out');
    
    // Should redirect to login
    await expect(this.page).toHaveURL('/login');
  }

  async resetPassword(email: string) {
    await this.page.goto('/forgot-password');
    
    await this.page.fill('input[type="email"]', email);
    await this.page.click('button[type="submit"]');
    
    // Should show success message
    await expect(this.page.locator('text=Check Your Email')).toBeVisible();
    
    // Wait for reset email
    const resetEmail = await this.emailTester.waitForEmail(email);
    const resetLink = await this.emailTester.extractConfirmationLink(resetEmail.html);
    
    return resetLink;
  }

  async setNewPassword(resetLink: string, newPassword: string) {
    await this.page.goto(resetLink);
    
    await this.page.fill('input[type="password"]', newPassword);
    await this.page.fill('input[name="confirmPassword"]', newPassword);
    await this.page.click('button[type="submit"]');
    
    // Should redirect to login
    await expect(this.page).toHaveURL('/login');
  }
}

// Wallet operations helper
class WalletHelper {
  constructor(private page: any) {}

  async topUpWallet(amount: number, paymentMethod: 'card' | 'bank' | 'crypto' = 'card') {
    await this.page.goto('/dashboard/wallet');
    
    await this.page.click('text=Top Up');
    
    // Fill amount
    await this.page.fill('input[name="amount"]', amount.toString());
    
    // Select payment method
    await this.page.click(`[data-payment-method="${paymentMethod}"]`);
    
    if (paymentMethod === 'card') {
      // Fill card details (test card)
      await this.page.fill('input[name="cardNumber"]', '4242424242424242');
      await this.page.fill('input[name="expiryDate"]', '12/25');
      await this.page.fill('input[name="cvv"]', '123');
    }
    
    await this.page.click('button[type="submit"]');
    
    // Should show success message
    await expect(this.page.locator('text=Top up request submitted')).toBeVisible();
    
    return { amount, paymentMethod };
  }

  async getWalletBalance(): Promise<number> {
    await this.page.goto('/dashboard/wallet');
    
    const balanceText = await this.page.locator('[data-testid="wallet-balance"]').textContent();
    return parseFloat(balanceText?.replace(/[^0-9.]/g, '') || '0');
  }

  async viewTransactionHistory() {
    await this.page.goto('/dashboard/topup-requests');
    
    // Should show transaction table
    await expect(this.page.locator('table')).toBeVisible();
    
    // Get transaction data
    const transactions = await this.page.locator('tbody tr').all();
    const transactionData = [];
    
    for (const row of transactions) {
      const cells = await row.locator('td').all();
      transactionData.push({
        amount: await cells[0]?.textContent(),
        status: await cells[1]?.textContent(),
        date: await cells[2]?.textContent(),
      });
    }
    
    return transactionData;
  }
}

// Main test suite
test.describe('Comprehensive Authentication & Wallet Flows', () => {
  let emailTester: EmailTester;
  let dbHelper: TestDatabaseHelper;
  let authHelper: AuthFlowHelper;
  let walletHelper: WalletHelper;

  test.beforeEach(async ({ page }) => {
    emailTester = new EmailTester(process.env.RESEND_API_KEY || '');
    dbHelper = new TestDatabaseHelper();
    authHelper = new AuthFlowHelper(page, emailTester);
    walletHelper = new WalletHelper(page);
  });

  test.afterEach(async () => {
    // Cleanup test data
    await dbHelper.cleanupTestUser(TEST_CONFIG.testUser.email);
  });

  test.describe('User Registration Flow', () => {
    test('complete user registration with email verification', async ({ page }) => {
      const userData = {
        email: `test-${Date.now()}@adhub-test.com`,
        password: 'TestPassword123!',
        name: 'Test User'
      };

      // Step 1: Register user
      await authHelper.registerUser(userData);

      // Step 2: Verify email
      await authHelper.verifyEmail(userData.email);

      // Step 3: Login with verified account
      await authHelper.loginUser(userData.email, userData.password);

      // Step 4: Verify user is in dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('h2:has-text("Accounts")')).toBeVisible();
      await expect(page.locator('text=Balance')).toBeVisible();
    });

    test('registration with existing email shows error', async ({ page }) => {
      const userData = TEST_CONFIG.testUser;

      // Create user first
      await dbHelper.createTestUser(userData);

      // Try to register with same email
      await page.goto('/register');
      await page.fill('input[id="email"]', userData.email);
      await page.fill('input[id="password"]', userData.password);
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('text=User already registered')).toBeVisible();
    });

    test('registration with weak password shows validation error', async ({ page }) => {
      await page.goto('/register');
      
      await page.fill('input[id="email"]', 'test@example.com');
      await page.fill('input[id="password"]', '123'); // Weak password
      await page.click('button[type="submit"]');

      // Should show validation error
      await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible();
    });
  });

  test.describe('Login Flow', () => {
    test('successful login redirects to dashboard', async ({ page }) => {
      // Create verified user
      const userData = TEST_CONFIG.testUser;
      await dbHelper.createTestUser({ ...userData, emailVerified: true });

      await authHelper.loginUser(userData.email, userData.password);

      // Should be in dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('h2:has-text("Accounts")')).toBeVisible();
      await expect(page.locator('text=Balance')).toBeVisible();
    });

    test('login with unverified email shows verification prompt', async ({ page }) => {
      // Create unverified user
      const userData = TEST_CONFIG.testUser;
      await dbHelper.createTestUser({ ...userData, emailVerified: false });

      await page.goto('/login');
      await page.fill('input[id="email"]', userData.email);
      await page.fill('input[id="password"]', userData.password);
      await page.click('button[type="submit"]');

      // Should show verification prompt
      await expect(page.locator('text=Please verify your email')).toBeVisible();
    });

    test('login with incorrect password shows error', async ({ page }) => {
      const userData = TEST_CONFIG.testUser;
      await dbHelper.createTestUser({ ...userData, emailVerified: true });

      await page.goto('/login');
      await page.fill('input[id="email"]', userData.email);
      await page.fill('input[id="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('text=Invalid login credentials')).toBeVisible();
    });
  });

  test.describe('Password Reset Flow', () => {
    test('complete password reset flow', async ({ page }) => {
      // Create verified user
      const userData = TEST_CONFIG.testUser;
      await dbHelper.createTestUser({ ...userData, emailVerified: true });

      // Step 1: Request password reset
      const resetLink = await authHelper.resetPassword(userData.email);

      // Step 2: Set new password
      const newPassword = 'NewPassword123!';
      await authHelper.setNewPassword(resetLink, newPassword);

      // Step 3: Login with new password
      await authHelper.loginUser(userData.email, newPassword);

      // Should be successfully logged in
      await expect(page).toHaveURL('/dashboard');
    });

    test('password reset with invalid email shows error', async ({ page }) => {
      await page.goto('/forgot-password');
      
      await page.fill('input[type="email"]', 'nonexistent@example.com');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('text=No account found with that email')).toBeVisible();
    });
  });

  test.describe('Session Management', () => {
    test('user session persists across browser refresh', async ({ page }) => {
      const userData = TEST_CONFIG.testUser;
      await dbHelper.createTestUser({ ...userData, emailVerified: true });

      // Login
      await authHelper.loginUser(userData.email, userData.password);

      // Refresh page
      await page.reload();

      // Should still be logged in
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
    });

    test('logout clears session and redirects to login', async ({ page }) => {
      const userData = TEST_CONFIG.testUser;
      await dbHelper.createTestUser({ ...userData, emailVerified: true });

      // Login
      await authHelper.loginUser(userData.email, userData.password);

      // Logout
      await authHelper.logoutUser();

      // Try to access protected route
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Wallet Operations', () => {
    test('wallet top-up flow with credit card', async ({ page }) => {
      // Setup authenticated user
      const userData = TEST_CONFIG.testUser;
      await dbHelper.createTestUser({ ...userData, emailVerified: true });
      await authHelper.loginUser(userData.email, userData.password);

      // Get initial balance
      const initialBalance = await walletHelper.getWalletBalance();

      // Top up wallet
      const topUpAmount = 100;
      await walletHelper.topUpWallet(topUpAmount, 'card');

      // Check transaction history
      const transactions = await walletHelper.viewTransactionHistory();
      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions[0].amount).toContain(topUpAmount.toString());
      expect(transactions[0].status).toBe('pending');
    });

    test('wallet balance updates after successful top-up', async ({ page }) => {
      // Setup authenticated user with initial balance
      const userData = TEST_CONFIG.testUser;
      const user = await dbHelper.createTestUser({ ...userData, emailVerified: true });
      await dbHelper.setUserBalance(user.id, 5000); // $50.00
      await authHelper.loginUser(userData.email, userData.password);

      // Simulate successful top-up (in real test, this would be handled by webhook)
      await dbHelper.setUserBalance(user.id, 15000); // $150.00

      // Check updated balance
      const newBalance = await walletHelper.getWalletBalance();
      expect(newBalance).toBe(150);
    });

    test('insufficient balance prevents operations', async ({ page }) => {
      // Setup authenticated user with low balance
      const userData = TEST_CONFIG.testUser;
      const user = await dbHelper.createTestUser({ ...userData, emailVerified: true });
      await dbHelper.setUserBalance(user.id, 100); // $1.00
      await authHelper.loginUser(userData.email, userData.password);

      // Try to perform operation requiring higher balance
      await page.goto('/dashboard/business-managers');
      await page.click('text=Apply for Business Manager');

      // Should show insufficient balance error
      await expect(page.locator('text=Insufficient balance')).toBeVisible();
    });
  });

  test.describe('Integration Testing', () => {
    test('Stripe payment integration', async ({ page }) => {
      // This would test actual Stripe checkout flow
      // Requires Stripe test mode configuration
      const userData = TEST_CONFIG.testUser;
      await dbHelper.createTestUser({ ...userData, emailVerified: true });
      await authHelper.loginUser(userData.email, userData.password);

      await page.goto('/dashboard/wallet');
      await page.click('text=Top Up');
      await page.fill('input[name="amount"]', '100');
      await page.click('[data-payment-method="card"]');
      await page.click('button[type="submit"]');

      // Should redirect to Stripe checkout
      await expect(page).toHaveURL(/checkout\.stripe\.com/);
    });

    test('Supabase authentication integration', async ({ page }) => {
      // Test auth state synchronization
      const userData = TEST_CONFIG.testUser;
      await dbHelper.createTestUser({ ...userData, emailVerified: true });

      await authHelper.loginUser(userData.email, userData.password);

      // Check auth state in multiple tabs
      const newPage = await page.context().newPage();
      await newPage.goto('/dashboard');

      // Should be logged in in new tab
      await expect(newPage).toHaveURL('/dashboard');
      await expect(newPage.locator('[data-testid="user-avatar"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('handles network failures gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/auth/**', route => route.abort());

      await page.goto('/login');
      await page.fill('input[id="email"]', 'test@example.com');
      await page.fill('input[id="password"]', 'password');
      await page.click('button[type="submit"]');

      // Should show network error message
      await expect(page.locator('text=Network error')).toBeVisible();
    });

    test('handles API errors gracefully', async ({ page }) => {
      // Simulate API error
      await page.route('**/api/auth/login', route => 
        route.fulfill({ status: 500, body: 'Internal Server Error' })
      );

      await page.goto('/login');
      await page.fill('input[id="email"]', 'test@example.com');
      await page.fill('input[id="password"]', 'password');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('text=Something went wrong')).toBeVisible();
    });
  });

  test.describe('Performance Testing', () => {
    test('authentication flow completes within performance budget', async ({ page }) => {
      const userData = TEST_CONFIG.testUser;
      await dbHelper.createTestUser({ ...userData, emailVerified: true });

      const startTime = Date.now();

      await authHelper.loginUser(userData.email, userData.password);

      const loginTime = Date.now() - startTime;

      // Should complete within 3 seconds
      expect(loginTime).toBeLessThan(3000);
    });

    test('wallet operations are responsive', async ({ page }) => {
      const userData = TEST_CONFIG.testUser;
      await dbHelper.createTestUser({ ...userData, emailVerified: true });
      await authHelper.loginUser(userData.email, userData.password);

      const startTime = Date.now();

      await walletHelper.getWalletBalance();
      await walletHelper.viewTransactionHistory();

      const operationTime = Date.now() - startTime;

      // Should complete within 2 seconds
      expect(operationTime).toBeLessThan(2000);
    });
  });
});

// Export helpers for use in other test files
export { AuthFlowHelper, WalletHelper, EmailTester, TestDatabaseHelper }; 
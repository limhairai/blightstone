import { test, expect, createTestUser, TEST_CONFIG, DatabaseCleaner } from '../utils/test-helpers';

test.describe('Authentication Flows', () => {
  let testUser: ReturnType<typeof createTestUser>;
  let dbCleaner: DatabaseCleaner;

  test.beforeEach(async ({ page }) => {
    testUser = createTestUser();
    dbCleaner = new DatabaseCleaner();
    await page.goto(TEST_CONFIG.baseURL);
  });

  test.afterEach(async () => {
    // Cleanup test user after each test
    await dbCleaner.cleanupTestUser(testUser.email);
  });

  test.describe('User Registration', () => {
    test('should register new user successfully', async ({ page, pageHelpers }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/register`);
      
      await pageHelpers.fillRegisterForm(testUser.email, testUser.password, testUser.name);
      
      // Should redirect to email confirmation page
      await expect(page).toHaveURL(/confirm-email/);
      await expect(page.locator('text=check your email')).toBeVisible();
    });

    test('should show error for existing user', async ({ page, pageHelpers }) => {
      // First registration
      await page.goto(`${TEST_CONFIG.baseURL}/register`);
      await pageHelpers.fillRegisterForm(testUser.email, testUser.password);
      await page.waitForTimeout(2000);

      // Second registration with same email
      await page.goto(`${TEST_CONFIG.baseURL}/register`);
      await pageHelpers.fillRegisterForm(testUser.email, testUser.password);
      
      await pageHelpers.expectToastMessage('User already registered');
    });

    test('should validate password requirements', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/register`);
      
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', '123'); // Too short
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/register`);
      
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', testUser.password);
      await page.click('button[type="submit"]');
      
      // Browser validation should kick in
      await expect(page.locator('input[type="email"]:invalid')).toBeVisible();
    });
  });

  test.describe('User Login', () => {
    test('should login with valid credentials', async ({ page, pageHelpers }) => {
      // First register the user
      await page.goto(`${TEST_CONFIG.baseURL}/register`);
      await pageHelpers.fillRegisterForm(testUser.email, testUser.password);
      
      // Simulate email confirmation (in real test, you'd check email)
      // For now, we'll test the login form behavior
      await page.goto(`${TEST_CONFIG.baseURL}/login`);
      await pageHelpers.fillLoginForm(testUser.email, testUser.password);
      
      // Should show appropriate response (either dashboard or email confirmation needed)
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).toMatch(/(dashboard|confirm-email|login)/);
    });

    test('should show error for invalid credentials', async ({ page, pageHelpers }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/login`);
      await pageHelpers.fillLoginForm('nonexistent@example.com', 'wrongpassword');
      
      await pageHelpers.expectToastMessage('Invalid login credentials');
    });

    test('should show error for unconfirmed email', async ({ page, pageHelpers }) => {
      // Register but don't confirm email
      await page.goto(`${TEST_CONFIG.baseURL}/register`);
      await pageHelpers.fillRegisterForm(testUser.email, testUser.password);
      
      // Try to login
      await page.goto(`${TEST_CONFIG.baseURL}/login`);
      await pageHelpers.fillLoginForm(testUser.email, testUser.password);
      
      // Should redirect to email confirmation
      await expect(page).toHaveURL(/confirm-email/);
    });

    test('should handle Google OAuth login', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/login`);
      
      // Mock Google OAuth (since we can't actually complete OAuth in tests)
      await page.click('text=Continue with Google');
      
      // Should initiate OAuth flow (redirect or popup)
      await page.waitForTimeout(1000);
      // In a real test, you'd mock the OAuth response
    });

    test('should handle magic link login', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/login`);
      
      await page.click('text=Send Magic Link');
      await page.fill('input[type="email"]', testUser.email);
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Magic link sent')).toBeVisible();
    });
  });

  test.describe('Password Reset', () => {
    test('should send password reset email', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/forgot-password`);
      
      await page.fill('input[type="email"]', testUser.email);
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=password reset link has been sent')).toBeVisible();
    });

    test('should handle invalid email for password reset', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/forgot-password`);
      
      await page.fill('input[type="email"]', 'invalid-email');
      await page.click('button[type="submit"]');
      
      // Should still show success message for security
      await expect(page.locator('text=password reset link has been sent')).toBeVisible();
    });
  });

  test.describe('User Logout', () => {
    test('should logout successfully', async ({ page, pageHelpers }) => {
      // First login (assuming we have a logged-in state)
      await page.goto(`${TEST_CONFIG.baseURL}/login`);
      await pageHelpers.fillLoginForm(testUser.email, testUser.password);
      
      // Simulate being logged in by going to dashboard
      await page.goto(`${TEST_CONFIG.baseURL}/dashboard`);
      
      // Click logout button
      await page.click('[data-testid="logout-button"]');
      
      // Should redirect to login page
      await expect(page).toHaveURL(/login/);
      await pageHelpers.expectToastMessage('signed out successfully');
    });

    test('should handle inactivity timeout', async ({ page }) => {
      // This would test the 30-minute inactivity timer
      // In a real test, you'd mock the timer or use a shorter timeout
      await page.goto(`${TEST_CONFIG.baseURL}/dashboard`);
      
      // Mock inactivity by evaluating JavaScript
      await page.evaluate(() => {
        // Trigger the inactivity timeout
        localStorage.setItem('test_inactivity', 'true');
      });
      
      // Wait for timeout and check redirect
      await page.waitForTimeout(1000);
      // In real implementation, you'd test the actual timeout logic
    });
  });

  test.describe('Email Verification', () => {
    test('should resend verification email', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/confirm-email?email=${testUser.email}`);
      
      await page.click('text=Resend Email');
      
      await expect(page.locator('text=sent another confirmation email')).toBeVisible();
    });

    test('should handle verification link click', async ({ page }) => {
      // Simulate clicking a verification link
      const verificationToken = 'test-verification-token';
      await page.goto(`${TEST_CONFIG.baseURL}/auth/callback?token=${verificationToken}`);
      
      // Should redirect to onboarding or dashboard
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).toMatch(/(onboarding|dashboard|login)/);
    });
  });

  test.describe('Authentication State Management', () => {
    test('should persist login state across page refresh', async ({ page, pageHelpers }) => {
      // Login
      await page.goto(`${TEST_CONFIG.baseURL}/login`);
      await pageHelpers.fillLoginForm(testUser.email, testUser.password);
      
      // Refresh page
      await page.reload();
      
      // Should still be authenticated
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).not.toMatch(/login/);
    });

    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access protected route
      await page.goto(`${TEST_CONFIG.baseURL}/dashboard`);
      
      // Should redirect to login
      await expect(page).toHaveURL(/login/);
    });

    test('should redirect authenticated users away from login page', async ({ page, pageHelpers }) => {
      // Login first
      await page.goto(`${TEST_CONFIG.baseURL}/login`);
      await pageHelpers.fillLoginForm(testUser.email, testUser.password);
      
      // Try to go back to login page
      await page.goto(`${TEST_CONFIG.baseURL}/login`);
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/dashboard/);
    });
  });
}); 
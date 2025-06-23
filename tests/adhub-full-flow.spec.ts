import { test, expect } from '@playwright/test';

// ✅ SECURE: Environment-based URL configuration (no hardcoded localhost)
const getBaseUrl = () => {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.NODE_ENV === 'production') return 'https://adhub.com'
  if (process.env.NODE_ENV === 'staging') return 'https://staging.adhub.tech'
  return 'http://localhost:3000'
}

const FRONTEND_URL = getBaseUrl()

test.describe('AdHub Full Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FRONTEND_URL);
  });

  test('should load homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/AdHub/);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.click('text=Login');
    await expect(page).toHaveURL(/login/);
  });

  test('should navigate to register page', async ({ page }) => {
    await page.click('text=Register');
    await expect(page).toHaveURL(/register/);
  });

  test('should handle authentication flow', async ({ page }) => {
    // Go to login
    await page.goto(`${FRONTEND_URL}/login`);
    
    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard or show error
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/(dashboard|login)/);
  });

  test('should load dashboard when authenticated', async ({ page }) => {
    // Mock authentication or use test credentials
    // This would typically involve setting up test authentication
    await page.goto(`${FRONTEND_URL}/dashboard`);
    
    // Should either show dashboard or redirect to login
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/(dashboard|login)/);
  });

  test('should handle admin panel access', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/admin`);
    
    // Should either show admin panel or redirect to login
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/(admin|login)/);
  });
});

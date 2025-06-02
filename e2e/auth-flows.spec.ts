import { test, expect } from '@playwright/test';

test.describe('Authentication and Onboarding Flows', () => {
  test('User can register a new account', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[type="email"]', 'testuser+' + Date.now() + '@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    // Add more fields as needed
    await page.click('button:has-text("Sign up")');
    // Expect to be redirected or see a success message
    await expect(page).toHaveURL(/login|dashboard|onboarding/);
  });

  test('User can log in', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign in")');
    // Expect to be redirected or see dashboard
    await expect(page).not.toHaveURL(/login/);
  });

  test('User can complete onboarding', async ({ page }) => {
    await page.goto('http://localhost:3000/onboarding');
    // Example: fill out onboarding steps
    // await page.click('button:has-text("Next")');
    // await page.fill('input[name="orgName"]', 'Test Org');
    // await page.click('button:has-text("Finish")');
    // Expect to see dashboard or success message
    await expect(page).not.toHaveURL(/onboarding/);
  });
}); 
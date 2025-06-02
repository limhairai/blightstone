import { test, expect } from '@playwright/test';

test.describe('Ad Account and Project Flows', () => {
  test('User can create a new ad account', async ({ page }) => {
    await page.goto('http://localhost:3000/accounts/new');
    await page.fill('input[name="accountName"]', 'Test Ad Account ' + Date.now());
    await page.click('button:has-text("Create Account")');
    await expect(page).toHaveURL(/accounts/);
  });

  test('User can create a new project', async ({ page }) => {
    await page.goto('http://localhost:3000/projects/new');
    await page.fill('input[name="projectName"]', 'Test Project ' + Date.now());
    await page.click('button:has-text("Create Project")');
    await expect(page).toHaveURL(/projects/);
  });
}); 
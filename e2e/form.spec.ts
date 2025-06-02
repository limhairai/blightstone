import { test, expect } from '@playwright/test';
test('form submission', async ({ page }) => {
  await page.goto('/ad-accounts/new');
  await page.fill('input[name=\'name\']', 'Test Ad Account');
  await page.click('button[type=\'submit\']');
  await expect(page.getByText(/success|created|added/i)).toBeVisible();
});

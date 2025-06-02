import { test, expect } from '@playwright/test';
test('dashboard loads for authenticated user', async ({ page }) => {
  // TODO: Add login step or use storage state
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText(/dashboard/i)).toBeVisible();
});

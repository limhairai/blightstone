import { test, expect } from '@playwright/test';
test('navigation between main pages', async ({ page }) => {
  await page.goto('/');
  await page.click('nav >> text=Dashboard');
  await expect(page).toHaveURL(/dashboard/);
  await page.click('nav >> text=Settings');
  await expect(page).toHaveURL(/settings/);
});

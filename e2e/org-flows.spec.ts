import { test, expect } from '@playwright/test';

test.describe('Organization Flows', () => {
  test('User can create a new organization', async ({ page }) => {
    await page.goto('http://localhost:3000/organizations/new');
    await page.fill('input[name="orgName"]', 'Test Org ' + Date.now());
    await page.click('button:has-text("Create Organization")');
    await expect(page).toHaveURL(/organizations/);
  });

  test('User can invite a user to organization', async ({ page }) => {
    await page.goto('http://localhost:3000/organizations');
    await page.click('button:has-text("Invite")');
    await page.fill('input[type="email"]', 'invitee+' + Date.now() + '@example.com');
    await page.click('button:has-text("Send Invite")');
    await expect(page.locator('text=Invitation sent')).toBeVisible();
  });
}); 
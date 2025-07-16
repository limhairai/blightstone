import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test('should access admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-stats"]')).toBeVisible();
  });

  test('should view and manage applications', async ({ page }) => {
    await page.goto('/admin/applications');
    
    // Verify applications table
    await expect(page.locator('[data-testid="applications-table"]')).toBeVisible();
    
    // Check if test application is visible
    const applicationRow = page.locator('[data-testid="application-row"]').first();
    await expect(applicationRow).toBeVisible();
    
    // Test status update
    await applicationRow.locator('[data-testid="status-select"]').selectOption('approved');
    await page.click('[data-testid="update-status-button"]');
    
    // Verify status updated
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(applicationRow.locator('[data-testid="status-badge"]')).toContainText('approved');
  });

  test('should manage organizations', async ({ page }) => {
    await page.goto('/admin/organizations');
    
    // Verify organizations table
    await expect(page.locator('[data-testid="organizations-table"]')).toBeVisible();
    
    // View organization details
    const orgRow = page.locator('[data-testid="organization-row"]').first();
    await orgRow.click();
    
    // Verify organization details modal
    await expect(page.locator('[data-testid="organization-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="organization-name"]')).toContainText('Test Organization');
  });

  test('should view system analytics', async ({ page }) => {
    await page.goto('/admin/analytics');
    
    // Verify analytics dashboard
    await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="applications-chart"]')).toBeVisible();
  });

  test('should handle bulk operations', async ({ page }) => {
    await page.goto('/admin/applications');
    
    // Select multiple applications
    await page.locator('[data-testid="select-all-checkbox"]').check();
    
    // Verify bulk actions are available
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();
    
    // Test bulk status update
    await page.selectOption('[data-testid="bulk-status-select"]', 'processing');
    await page.click('[data-testid="bulk-update-button"]');
    
    // Verify bulk update success
    await expect(page.locator('[data-testid="bulk-success-message"]')).toBeVisible();
  });
}); 
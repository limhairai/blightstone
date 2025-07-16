import { test, expect } from '@playwright/test';

test.describe('Application Workflow', () => {
  test('should submit new business application', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Navigate to applications
    await page.click('[data-testid="applications-nav"]');
    await page.click('[data-testid="new-application-button"]');
    
    // Fill application form
    await page.fill('[data-testid="business-name-input"]', 'Test Business Application');
    await page.fill('[data-testid="website-url-input"]', 'https://test-business.com');
    await page.selectOption('[data-testid="request-type-select"]', 'new_business_manager');
    await page.fill('[data-testid="client-notes-textarea"]', 'This is a test application for E2E testing');
    
    // Submit application
    await page.click('[data-testid="submit-application-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Application submitted successfully');
    
    // Verify application appears in list
    await page.goto('/dashboard/applications');
    await expect(page.locator('[data-testid="application-item"]').first()).toContainText('Test Business Application');
  });

  test('should show application status updates', async ({ page }) => {
    await page.goto('/dashboard/applications');
    
    // Check application status
    const applicationItem = page.locator('[data-testid="application-item"]').first();
    await expect(applicationItem.locator('[data-testid="status-badge"]')).toContainText('pending');
    
    // Click for details
    await applicationItem.click();
    
    // Verify application details page
    await expect(page.locator('[data-testid="application-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="application-status"]')).toContainText('Pending Review');
  });

  test('should handle application form validation', async ({ page }) => {
    await page.goto('/dashboard/applications/new');
    
    // Try to submit empty form
    await page.click('[data-testid="submit-application-button"]');
    
    // Check validation errors
    await expect(page.locator('[data-testid="business-name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="website-url-error"]')).toBeVisible();
    
    // Fill required fields
    await page.fill('[data-testid="business-name-input"]', 'Valid Business Name');
    await page.fill('[data-testid="website-url-input"]', 'invalid-url');
    
    // Check URL validation
    await page.click('[data-testid="submit-application-button"]');
    await expect(page.locator('[data-testid="website-url-error"]')).toContainText('Please enter a valid URL');
  });
}); 
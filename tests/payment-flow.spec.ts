import { test, expect } from '@playwright/test';

test.describe('Payment Flow', () => {
  test('should display subscription plans', async ({ page }) => {
    await page.goto('/dashboard/subscription');
    
    // Verify subscription plans are displayed
    await expect(page.locator('[data-testid="subscription-plans"]')).toBeVisible();
    await expect(page.locator('[data-testid="starter-plan"]')).toBeVisible();
    await expect(page.locator('[data-testid="growth-plan"]')).toBeVisible();
    await expect(page.locator('[data-testid="scale-plan"]')).toBeVisible();
  });

  test('should handle wallet top-up flow', async ({ page }) => {
    await page.goto('/dashboard/wallet');
    
    // Check current balance
    await expect(page.locator('[data-testid="wallet-balance"]')).toBeVisible();
    
    // Initiate top-up
    await page.click('[data-testid="top-up-button"]');
    await page.fill('[data-testid="amount-input"]', '100');
    await page.click('[data-testid="proceed-payment-button"]');
    
    // Verify payment form (Stripe)
    await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="amount-display"]')).toContainText('$100.00');
    await expect(page.locator('[data-testid="fee-display"]')).toContainText('$3.00');
    await expect(page.locator('[data-testid="total-display"]')).toContainText('$103.00');
  });

  test('should show transaction history', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    
    // Verify transactions table
    await expect(page.locator('[data-testid="transactions-table"]')).toBeVisible();
    
    // Check transaction filters
    await page.selectOption('[data-testid="transaction-type-filter"]', 'top_up');
    await page.click('[data-testid="apply-filter-button"]');
    
    // Verify filtered results
    const transactionRows = page.locator('[data-testid="transaction-row"]');
    await expect(transactionRows.first()).toBeVisible();
  });

  test('should handle subscription upgrade', async ({ page }) => {
    await page.goto('/dashboard/subscription');
    
    // Current plan should be starter
    await expect(page.locator('[data-testid="current-plan"]')).toContainText('Starter');
    
    // Upgrade to Growth plan
    await page.click('[data-testid="upgrade-to-growth"]');
    
    // Verify upgrade modal
    await expect(page.locator('[data-testid="upgrade-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="new-plan-name"]')).toContainText('Growth');
    await expect(page.locator('[data-testid="price-change"]')).toBeVisible();
    
    // Confirm upgrade
    await page.click('[data-testid="confirm-upgrade-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="upgrade-success"]')).toBeVisible();
  });

  test('should validate minimum top-up amount', async ({ page }) => {
    await page.goto('/dashboard/wallet');
    
    await page.click('[data-testid="top-up-button"]');
    
    // Try amount below minimum
    await page.fill('[data-testid="amount-input"]', '5');
    await page.click('[data-testid="proceed-payment-button"]');
    
    // Verify validation error
    await expect(page.locator('[data-testid="amount-error"]')).toContainText('Minimum top-up amount is $10');
  });
}); 
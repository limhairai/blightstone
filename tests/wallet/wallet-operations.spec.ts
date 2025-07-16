import { test, expect, createTestUser, TEST_CONFIG, DatabaseCleaner } from '../utils/test-helpers';

test.describe('Wallet Operations', () => {
  let testUser: ReturnType<typeof createTestUser>;
  let dbCleaner: DatabaseCleaner;

  test.beforeEach(async ({ page, pageHelpers }) => {
    testUser = createTestUser();
    dbCleaner = new DatabaseCleaner();
    
    // Setup authenticated user
    await page.goto(`${TEST_CONFIG.baseURL}/login`);
    await pageHelpers.fillLoginForm(testUser.email, testUser.password);
    await pageHelpers.waitForAuthState();
  });

  test.afterEach(async () => {
    await dbCleaner.cleanupTestUser(testUser.email);
  });

  test.describe('Wallet Balance Display', () => {
    test('should display current wallet balance', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      
      // Should show balance section
      await expect(page.locator('[data-testid="wallet-balance"]')).toBeVisible();
      await expect(page.locator('text=Current Balance')).toBeVisible();
      
      // Should show balance amount (could be $0.00 for new user)
      await expect(page.locator('[data-testid="balance-amount"]')).toBeVisible();
    });

    test('should display balance in correct currency format', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      
      const balanceElement = page.locator('[data-testid="balance-amount"]');
      const balanceText = await balanceElement.textContent();
      
      // Should be formatted as currency (e.g., $0.00, $100.50)
      expect(balanceText).toMatch(/^\$\d+\.\d{2}$/);
    });

    test('should show loading state while fetching balance', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      
      // Should show loading skeleton or spinner initially
      await expect(page.locator('[data-testid="balance-loading"]')).toBeVisible();
      
      // Should resolve to actual balance
      await expect(page.locator('[data-testid="balance-amount"]')).toBeVisible();
    });
  });

  test.describe('Wallet Top-Up', () => {
    test('should open top-up modal', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      
      await page.click('[data-testid="top-up-button"]');
      
      // Should open top-up modal
      await expect(page.locator('[data-testid="top-up-modal"]')).toBeVisible();
      await expect(page.locator('text=Top Up Wallet')).toBeVisible();
    });

    test('should display top-up amount options', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      await page.click('[data-testid="top-up-button"]');
      
      // Should show preset amounts
      await expect(page.locator('[data-testid="amount-50"]')).toBeVisible();
      await expect(page.locator('[data-testid="amount-100"]')).toBeVisible();
      await expect(page.locator('[data-testid="amount-500"]')).toBeVisible();
      await expect(page.locator('[data-testid="amount-1000"]')).toBeVisible();
      
      // Should have custom amount input
      await expect(page.locator('[data-testid="custom-amount-input"]')).toBeVisible();
    });

    test('should validate minimum top-up amount', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      await page.click('[data-testid="top-up-button"]');
      
      // Try to enter amount below minimum
      await page.fill('[data-testid="custom-amount-input"]', '5');
      await page.click('[data-testid="continue-button"]');
      
      await expect(page.locator('text=Minimum top-up amount is $10')).toBeVisible();
    });

    test('should validate maximum top-up amount', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      await page.click('[data-testid="top-up-button"]');
      
      // Try to enter amount above maximum
      await page.fill('[data-testid="custom-amount-input"]', '10000');
      await page.click('[data-testid="continue-button"]');
      
      await expect(page.locator('text=Maximum top-up amount is $5,000')).toBeVisible();
    });

    test('should process credit card top-up', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      await page.click('[data-testid="top-up-button"]');
      
      // Select amount
      await page.click('[data-testid="amount-100"]');
      await page.click('[data-testid="continue-button"]');
      
      // Should redirect to Stripe checkout or show card form
      await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();
      
      // Fill mock card details (for testing)
      await page.fill('[data-testid="card-number"]', '4242424242424242');
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvc"]', '123');
      
      await page.click('[data-testid="pay-button"]');
      
      // Should show success message
      await pageHelpers.expectToastMessage('Payment successful');
    });

    test('should handle payment failures', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      await page.click('[data-testid="top-up-button"]');
      
      await page.click('[data-testid="amount-100"]');
      await page.click('[data-testid="continue-button"]');
      
      // Use declined card number
      await page.fill('[data-testid="card-number"]', '4000000000000002');
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvc"]', '123');
      
      await page.click('[data-testid="pay-button"]');
      
      // Should show error message
      await pageHelpers.expectToastMessage('Payment failed');
    });

    test('should support bank transfer top-up', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      await page.click('[data-testid="top-up-button"]');
      
      await page.click('[data-testid="amount-500"]');
      await page.click('[data-testid="payment-method-bank"]');
      await page.click('[data-testid="continue-button"]');
      
      // Should show bank transfer instructions
      await expect(page.locator('text=Bank Transfer Instructions')).toBeVisible();
      await expect(page.locator('[data-testid="bank-details"]')).toBeVisible();
    });

    test('should support crypto top-up', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      await page.click('[data-testid="top-up-button"]');
      
      await page.click('[data-testid="amount-100"]');
      await page.click('[data-testid="payment-method-crypto"]');
      await page.click('[data-testid="continue-button"]');
      
      // Should show crypto payment options
      await expect(page.locator('text=Cryptocurrency Payment')).toBeVisible();
      await expect(page.locator('[data-testid="crypto-address"]')).toBeVisible();
    });
  });

  test.describe('Transaction History', () => {
    test('should display transaction history', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      
      // Should show transactions section
      await expect(page.locator('[data-testid="transaction-history"]')).toBeVisible();
      await expect(page.locator('text=Transaction History')).toBeVisible();
    });

    test('should show empty state for no transactions', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      
      // For new user, should show empty state
      await expect(page.locator('[data-testid="empty-transactions"]')).toBeVisible();
      await expect(page.locator('text=No transactions yet')).toBeVisible();
    });

    test('should filter transactions by type', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      
      // Select filter
      await page.click('[data-testid="transaction-filter"]');
      await page.click('[data-testid="filter-top-up"]');
      
      // Should show only top-up transactions
      const transactions = page.locator('[data-testid="transaction-item"]');
      const count = await transactions.count();
      
      for (let i = 0; i < count; i++) {
        await expect(transactions.nth(i).locator('[data-testid="transaction-type"]')).toContainText('Top Up');
      }
    });

    test('should filter transactions by date range', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      
      // Open date filter
      await page.click('[data-testid="date-filter"]');
      await page.fill('[data-testid="start-date"]', '2024-01-01');
      await page.fill('[data-testid="end-date"]', '2024-12-31');
      await page.click('[data-testid="apply-filter"]');
      
      // Should show transactions within date range
      await expect(page.locator('[data-testid="transaction-item"]')).toBeVisible();
    });

    test('should show transaction details', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      
      // Click on first transaction (if any)
      const firstTransaction = page.locator('[data-testid="transaction-item"]').first();
      if (await firstTransaction.count() > 0) {
        await firstTransaction.click();
        
        // Should show transaction details modal
        await expect(page.locator('[data-testid="transaction-details-modal"]')).toBeVisible();
        await expect(page.locator('[data-testid="transaction-id"]')).toBeVisible();
        await expect(page.locator('[data-testid="transaction-amount"]')).toBeVisible();
        await expect(page.locator('[data-testid="transaction-date"]')).toBeVisible();
      }
    });

    test('should export transaction history', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      
      // Click export button
      await page.click('[data-testid="export-transactions"]');
      
      // Should trigger download
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toContain('transactions');
      expect(download.suggestedFilename()).toContain('.csv');
    });
  });

  test.describe('Payment Methods', () => {
    test('should display saved payment methods', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      
      // Navigate to payment methods
      await page.click('[data-testid="payment-methods-tab"]');
      
      await expect(page.locator('[data-testid="payment-methods-section"]')).toBeVisible();
      await expect(page.locator('text=Payment Methods')).toBeVisible();
    });

    test('should add new payment method', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      await page.click('[data-testid="payment-methods-tab"]');
      
      await page.click('[data-testid="add-payment-method"]');
      
      // Should show add payment method form
      await expect(page.locator('[data-testid="payment-method-form"]')).toBeVisible();
      
      // Fill card details
      await page.fill('[data-testid="card-number"]', '4242424242424242');
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvc"]', '123');
      await page.fill('[data-testid="card-name"]', 'Test User');
      
      await page.click('[data-testid="save-payment-method"]');
      
      await pageHelpers.expectToastMessage('Payment method added successfully');
    });

    test('should delete payment method', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      await page.click('[data-testid="payment-methods-tab"]');
      
      // Click delete on first payment method (if any)
      const firstPaymentMethod = page.locator('[data-testid="payment-method-item"]').first();
      if (await firstPaymentMethod.count() > 0) {
        await firstPaymentMethod.locator('[data-testid="delete-payment-method"]').click();
        
        // Confirm deletion
        await page.click('[data-testid="confirm-delete"]');
        
        await pageHelpers.expectToastMessage('Payment method deleted');
      }
    });

    test('should set default payment method', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      await page.click('[data-testid="payment-methods-tab"]');
      
      // Click set default on a payment method
      const paymentMethod = page.locator('[data-testid="payment-method-item"]').first();
      if (await paymentMethod.count() > 0) {
        await paymentMethod.locator('[data-testid="set-default"]').click();
        
        await pageHelpers.expectToastMessage('Default payment method updated');
        
        // Should show as default
        await expect(paymentMethod.locator('[data-testid="default-badge"]')).toBeVisible();
      }
    });
  });

  test.describe('Wallet Security', () => {
    test('should require authentication for sensitive operations', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      
      // Try to top up large amount
      await page.click('[data-testid="top-up-button"]');
      await page.fill('[data-testid="custom-amount-input"]', '1000');
      await page.click('[data-testid="continue-button"]');
      
      // Should require additional authentication
      await expect(page.locator('[data-testid="auth-challenge"]')).toBeVisible();
    });

    test('should handle session timeout during payment', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      await page.click('[data-testid="top-up-button"]');
      
      // Simulate session timeout
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      await page.click('[data-testid="amount-100"]');
      await page.click('[data-testid="continue-button"]');
      
      // Should redirect to login
      await expect(page).toHaveURL(/login/);
    });
  });

  test.describe('Wallet Notifications', () => {
    test('should show low balance warning', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      
      // Mock low balance state
      await page.evaluate(() => {
        window.localStorage.setItem('mock_balance', '5.00');
      });
      
      await page.reload();
      
      // Should show low balance warning
      await expect(page.locator('[data-testid="low-balance-warning"]')).toBeVisible();
      await expect(page.locator('text=Your balance is low')).toBeVisible();
    });

    test('should show payment success notification', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToWallet();
      await page.click('[data-testid="top-up-button"]');
      
      // Complete successful payment flow
      await page.click('[data-testid="amount-100"]');
      await page.click('[data-testid="continue-button"]');
      
      // Mock successful payment
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('payment-success', { 
          detail: { amount: 100, currency: 'USD' } 
        }));
      });
      
      await pageHelpers.expectToastMessage('$100.00 added to your wallet');
    });
  });
}); 
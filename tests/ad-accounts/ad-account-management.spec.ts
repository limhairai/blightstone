import { test, expect, createTestUser, TEST_CONFIG, DatabaseCleaner } from '../utils/test-helpers';

test.describe('Ad Account Management', () => {
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

  test.describe('Ad Account Request', () => {
    test('should display ad account request form', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      
      await page.click('[data-testid="request-ad-account"]');
      
      // Should show request form
      await expect(page.locator('[data-testid="ad-account-request-form"]')).toBeVisible();
      await expect(page.locator('text=Request Ad Account')).toBeVisible();
    });

    test('should validate business manager selection', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="request-ad-account"]');
      
      // Try to submit without selecting BM
      await page.click('[data-testid="submit-request"]');
      
      await expect(page.locator('text=Please select a Business Manager')).toBeVisible();
    });

    test('should submit ad account request successfully', async ({ page, pageHelpers, mockData }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="request-ad-account"]');
      
      const adAccountData = mockData.adAccount();
      
      // Fill request form
      await page.selectOption('[data-testid="business-manager"]', 'bm-123');
      await page.fill('[data-testid="account-name"]', adAccountData.name);
      await page.selectOption('[data-testid="currency"]', 'USD');
      await page.selectOption('[data-testid="timezone"]', 'UTC');
      await page.fill('[data-testid="initial-budget"]', '1000');
      
      await page.click('[data-testid="submit-request"]');
      
      // Should show success message
      await pageHelpers.expectToastMessage('Ad account request submitted successfully');
      
      // Should redirect to accounts list
      await expect(page).toHaveURL(/ad-accounts/);
    });

    test('should show BM requirements for ad account request', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      
      // If no BMs available, should show requirement message
      const noBMsMessage = page.locator('[data-testid="no-bms-message"]');
      if (await noBMsMessage.count() > 0) {
        await expect(noBMsMessage).toContainText('You need an approved Business Manager');
        await expect(page.locator('[data-testid="apply-bm-link"]')).toBeVisible();
      }
    });

    test('should validate initial budget amount', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="request-ad-account"]');
      
      // Try with invalid budget
      await page.selectOption('[data-testid="business-manager"]', 'bm-123');
      await page.fill('[data-testid="account-name"]', 'Test Account');
      await page.fill('[data-testid="initial-budget"]', '50'); // Below minimum
      
      await page.click('[data-testid="submit-request"]');
      
      await expect(page.locator('text=Minimum initial budget is $100')).toBeVisible();
    });
  });

  test.describe('Ad Account Status Tracking', () => {
    test('should display ad account requests list', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      
      // Should show requests list
      await expect(page.locator('[data-testid="ad-account-requests"]')).toBeVisible();
      await expect(page.locator('text=Ad Account Requests')).toBeVisible();
    });

    test('should show request status badges', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      
      // Check status badges on requests
      const requests = page.locator('[data-testid="ad-account-request-item"]');
      const count = await requests.count();
      
      for (let i = 0; i < count; i++) {
        const statusBadge = requests.nth(i).locator('[data-testid="status-badge"]');
        await expect(statusBadge).toBeVisible();
        
        const statusText = await statusBadge.textContent();
        expect(statusText).toMatch(/(pending|processing|approved|rejected)/);
      }
    });

    test('should show request details modal', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      
      const firstRequest = page.locator('[data-testid="ad-account-request-item"]').first();
      if (await firstRequest.count() > 0) {
        await firstRequest.click();
        
        // Should show request details
        await expect(page.locator('[data-testid="request-details-modal"]')).toBeVisible();
        await expect(page.locator('[data-testid="request-id"]')).toBeVisible();
        await expect(page.locator('[data-testid="requested-date"]')).toBeVisible();
        await expect(page.locator('[data-testid="current-status"]')).toBeVisible();
      }
    });

    test('should filter requests by status', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      
      // Apply status filter
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="filter-pending"]');
      
      // Should show only pending requests
      const requests = page.locator('[data-testid="ad-account-request-item"]');
      const count = await requests.count();
      
      for (let i = 0; i < count; i++) {
        const statusBadge = requests.nth(i).locator('[data-testid="status-badge"]');
        await expect(statusBadge).toContainText('pending');
      }
    });

    test('should cancel pending request', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      
      // Find pending request
      const pendingRequest = page.locator('[data-testid="ad-account-request-item"]')
        .filter({ has: page.locator('[data-testid="status-badge"]:has-text("pending")') })
        .first();
      
      if (await pendingRequest.count() > 0) {
        await pendingRequest.locator('[data-testid="cancel-request"]').click();
        
        // Confirm cancellation
        await expect(page.locator('[data-testid="cancel-confirmation"]')).toBeVisible();
        await page.click('[data-testid="confirm-cancel"]');
        
        await pageHelpers.expectToastMessage('Ad account request cancelled');
      }
    });
  });

  test.describe('Active Ad Accounts', () => {
    test('should display active ad accounts list', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      
      // Navigate to active accounts tab
      await page.click('[data-testid="active-accounts-tab"]');
      
      // Should show active accounts
      await expect(page.locator('[data-testid="active-accounts-list"]')).toBeVisible();
      await expect(page.locator('text=Active Ad Accounts')).toBeVisible();
    });

    test('should show account performance metrics', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      const firstAccount = page.locator('[data-testid="ad-account-item"]').first();
      if (await firstAccount.count() > 0) {
        // Should show key metrics
        await expect(firstAccount.locator('[data-testid="account-balance"]')).toBeVisible();
        await expect(firstAccount.locator('[data-testid="daily-spend"]')).toBeVisible();
        await expect(firstAccount.locator('[data-testid="account-status"]')).toBeVisible();
      }
    });

    test('should open account details view', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      const firstAccount = page.locator('[data-testid="ad-account-item"]').first();
      if (await firstAccount.count() > 0) {
        await firstAccount.click();
        
        // Should show detailed account view
        await expect(page.locator('[data-testid="account-details-view"]')).toBeVisible();
        await expect(page.locator('[data-testid="account-id"]')).toBeVisible();
        await expect(page.locator('[data-testid="performance-charts"]')).toBeVisible();
      }
    });

    test('should display account health indicators', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      const accounts = page.locator('[data-testid="ad-account-item"]');
      const count = await accounts.count();
      
      for (let i = 0; i < count; i++) {
        const healthIndicator = accounts.nth(i).locator('[data-testid="health-indicator"]');
        await expect(healthIndicator).toBeVisible();
        
        const healthStatus = await healthIndicator.textContent();
        expect(healthStatus).toMatch(/(healthy|warning|critical)/);
      }
    });
  });

  test.describe('Ad Account Top-Up', () => {
    test('should open account top-up modal', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      const firstAccount = page.locator('[data-testid="ad-account-item"]').first();
      if (await firstAccount.count() > 0) {
        await firstAccount.locator('[data-testid="top-up-account"]').click();
        
        // Should show top-up modal
        await expect(page.locator('[data-testid="account-topup-modal"]')).toBeVisible();
        await expect(page.locator('text=Top Up Ad Account')).toBeVisible();
      }
    });

    test('should validate top-up amount', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      const firstAccount = page.locator('[data-testid="ad-account-item"]').first();
      if (await firstAccount.count() > 0) {
        await firstAccount.locator('[data-testid="top-up-account"]').click();
        
        // Try invalid amount
        await page.fill('[data-testid="topup-amount"]', '5');
        await page.click('[data-testid="confirm-topup"]');
        
        await expect(page.locator('text=Minimum top-up amount is $10')).toBeVisible();
      }
    });

    test('should process account top-up successfully', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      const firstAccount = page.locator('[data-testid="ad-account-item"]').first();
      if (await firstAccount.count() > 0) {
        await firstAccount.locator('[data-testid="top-up-account"]').click();
        
        // Fill valid amount
        await page.fill('[data-testid="topup-amount"]', '100');
        await page.click('[data-testid="confirm-topup"]');
        
        await pageHelpers.expectToastMessage('Ad account topped up successfully');
        
        // Balance should update
        await expect(firstAccount.locator('[data-testid="account-balance"]')).toContainText('$');
      }
    });

    test('should show insufficient wallet balance error', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      // Mock low wallet balance
      await page.evaluate(() => {
        window.localStorage.setItem('mock_wallet_balance', '50');
      });
      
      const firstAccount = page.locator('[data-testid="ad-account-item"]').first();
      if (await firstAccount.count() > 0) {
        await firstAccount.locator('[data-testid="top-up-account"]').click();
        
        await page.fill('[data-testid="topup-amount"]', '100');
        await page.click('[data-testid="confirm-topup"]');
        
        await expect(page.locator('text=Insufficient wallet balance')).toBeVisible();
        await expect(page.locator('[data-testid="topup-wallet-link"]')).toBeVisible();
      }
    });
  });

  test.describe('Ad Account Binding', () => {
    test('should show binding status', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      const accounts = page.locator('[data-testid="ad-account-item"]');
      const count = await accounts.count();
      
      for (let i = 0; i < count; i++) {
        const bindingStatus = accounts.nth(i).locator('[data-testid="binding-status"]');
        await expect(bindingStatus).toBeVisible();
        
        const statusText = await bindingStatus.textContent();
        expect(statusText).toMatch(/(bound|unbound|binding)/);
      }
    });

    test('should rebind account to different BM', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      const boundAccount = page.locator('[data-testid="ad-account-item"]')
        .filter({ has: page.locator('[data-testid="binding-status"]:has-text("bound")') })
        .first();
      
      if (await boundAccount.count() > 0) {
        await boundAccount.locator('[data-testid="rebind-account"]').click();
        
        // Should show rebinding form
        await expect(page.locator('[data-testid="rebind-form"]')).toBeVisible();
        
        // Select new BM
        await page.selectOption('[data-testid="new-business-manager"]', 'bm-456');
        await page.fill('[data-testid="rebind-reason"]', 'Original BM suspended');
        await page.click('[data-testid="confirm-rebind"]');
        
        await pageHelpers.expectToastMessage('Account rebinding requested');
      }
    });

    test('should show binding history', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      const firstAccount = page.locator('[data-testid="ad-account-item"]').first();
      if (await firstAccount.count() > 0) {
        await firstAccount.click();
        
        // Navigate to binding history
        await page.click('[data-testid="binding-history-tab"]');
        
        await expect(page.locator('[data-testid="binding-history"]')).toBeVisible();
        await expect(page.locator('[data-testid="binding-timeline"]')).toBeVisible();
      }
    });
  });

  test.describe('Ad Account Performance', () => {
    test('should display spend analytics', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      const firstAccount = page.locator('[data-testid="ad-account-item"]').first();
      if (await firstAccount.count() > 0) {
        await firstAccount.click();
        
        // Should show performance dashboard
        await expect(page.locator('[data-testid="spend-chart"]')).toBeVisible();
        await expect(page.locator('[data-testid="daily-spend"]')).toBeVisible();
        await expect(page.locator('[data-testid="monthly-spend"]')).toBeVisible();
      }
    });

    test('should show spend limits and alerts', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      const firstAccount = page.locator('[data-testid="ad-account-item"]').first();
      if (await firstAccount.count() > 0) {
        await firstAccount.click();
        
        // Navigate to limits tab
        await page.click('[data-testid="limits-tab"]');
        
        await expect(page.locator('[data-testid="daily-limit"]')).toBeVisible();
        await expect(page.locator('[data-testid="monthly-limit"]')).toBeVisible();
        await expect(page.locator('[data-testid="alert-settings"]')).toBeVisible();
      }
    });

    test('should update spend limits', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      const firstAccount = page.locator('[data-testid="ad-account-item"]').first();
      if (await firstAccount.count() > 0) {
        await firstAccount.click();
        await page.click('[data-testid="limits-tab"]');
        
        // Update daily limit
        await page.fill('[data-testid="daily-limit-input"]', '500');
        await page.click('[data-testid="save-limits"]');
        
        await pageHelpers.expectToastMessage('Spend limits updated successfully');
      }
    });

    test('should export account performance data', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      const firstAccount = page.locator('[data-testid="ad-account-item"]').first();
      if (await firstAccount.count() > 0) {
        await firstAccount.click();
        
        // Export performance data
        await page.click('[data-testid="export-data"]');
        
        const downloadPromise = page.waitForEvent('download');
        await page.click('[data-testid="export-csv"]');
        const download = await downloadPromise;
        
        expect(download.suggestedFilename()).toContain('ad-account-performance');
        expect(download.suggestedFilename()).toContain('.csv');
      }
    });
  });

  test.describe('Ad Account Integration', () => {
    test('should show Facebook API connection status', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      const accounts = page.locator('[data-testid="ad-account-item"]');
      const count = await accounts.count();
      
      for (let i = 0; i < count; i++) {
        const fbStatus = accounts.nth(i).locator('[data-testid="facebook-status"]');
        await expect(fbStatus).toBeVisible();
        
        const statusText = await fbStatus.textContent();
        expect(statusText).toMatch(/(connected|disconnected|error)/);
      }
    });

    test('should handle Facebook API errors', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      // Mock Facebook API error
      await page.evaluate(() => {
        window.localStorage.setItem('mock_facebook_error', 'true');
      });
      
      await page.reload();
      
      // Should show error indicators
      await expect(page.locator('[data-testid="facebook-error"]')).toBeVisible();
      await expect(page.locator('text=Facebook API connection error')).toBeVisible();
    });

    test('should show Dolphin API integration status', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      const firstAccount = page.locator('[data-testid="ad-account-item"]').first();
      if (await firstAccount.count() > 0) {
        await firstAccount.click();
        
        // Navigate to integration tab
        await page.click('[data-testid="integration-tab"]');
        
        await expect(page.locator('[data-testid="dolphin-status"]')).toBeVisible();
        await expect(page.locator('[data-testid="dolphin-sync-status"]')).toBeVisible();
      }
    });

    test('should sync account data with Dolphin', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      const firstAccount = page.locator('[data-testid="ad-account-item"]').first();
      if (await firstAccount.count() > 0) {
        await firstAccount.click();
        await page.click('[data-testid="integration-tab"]');
        
        // Trigger sync
        await page.click('[data-testid="sync-dolphin"]');
        
        // Should show sync progress
        await expect(page.locator('[data-testid="sync-progress"]')).toBeVisible();
        
        // Should complete successfully
        await pageHelpers.expectToastMessage('Account data synced successfully');
      }
    });
  });

  test.describe('Ad Account Notifications', () => {
    test('should show low balance alerts', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      // Mock low balance account
      await page.evaluate(() => {
        window.localStorage.setItem('mock_account_low_balance', 'true');
      });
      
      await page.reload();
      
      // Should show low balance warning
      await expect(page.locator('[data-testid="low-balance-alert"]')).toBeVisible();
      await expect(page.locator('text=Account balance is low')).toBeVisible();
    });

    test('should show spend limit alerts', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      // Mock spend limit reached
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('spend-limit-reached', {
          detail: { accountId: 'acc-123', limitType: 'daily' }
        }));
      });
      
      await pageHelpers.expectToastMessage('Daily spend limit reached');
    });

    test('should show account status change notifications', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      
      // Mock account status change
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('account-status-change', {
          detail: { accountId: 'acc-123', status: 'suspended' }
        }));
      });
      
      await pageHelpers.expectToastMessage('Account status changed to suspended');
    });
  });

  test.describe('Ad Account Search and Filters', () => {
    test('should search accounts by name', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      // Search for specific account
      await page.fill('[data-testid="account-search"]', 'Test Account');
      await page.click('[data-testid="search-button"]');
      
      // Should filter results
      const visibleAccounts = page.locator('[data-testid="ad-account-item"]');
      const count = await visibleAccounts.count();
      
      for (let i = 0; i < count; i++) {
        const accountName = visibleAccounts.nth(i).locator('[data-testid="account-name"]');
        await expect(accountName).toContainText('Test Account');
      }
    });

    test('should filter accounts by status', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      // Apply status filter
      await page.click('[data-testid="account-status-filter"]');
      await page.click('[data-testid="filter-active"]');
      
      // Should show only active accounts
      const accounts = page.locator('[data-testid="ad-account-item"]');
      const count = await accounts.count();
      
      for (let i = 0; i < count; i++) {
        const statusBadge = accounts.nth(i).locator('[data-testid="account-status"]');
        await expect(statusBadge).toContainText('active');
      }
    });

    test('should sort accounts by spend', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToAdAccounts();
      await page.click('[data-testid="active-accounts-tab"]');
      
      // Sort by spend (descending)
      await page.click('[data-testid="sort-dropdown"]');
      await page.click('[data-testid="sort-spend-desc"]');
      
      // Should sort accounts by spend amount
      const accounts = page.locator('[data-testid="ad-account-item"]');
      const count = await accounts.count();
      
      if (count > 1) {
        const firstSpend = await accounts.first().locator('[data-testid="daily-spend"]').textContent();
        const secondSpend = await accounts.nth(1).locator('[data-testid="daily-spend"]').textContent();
        
        // Extract numeric values and compare
        const firstAmount = parseFloat(firstSpend?.replace(/[^0-9.]/g, '') || '0');
        const secondAmount = parseFloat(secondSpend?.replace(/[^0-9.]/g, '') || '0');
        
        expect(firstAmount).toBeGreaterThanOrEqual(secondAmount);
      }
    });
  });
}); 
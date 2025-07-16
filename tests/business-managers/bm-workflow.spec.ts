import { test, expect, createTestUser, createTestOrganization, TEST_CONFIG, DatabaseCleaner } from '../utils/test-helpers';

test.describe('Business Manager Workflow', () => {
  let testUser: ReturnType<typeof createTestUser>;
  let testOrg: ReturnType<typeof createTestOrganization>;
  let dbCleaner: DatabaseCleaner;

  test.beforeEach(async ({ page, pageHelpers }) => {
    testUser = createTestUser();
    testOrg = createTestOrganization();
    dbCleaner = new DatabaseCleaner();
    
    // Setup authenticated user
    await page.goto(`${TEST_CONFIG.baseURL}/login`);
    await pageHelpers.fillLoginForm(testUser.email, testUser.password);
    await pageHelpers.waitForAuthState();
  });

  test.afterEach(async () => {
    await dbCleaner.cleanupTestUser(testUser.email);
    await dbCleaner.cleanupTestOrganization(testOrg.name);
  });

  test.describe('Business Manager Application', () => {
    test('should display BM application form', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      
      await page.click('[data-testid="apply-bm-button"]');
      
      // Should show application form
      await expect(page.locator('[data-testid="bm-application-form"]')).toBeVisible();
      await expect(page.locator('text=Business Manager Application')).toBeVisible();
    });

    test('should validate required fields', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      await page.click('[data-testid="apply-bm-button"]');
      
      // Try to submit without filling required fields
      await page.click('[data-testid="submit-application"]');
      
      // Should show validation errors
      await expect(page.locator('text=Business name is required')).toBeVisible();
      await expect(page.locator('text=Industry is required')).toBeVisible();
      await expect(page.locator('text=Monthly ad spend is required')).toBeVisible();
    });

    test('should submit BM application successfully', async ({ page, pageHelpers, mockData }) => {
      await pageHelpers.navigateToBusinessManagers();
      await page.click('[data-testid="apply-bm-button"]');
      
      const bmData = mockData.businessManager();
      
      // Fill application form
      await page.fill('[data-testid="business-name"]', bmData.name);
      await page.selectOption('[data-testid="industry"]', 'Technology');
      await page.selectOption('[data-testid="monthly-spend"]', '$1,000-$5,000');
      await page.selectOption('[data-testid="provider"]', 'BlueFocus');
      await page.fill('[data-testid="website"]', 'https://example.com');
      await page.fill('[data-testid="description"]', 'Test business description');
      
      await page.click('[data-testid="submit-application"]');
      
      // Should show success message
      await pageHelpers.expectToastMessage('Business Manager application submitted successfully');
      
      // Should redirect to applications list
      await expect(page).toHaveURL(/business-managers/);
    });

    test('should handle application submission errors', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      await page.click('[data-testid="apply-bm-button"]');
      
      // Fill form with invalid data
      await page.fill('[data-testid="business-name"]', 'Test BM');
      await page.selectOption('[data-testid="industry"]', 'Technology');
      await page.selectOption('[data-testid="monthly-spend"]', '$1,000-$5,000');
      await page.fill('[data-testid="website"]', 'invalid-url');
      
      await page.click('[data-testid="submit-application"]');
      
      // Should show error message
      await expect(page.locator('text=Please enter a valid website URL')).toBeVisible();
    });

    test('should save application as draft', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      await page.click('[data-testid="apply-bm-button"]');
      
      // Fill partial form
      await page.fill('[data-testid="business-name"]', 'Test BM Draft');
      await page.selectOption('[data-testid="industry"]', 'Technology');
      
      await page.click('[data-testid="save-draft"]');
      
      // Should show draft saved message
      await pageHelpers.expectToastMessage('Application saved as draft');
      
      // Should show draft in applications list
      await expect(page.locator('[data-testid="draft-application"]')).toBeVisible();
    });

    test('should continue from draft', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      
      // Assume there's a draft application
      const draftApplication = page.locator('[data-testid="draft-application"]').first();
      if (await draftApplication.count() > 0) {
        await draftApplication.locator('[data-testid="continue-draft"]').click();
        
        // Should open form with saved data
        await expect(page.locator('[data-testid="bm-application-form"]')).toBeVisible();
        await expect(page.locator('[data-testid="business-name"]')).toHaveValue('Test BM Draft');
      }
    });
  });

  test.describe('Application Status Tracking', () => {
    test('should display application status', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      
      // Should show applications list
      await expect(page.locator('[data-testid="applications-list"]')).toBeVisible();
      
      // Check for status badges
      const applications = page.locator('[data-testid="application-item"]');
      const count = await applications.count();
      
      for (let i = 0; i < count; i++) {
        const statusBadge = applications.nth(i).locator('[data-testid="status-badge"]');
        await expect(statusBadge).toBeVisible();
        
        const statusText = await statusBadge.textContent();
        expect(statusText).toMatch(/(pending|processing|approved|rejected)/);
      }
    });

    test('should show application details', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      
      // Click on first application
      const firstApplication = page.locator('[data-testid="application-item"]').first();
      if (await firstApplication.count() > 0) {
        await firstApplication.click();
        
        // Should show application details modal
        await expect(page.locator('[data-testid="application-details-modal"]')).toBeVisible();
        await expect(page.locator('[data-testid="application-id"]')).toBeVisible();
        await expect(page.locator('[data-testid="submission-date"]')).toBeVisible();
        await expect(page.locator('[data-testid="current-status"]')).toBeVisible();
      }
    });

    test('should show status history', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      
      const firstApplication = page.locator('[data-testid="application-item"]').first();
      if (await firstApplication.count() > 0) {
        await firstApplication.click();
        
        // Should show status history
        await expect(page.locator('[data-testid="status-history"]')).toBeVisible();
        await expect(page.locator('[data-testid="status-timeline"]')).toBeVisible();
      }
    });

    test('should filter applications by status', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      
      // Apply status filter
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="filter-pending"]');
      
      // Should show only pending applications
      const applications = page.locator('[data-testid="application-item"]');
      const count = await applications.count();
      
      for (let i = 0; i < count; i++) {
        const statusBadge = applications.nth(i).locator('[data-testid="status-badge"]');
        await expect(statusBadge).toContainText('pending');
      }
    });
  });

  test.describe('Application Cancellation', () => {
    test('should cancel pending application', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      
      // Find pending application
      const pendingApp = page.locator('[data-testid="application-item"]')
        .filter({ has: page.locator('[data-testid="status-badge"]:has-text("pending")') })
        .first();
      
      if (await pendingApp.count() > 0) {
        await pendingApp.locator('[data-testid="cancel-application"]').click();
        
        // Should show confirmation dialog
        await expect(page.locator('[data-testid="cancel-confirmation"]')).toBeVisible();
        await page.click('[data-testid="confirm-cancel"]');
        
        // Should show success message
        await pageHelpers.expectToastMessage('Application cancelled successfully');
        
        // Status should update to cancelled
        await expect(pendingApp.locator('[data-testid="status-badge"]')).toContainText('cancelled');
      }
    });

    test('should not allow cancellation of approved applications', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      
      // Find approved application
      const approvedApp = page.locator('[data-testid="application-item"]')
        .filter({ has: page.locator('[data-testid="status-badge"]:has-text("approved")') })
        .first();
      
      if (await approvedApp.count() > 0) {
        // Cancel button should not be visible
        await expect(approvedApp.locator('[data-testid="cancel-application"]')).not.toBeVisible();
      }
    });
  });

  test.describe('Business Manager Binding', () => {
    test('should display approved BMs for binding', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      
      // Navigate to binding section
      await page.click('[data-testid="binding-tab"]');
      
      // Should show approved BMs
      await expect(page.locator('[data-testid="approved-bms"]')).toBeVisible();
      await expect(page.locator('text=Available Business Managers')).toBeVisible();
    });

    test('should bind BM to organization', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      await page.click('[data-testid="binding-tab"]');
      
      // Find first approved BM
      const approvedBM = page.locator('[data-testid="approved-bm-item"]').first();
      if (await approvedBM.count() > 0) {
        await approvedBM.locator('[data-testid="bind-bm"]').click();
        
        // Should show binding confirmation
        await expect(page.locator('[data-testid="binding-confirmation"]')).toBeVisible();
        await page.click('[data-testid="confirm-binding"]');
        
        // Should show success message
        await pageHelpers.expectToastMessage('Business Manager bound successfully');
        
        // Should move to bound BMs section
        await expect(page.locator('[data-testid="bound-bms"]')).toContainText('Test BM');
      }
    });

    test('should show BM binding limits', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      await page.click('[data-testid="binding-tab"]');
      
      // Should show current usage and limits
      await expect(page.locator('[data-testid="binding-limits"]')).toBeVisible();
      await expect(page.locator('[data-testid="current-usage"]')).toBeVisible();
      await expect(page.locator('[data-testid="plan-limit"]')).toBeVisible();
    });

    test('should prevent binding when limit reached', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      await page.click('[data-testid="binding-tab"]');
      
      // Mock limit reached state
      await page.evaluate(() => {
        window.localStorage.setItem('mock_bm_limit_reached', 'true');
      });
      
      await page.reload();
      
      // Bind button should be disabled
      const approvedBM = page.locator('[data-testid="approved-bm-item"]').first();
      if (await approvedBM.count() > 0) {
        await expect(approvedBM.locator('[data-testid="bind-bm"]')).toBeDisabled();
        await expect(page.locator('text=Upgrade your plan to bind more Business Managers')).toBeVisible();
      }
    });

    test('should unbind BM from organization', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      await page.click('[data-testid="binding-tab"]');
      
      // Find bound BM
      const boundBM = page.locator('[data-testid="bound-bm-item"]').first();
      if (await boundBM.count() > 0) {
        await boundBM.locator('[data-testid="unbind-bm"]').click();
        
        // Should show unbinding confirmation
        await expect(page.locator('[data-testid="unbind-confirmation"]')).toBeVisible();
        await page.click('[data-testid="confirm-unbind"]');
        
        // Should show success message
        await pageHelpers.expectToastMessage('Business Manager unbound successfully');
        
        // Should move back to available BMs
        await expect(page.locator('[data-testid="approved-bms"]')).toContainText('Test BM');
      }
    });
  });

  test.describe('BM Replacement Requests', () => {
    test('should request BM replacement', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      
      // Find bound BM
      const boundBM = page.locator('[data-testid="bound-bm-item"]').first();
      if (await boundBM.count() > 0) {
        await boundBM.locator('[data-testid="request-replacement"]').click();
        
        // Should show replacement request form
        await expect(page.locator('[data-testid="replacement-request-form"]')).toBeVisible();
        
        // Fill reason
        await page.fill('[data-testid="replacement-reason"]', 'BM is suspended');
        await page.click('[data-testid="submit-replacement-request"]');
        
        // Should show success message
        await pageHelpers.expectToastMessage('Replacement request submitted successfully');
      }
    });

    test('should track replacement request status', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      
      // Navigate to replacement requests
      await page.click('[data-testid="replacement-requests-tab"]');
      
      // Should show replacement requests list
      await expect(page.locator('[data-testid="replacement-requests"]')).toBeVisible();
      
      // Check status of first request
      const firstRequest = page.locator('[data-testid="replacement-request-item"]').first();
      if (await firstRequest.count() > 0) {
        await expect(firstRequest.locator('[data-testid="request-status"]')).toBeVisible();
      }
    });
  });

  test.describe('BM Performance Metrics', () => {
    test('should display BM performance data', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      
      // Find bound BM
      const boundBM = page.locator('[data-testid="bound-bm-item"]').first();
      if (await boundBM.count() > 0) {
        await boundBM.locator('[data-testid="view-performance"]').click();
        
        // Should show performance metrics
        await expect(page.locator('[data-testid="performance-metrics"]')).toBeVisible();
        await expect(page.locator('[data-testid="spend-chart"]')).toBeVisible();
        await expect(page.locator('[data-testid="account-status"]')).toBeVisible();
      }
    });

    test('should show BM health status', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      
      // BM items should show health indicators
      const bmItems = page.locator('[data-testid="bound-bm-item"]');
      const count = await bmItems.count();
      
      for (let i = 0; i < count; i++) {
        const healthIndicator = bmItems.nth(i).locator('[data-testid="health-indicator"]');
        await expect(healthIndicator).toBeVisible();
        
        const healthStatus = await healthIndicator.textContent();
        expect(healthStatus).toMatch(/(healthy|warning|critical)/);
      }
    });
  });

  test.describe('BM Provider Integration', () => {
    test('should show BlueFocus provider status', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      
      // Find BlueFocus BM
      const blueFocusBM = page.locator('[data-testid="bound-bm-item"]')
        .filter({ has: page.locator('[data-testid="provider"]:has-text("BlueFocus")') })
        .first();
      
      if (await blueFocusBM.count() > 0) {
        await expect(blueFocusBM.locator('[data-testid="provider-status"]')).toBeVisible();
        await expect(blueFocusBM.locator('[data-testid="provider-logo"]')).toBeVisible();
      }
    });

    test('should handle provider API errors', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      
      // Mock provider API error
      await page.evaluate(() => {
        window.localStorage.setItem('mock_provider_error', 'true');
      });
      
      await page.reload();
      
      // Should show error state
      await expect(page.locator('[data-testid="provider-error"]')).toBeVisible();
      await expect(page.locator('text=Unable to connect to provider')).toBeVisible();
    });
  });

  test.describe('BM Notifications', () => {
    test('should show BM application updates', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      
      // Mock status update notification
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('bm-status-update', {
          detail: { status: 'approved', bmName: 'Test BM' }
        }));
      });
      
      await pageHelpers.expectToastMessage('Business Manager application approved');
    });

    test('should show BM binding notifications', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToBusinessManagers();
      
      // Mock binding notification
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('bm-bound', {
          detail: { bmName: 'Test BM' }
        }));
      });
      
      await pageHelpers.expectToastMessage('Business Manager bound successfully');
    });
  });
}); 
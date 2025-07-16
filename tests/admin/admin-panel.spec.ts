import { test, expect, createTestUser, TEST_CONFIG, DatabaseCleaner } from '../utils/test-helpers';

test.describe('Admin Panel', () => {
  let testUser: ReturnType<typeof createTestUser>;
  let adminUser: ReturnType<typeof createTestUser>;
  let dbCleaner: DatabaseCleaner;

  test.beforeEach(async ({ page, pageHelpers }) => {
    testUser = createTestUser();
    adminUser = createTestUser();
    adminUser.email = 'admin@adhub.com'; // Override with admin email
    dbCleaner = new DatabaseCleaner();
    
    // Setup authenticated admin user
    await page.goto(`${TEST_CONFIG.baseURL}/login`);
    await pageHelpers.fillLoginForm(adminUser.email, adminUser.password);
    await pageHelpers.waitForAuthState();
  });

  test.afterEach(async () => {
    await dbCleaner.cleanupTestUser(testUser.email);
    await dbCleaner.cleanupTestUser(adminUser.email);
  });

  test.describe('Admin Authentication', () => {
    test('should redirect non-admin users', async ({ page, pageHelpers }) => {
      // Logout admin
      await page.click('[data-testid="logout-button"]');
      
      // Login as regular user
      await pageHelpers.fillLoginForm(testUser.email, testUser.password);
      await pageHelpers.waitForAuthState();
      
      // Try to access admin panel
      await page.goto(`${TEST_CONFIG.baseURL}/admin`);
      
      // Should redirect to dashboard or show access denied
      await expect(page).toHaveURL(/dashboard|access-denied/);
    });

    test('should allow admin access', async ({ page }) => {
      // Navigate to admin panel
      await page.goto(`${TEST_CONFIG.baseURL}/admin`);
      
      // Should load admin dashboard
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
      await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    });

    test('should show admin navigation menu', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin`);
      
      // Should show admin navigation
      await expect(page.locator('[data-testid="admin-nav"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-users"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-organizations"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-applications"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-analytics"]')).toBeVisible();
    });
  });

  test.describe('User Management', () => {
    test('should display users list', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/users`);
      
      // Should show users table
      await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="users-header"]')).toBeVisible();
    });

    test('should search users by email', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/users`);
      
      // Search for specific user
      await page.fill('[data-testid="user-search"]', testUser.email);
      await page.click('[data-testid="search-button"]');
      
      // Should filter results
      const userRows = page.locator('[data-testid="user-row"]');
      const count = await userRows.count();
      
      for (let i = 0; i < count; i++) {
        const emailCell = userRows.nth(i).locator('[data-testid="user-email"]');
        await expect(emailCell).toContainText(testUser.email);
      }
    });

    test('should filter users by status', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/users`);
      
      // Apply status filter
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="filter-active"]');
      
      // Should show only active users
      const userRows = page.locator('[data-testid="user-row"]');
      const count = await userRows.count();
      
      for (let i = 0; i < count; i++) {
        const statusBadge = userRows.nth(i).locator('[data-testid="user-status"]');
        await expect(statusBadge).toContainText('active');
      }
    });

    test('should view user details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/users`);
      
      // Click on first user
      const firstUser = page.locator('[data-testid="user-row"]').first();
      await firstUser.click();
      
      // Should show user details modal
      await expect(page.locator('[data-testid="user-details-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-organizations"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-activity"]')).toBeVisible();
    });

    test('should suspend user account', async ({ page, pageHelpers }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/users`);
      
      // Find active user
      const activeUser = page.locator('[data-testid="user-row"]')
        .filter({ has: page.locator('[data-testid="user-status"]:has-text("active")') })
        .first();
      
      if (await activeUser.count() > 0) {
        await activeUser.locator('[data-testid="suspend-user"]').click();
        
        // Should show suspension confirmation
        await expect(page.locator('[data-testid="suspend-confirmation"]')).toBeVisible();
        await page.fill('[data-testid="suspension-reason"]', 'Policy violation');
        await page.click('[data-testid="confirm-suspend"]');
        
        await pageHelpers.expectToastMessage('User suspended successfully');
        
        // Status should update
        await expect(activeUser.locator('[data-testid="user-status"]')).toContainText('suspended');
      }
    });

    test('should reactivate suspended user', async ({ page, pageHelpers }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/users`);
      
      // Find suspended user
      const suspendedUser = page.locator('[data-testid="user-row"]')
        .filter({ has: page.locator('[data-testid="user-status"]:has-text("suspended")') })
        .first();
      
      if (await suspendedUser.count() > 0) {
        await suspendedUser.locator('[data-testid="reactivate-user"]').click();
        
        // Should show reactivation confirmation
        await expect(page.locator('[data-testid="reactivate-confirmation"]')).toBeVisible();
        await page.click('[data-testid="confirm-reactivate"]');
        
        await pageHelpers.expectToastMessage('User reactivated successfully');
        
        // Status should update
        await expect(suspendedUser.locator('[data-testid="user-status"]')).toContainText('active');
      }
    });

    test('should export users data', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/users`);
      
      // Export users data
      await page.click('[data-testid="export-users"]');
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toContain('users');
      expect(download.suggestedFilename()).toContain('.csv');
    });
  });

  test.describe('Organization Oversight', () => {
    test('should display organizations list', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/organizations`);
      
      // Should show organizations table
      await expect(page.locator('[data-testid="organizations-table"]')).toBeVisible();
      await expect(page.locator('text=Organizations')).toBeVisible();
    });

    test('should view organization details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/organizations`);
      
      // Click on first organization
      const firstOrg = page.locator('[data-testid="org-row"]').first();
      await firstOrg.click();
      
      // Should show organization details
      await expect(page.locator('[data-testid="org-details-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="org-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="org-members"]')).toBeVisible();
      await expect(page.locator('[data-testid="org-spend"]')).toBeVisible();
    });

    test('should monitor organization spending', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/organizations`);
      
      const firstOrg = page.locator('[data-testid="org-row"]').first();
      await firstOrg.click();
      
      // Navigate to spending tab
      await page.click('[data-testid="spending-tab"]');
      
      // Should show spending analytics
      await expect(page.locator('[data-testid="spend-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="monthly-spend"]')).toBeVisible();
      await expect(page.locator('[data-testid="spend-trends"]')).toBeVisible();
    });

    test('should set organization limits', async ({ page, pageHelpers }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/organizations`);
      
      const firstOrg = page.locator('[data-testid="org-row"]').first();
      await firstOrg.click();
      
      // Navigate to limits tab
      await page.click('[data-testid="limits-tab"]');
      
      // Update limits
      await page.fill('[data-testid="monthly-limit"]', '10000');
      await page.fill('[data-testid="bm-limit"]', '5');
      await page.click('[data-testid="save-limits"]');
      
      await pageHelpers.expectToastMessage('Organization limits updated');
    });

    test('should flag suspicious organizations', async ({ page, pageHelpers }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/organizations`);
      
      const firstOrg = page.locator('[data-testid="org-row"]').first();
      await firstOrg.locator('[data-testid="flag-org"]').click();
      
      // Should show flagging form
      await expect(page.locator('[data-testid="flag-form"]')).toBeVisible();
      await page.fill('[data-testid="flag-reason"]', 'Suspicious spending pattern');
      await page.selectOption('[data-testid="flag-severity"]', 'high');
      await page.click('[data-testid="submit-flag"]');
      
      await pageHelpers.expectToastMessage('Organization flagged successfully');
    });
  });

  test.describe('Application Processing', () => {
    test('should display pending applications', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/applications`);
      
      // Should show applications queue
      await expect(page.locator('[data-testid="applications-queue"]')).toBeVisible();
      await expect(page.locator('text=Pending Applications')).toBeVisible();
    });

    test('should filter applications by type', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/applications`);
      
      // Apply type filter
      await page.click('[data-testid="type-filter"]');
      await page.click('[data-testid="filter-business-manager"]');
      
      // Should show only BM applications
      const applications = page.locator('[data-testid="application-item"]');
      const count = await applications.count();
      
      for (let i = 0; i < count; i++) {
        const typeLabel = applications.nth(i).locator('[data-testid="application-type"]');
        await expect(typeLabel).toContainText('Business Manager');
      }
    });

    test('should review application details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/applications`);
      
      // Click on first application
      const firstApp = page.locator('[data-testid="application-item"]').first();
      await firstApp.click();
      
      // Should show application review modal
      await expect(page.locator('[data-testid="application-review-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="application-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="applicant-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="review-actions"]')).toBeVisible();
    });

    test('should approve application', async ({ page, pageHelpers }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/applications`);
      
      const firstApp = page.locator('[data-testid="application-item"]').first();
      await firstApp.click();
      
      // Approve application
      await page.click('[data-testid="approve-application"]');
      
      // Should show approval confirmation
      await expect(page.locator('[data-testid="approval-confirmation"]')).toBeVisible();
      await page.fill('[data-testid="approval-notes"]', 'Application meets all requirements');
      await page.click('[data-testid="confirm-approve"]');
      
      await pageHelpers.expectToastMessage('Application approved successfully');
    });

    test('should reject application', async ({ page, pageHelpers }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/applications`);
      
      const firstApp = page.locator('[data-testid="application-item"]').first();
      await firstApp.click();
      
      // Reject application
      await page.click('[data-testid="reject-application"]');
      
      // Should show rejection form
      await expect(page.locator('[data-testid="rejection-form"]')).toBeVisible();
      await page.fill('[data-testid="rejection-reason"]', 'Insufficient documentation');
      await page.click('[data-testid="confirm-reject"]');
      
      await pageHelpers.expectToastMessage('Application rejected');
    });

    test('should request additional information', async ({ page, pageHelpers }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/applications`);
      
      const firstApp = page.locator('[data-testid="application-item"]').first();
      await firstApp.click();
      
      // Request more info
      await page.click('[data-testid="request-info"]');
      
      // Should show info request form
      await expect(page.locator('[data-testid="info-request-form"]')).toBeVisible();
      await page.fill('[data-testid="info-request-message"]', 'Please provide additional business documents');
      await page.click('[data-testid="send-info-request"]');
      
      await pageHelpers.expectToastMessage('Information request sent');
    });

    test('should bulk process applications', async ({ page, pageHelpers }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/applications`);
      
      // Select multiple applications
      await page.click('[data-testid="select-all-applications"]');
      
      // Bulk approve
      await page.click('[data-testid="bulk-actions"]');
      await page.click('[data-testid="bulk-approve"]');
      
      // Should show bulk confirmation
      await expect(page.locator('[data-testid="bulk-confirmation"]')).toBeVisible();
      await page.click('[data-testid="confirm-bulk-action"]');
      
      await pageHelpers.expectToastMessage('Applications processed successfully');
    });
  });

  test.describe('Financial Monitoring', () => {
    test('should display financial overview', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/financial`);
      
      // Should show financial dashboard
      await expect(page.locator('[data-testid="financial-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
      await expect(page.locator('[data-testid="monthly-transactions"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-volume"]')).toBeVisible();
    });

    test('should monitor transaction patterns', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/financial`);
      
      // Navigate to transactions tab
      await page.click('[data-testid="transactions-tab"]');
      
      // Should show transaction analytics
      await expect(page.locator('[data-testid="transaction-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="transaction-trends"]')).toBeVisible();
    });

    test('should detect suspicious transactions', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/financial`);
      await page.click('[data-testid="transactions-tab"]');
      
      // Should show flagged transactions
      await expect(page.locator('[data-testid="flagged-transactions"]')).toBeVisible();
      
      // Check for suspicious patterns
      const flaggedItems = page.locator('[data-testid="flagged-transaction-item"]');
      const count = await flaggedItems.count();
      
      for (let i = 0; i < count; i++) {
        await expect(flaggedItems.nth(i).locator('[data-testid="flag-reason"]')).toBeVisible();
        await expect(flaggedItems.nth(i).locator('[data-testid="risk-level"]')).toBeVisible();
      }
    });

    test('should export financial reports', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/financial`);
      
      // Export financial data
      await page.click('[data-testid="export-financial"]');
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-excel"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toContain('financial-report');
      expect(download.suggestedFilename()).toContain('.xlsx');
    });
  });

  test.describe('System Health Monitoring', () => {
    test('should display system status', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/system`);
      
      // Should show system health dashboard
      await expect(page.locator('[data-testid="system-health"]')).toBeVisible();
      await expect(page.locator('[data-testid="api-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="database-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="external-services"]')).toBeVisible();
    });

    test('should show service uptime', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/system`);
      
      // Should show uptime metrics
      await expect(page.locator('[data-testid="uptime-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="uptime-percentage"]')).toBeVisible();
    });

    test('should monitor API performance', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/system`);
      
      // Navigate to performance tab
      await page.click('[data-testid="performance-tab"]');
      
      // Should show performance metrics
      await expect(page.locator('[data-testid="response-times"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-rates"]')).toBeVisible();
      await expect(page.locator('[data-testid="throughput"]')).toBeVisible();
    });

    test('should show error logs', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/system`);
      
      // Navigate to logs tab
      await page.click('[data-testid="logs-tab"]');
      
      // Should show error logs
      await expect(page.locator('[data-testid="error-logs"]')).toBeVisible();
      await expect(page.locator('[data-testid="log-entries"]')).toBeVisible();
    });

    test('should filter logs by severity', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/system`);
      await page.click('[data-testid="logs-tab"]');
      
      // Apply severity filter
      await page.click('[data-testid="severity-filter"]');
      await page.click('[data-testid="filter-error"]');
      
      // Should show only error logs
      const logEntries = page.locator('[data-testid="log-entry"]');
      const count = await logEntries.count();
      
      for (let i = 0; i < count; i++) {
        const severity = logEntries.nth(i).locator('[data-testid="log-severity"]');
        await expect(severity).toContainText('error');
      }
    });
  });

  test.describe('Admin Analytics', () => {
    test('should display admin analytics dashboard', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/analytics`);
      
      // Should show analytics overview
      await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-growth"]')).toBeVisible();
      await expect(page.locator('[data-testid="revenue-trends"]')).toBeVisible();
      await expect(page.locator('[data-testid="conversion-rates"]')).toBeVisible();
    });

    test('should show user acquisition metrics', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/analytics`);
      
      // Navigate to acquisition tab
      await page.click('[data-testid="acquisition-tab"]');
      
      // Should show acquisition metrics
      await expect(page.locator('[data-testid="acquisition-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="signup-sources"]')).toBeVisible();
      await expect(page.locator('[data-testid="conversion-funnel"]')).toBeVisible();
    });

    test('should analyze user behavior', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/analytics`);
      
      // Navigate to behavior tab
      await page.click('[data-testid="behavior-tab"]');
      
      // Should show behavior analytics
      await expect(page.locator('[data-testid="user-journey"]')).toBeVisible();
      await expect(page.locator('[data-testid="feature-usage"]')).toBeVisible();
      await expect(page.locator('[data-testid="retention-rates"]')).toBeVisible();
    });

    test('should generate custom reports', async ({ page, pageHelpers }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/analytics`);
      
      // Navigate to reports tab
      await page.click('[data-testid="reports-tab"]');
      
      // Create custom report
      await page.click('[data-testid="create-report"]');
      
      // Configure report
      await page.fill('[data-testid="report-name"]', 'Monthly User Activity');
      await page.selectOption('[data-testid="report-type"]', 'user-activity');
      await page.fill('[data-testid="date-range"]', '2024-01-01,2024-01-31');
      await page.click('[data-testid="generate-report"]');
      
      await pageHelpers.expectToastMessage('Report generated successfully');
    });
  });

  test.describe('Admin Audit Trail', () => {
    test('should log admin actions', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/audit`);
      
      // Should show audit log
      await expect(page.locator('[data-testid="audit-log"]')).toBeVisible();
      await expect(page.locator('[data-testid="audit-entries"]')).toBeVisible();
    });

    test('should filter audit log by action type', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/audit`);
      
      // Apply action filter
      await page.click('[data-testid="action-filter"]');
      await page.click('[data-testid="filter-user-suspend"]');
      
      // Should show only suspension actions
      const auditEntries = page.locator('[data-testid="audit-entry"]');
      const count = await auditEntries.count();
      
      for (let i = 0; i < count; i++) {
        const action = auditEntries.nth(i).locator('[data-testid="audit-action"]');
        await expect(action).toContainText('suspend');
      }
    });

    test('should search audit log by admin user', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/audit`);
      
      // Search by admin user
      await page.fill('[data-testid="admin-search"]', adminUser.email);
      await page.click('[data-testid="search-audit"]');
      
      // Should show actions by specific admin
      const auditEntries = page.locator('[data-testid="audit-entry"]');
      const count = await auditEntries.count();
      
      for (let i = 0; i < count; i++) {
        const adminEmail = auditEntries.nth(i).locator('[data-testid="admin-email"]');
        await expect(adminEmail).toContainText(adminUser.email);
      }
    });

    test('should export audit log', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/audit`);
      
      // Export audit log
      await page.click('[data-testid="export-audit"]');
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toContain('audit-log');
      expect(download.suggestedFilename()).toContain('.csv');
    });
  });
}); 
import { test, expect, createTestUser, createTestOrganization, TEST_CONFIG, DatabaseCleaner } from '../utils/test-helpers';

test.describe('Organization Management', () => {
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

  test.describe('Organization Creation', () => {
    test('should create new organization', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      
      await page.click('[data-testid="create-organization"]');
      
      // Should show creation form
      await expect(page.locator('[data-testid="org-creation-form"]')).toBeVisible();
      
      // Fill organization details
      await page.fill('[data-testid="org-name"]', testOrg.name);
      await page.selectOption('[data-testid="org-industry"]', testOrg.industry);
      await page.selectOption('[data-testid="org-monthly-spend"]', testOrg.ad_spend_monthly);
      await page.selectOption('[data-testid="org-timezone"]', testOrg.timezone);
      await page.selectOption('[data-testid="org-heard-about"]', testOrg.how_heard_about_us);
      
      await page.click('[data-testid="create-org-submit"]');
      
      // Should show success message
      await pageHelpers.expectToastMessage('Organization created successfully');
      
      // Should redirect to organization dashboard
      await expect(page).toHaveURL(/dashboard/);
    });

    test('should validate organization name uniqueness', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="create-organization"]');
      
      // Try to create org with existing name
      await page.fill('[data-testid="org-name"]', 'Existing Organization');
      await page.selectOption('[data-testid="org-industry"]', 'Technology');
      await page.click('[data-testid="create-org-submit"]');
      
      // Should show error message
      await expect(page.locator('text=Organization name already exists')).toBeVisible();
    });

    test('should validate required fields', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="create-organization"]');
      
      // Try to submit without required fields
      await page.click('[data-testid="create-org-submit"]');
      
      // Should show validation errors
      await expect(page.locator('text=Organization name is required')).toBeVisible();
      await expect(page.locator('text=Industry is required')).toBeVisible();
      await expect(page.locator('text=Monthly ad spend is required')).toBeVisible();
    });

    test('should save organization as draft', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="create-organization"]');
      
      // Fill partial form
      await page.fill('[data-testid="org-name"]', 'Draft Organization');
      await page.selectOption('[data-testid="org-industry"]', 'Technology');
      
      await page.click('[data-testid="save-draft"]');
      
      // Should show draft saved message
      await pageHelpers.expectToastMessage('Organization draft saved');
      
      // Should show draft in organizations list
      await expect(page.locator('[data-testid="draft-organization"]')).toBeVisible();
    });
  });

  test.describe('Organization Switching', () => {
    test('should display organization selector', async ({ page }) => {
      // Should show organization selector in header
      await expect(page.locator('[data-testid="org-selector"]')).toBeVisible();
      await expect(page.locator('[data-testid="current-org-name"]')).toBeVisible();
    });

    test('should switch between organizations', async ({ page, pageHelpers }) => {
      // Click organization selector
      await page.click('[data-testid="org-selector"]');
      
      // Should show organization list
      await expect(page.locator('[data-testid="org-list"]')).toBeVisible();
      
      // Switch to different organization
      const secondOrg = page.locator('[data-testid="org-option"]').nth(1);
      if (await secondOrg.count() > 0) {
        const orgName = await secondOrg.textContent();
        await secondOrg.click();
        
        // Should update current organization
        await expect(page.locator('[data-testid="current-org-name"]')).toContainText(orgName || '');
        
        // Should show success message
        await pageHelpers.expectToastMessage('Switched to organization');
      }
    });

    test('should persist organization selection', async ({ page }) => {
      // Switch organization
      await page.click('[data-testid="org-selector"]');
      const secondOrg = page.locator('[data-testid="org-option"]').nth(1);
      
      if (await secondOrg.count() > 0) {
        const orgName = await secondOrg.textContent();
        await secondOrg.click();
        
        // Refresh page
        await page.reload();
        
        // Should still show selected organization
        await expect(page.locator('[data-testid="current-org-name"]')).toContainText(orgName || '');
      }
    });

    test('should show organization creation option in selector', async ({ page }) => {
      await page.click('[data-testid="org-selector"]');
      
      // Should show create new organization option
      await expect(page.locator('[data-testid="create-new-org"]')).toBeVisible();
      
      // Click should open creation form
      await page.click('[data-testid="create-new-org"]');
      await expect(page.locator('[data-testid="org-creation-form"]')).toBeVisible();
    });
  });

  test.describe('Organization Settings', () => {
    test('should display organization settings', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      
      // Navigate to settings
      await page.click('[data-testid="org-settings"]');
      
      // Should show settings form
      await expect(page.locator('[data-testid="org-settings-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="org-name-setting"]')).toBeVisible();
      await expect(page.locator('[data-testid="org-industry-setting"]')).toBeVisible();
    });

    test('should update organization name', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="org-settings"]');
      
      // Update organization name
      const newName = `Updated ${testOrg.name}`;
      await page.fill('[data-testid="org-name-setting"]', newName);
      await page.click('[data-testid="save-settings"]');
      
      // Should show success message
      await pageHelpers.expectToastMessage('Organization settings updated');
      
      // Should update in selector
      await expect(page.locator('[data-testid="current-org-name"]')).toContainText(newName);
    });

    test('should update organization industry', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="org-settings"]');
      
      // Update industry
      await page.selectOption('[data-testid="org-industry-setting"]', 'Healthcare');
      await page.click('[data-testid="save-settings"]');
      
      await pageHelpers.expectToastMessage('Organization settings updated');
    });

    test('should update organization timezone', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="org-settings"]');
      
      // Update timezone
      await page.selectOption('[data-testid="org-timezone-setting"]', 'America/New_York');
      await page.click('[data-testid="save-settings"]');
      
      await pageHelpers.expectToastMessage('Organization settings updated');
    });

    test('should validate organization name change', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="org-settings"]');
      
      // Try to set empty name
      await page.fill('[data-testid="org-name-setting"]', '');
      await page.click('[data-testid="save-settings"]');
      
      await expect(page.locator('text=Organization name cannot be empty')).toBeVisible();
    });
  });

  test.describe('Team Management', () => {
    test('should display team members list', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      
      // Navigate to team tab
      await page.click('[data-testid="team-tab"]');
      
      // Should show team members
      await expect(page.locator('[data-testid="team-members-list"]')).toBeVisible();
      await expect(page.locator('text=Team Members')).toBeVisible();
    });

    test('should invite team member', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="team-tab"]');
      
      await page.click('[data-testid="invite-member"]');
      
      // Should show invite form
      await expect(page.locator('[data-testid="invite-form"]')).toBeVisible();
      
      // Fill invite details
      await page.fill('[data-testid="invite-email"]', 'newmember@example.com');
      await page.selectOption('[data-testid="invite-role"]', 'member');
      await page.click('[data-testid="send-invite"]');
      
      // Should show success message
      await pageHelpers.expectToastMessage('Team member invited successfully');
    });

    test('should validate invite email format', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="team-tab"]');
      await page.click('[data-testid="invite-member"]');
      
      // Try invalid email
      await page.fill('[data-testid="invite-email"]', 'invalid-email');
      await page.click('[data-testid="send-invite"]');
      
      await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    });

    test('should show pending invitations', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="team-tab"]');
      
      // Should show pending invitations section
      await expect(page.locator('[data-testid="pending-invitations"]')).toBeVisible();
      
      // Should show invited members
      const pendingInvites = page.locator('[data-testid="pending-invite-item"]');
      const count = await pendingInvites.count();
      
      for (let i = 0; i < count; i++) {
        await expect(pendingInvites.nth(i).locator('[data-testid="invite-email"]')).toBeVisible();
        await expect(pendingInvites.nth(i).locator('[data-testid="invite-status"]')).toContainText('pending');
      }
    });

    test('should cancel pending invitation', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="team-tab"]');
      
      // Find pending invitation
      const pendingInvite = page.locator('[data-testid="pending-invite-item"]').first();
      if (await pendingInvite.count() > 0) {
        await pendingInvite.locator('[data-testid="cancel-invite"]').click();
        
        // Confirm cancellation
        await expect(page.locator('[data-testid="cancel-invite-confirmation"]')).toBeVisible();
        await page.click('[data-testid="confirm-cancel-invite"]');
        
        await pageHelpers.expectToastMessage('Invitation cancelled');
      }
    });

    test('should resend invitation', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="team-tab"]');
      
      // Find pending invitation
      const pendingInvite = page.locator('[data-testid="pending-invite-item"]').first();
      if (await pendingInvite.count() > 0) {
        await pendingInvite.locator('[data-testid="resend-invite"]').click();
        
        await pageHelpers.expectToastMessage('Invitation resent');
      }
    });
  });

  test.describe('Role Management', () => {
    test('should display member roles', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="team-tab"]');
      
      // Should show role badges
      const members = page.locator('[data-testid="team-member-item"]');
      const count = await members.count();
      
      for (let i = 0; i < count; i++) {
        const roleBadge = members.nth(i).locator('[data-testid="member-role"]');
        await expect(roleBadge).toBeVisible();
        
        const roleText = await roleBadge.textContent();
        expect(roleText).toMatch(/(owner|admin|member)/);
      }
    });

    test('should change member role', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="team-tab"]');
      
      // Find member (not owner)
      const member = page.locator('[data-testid="team-member-item"]')
        .filter({ hasNot: page.locator('[data-testid="member-role"]:has-text("owner")') })
        .first();
      
      if (await member.count() > 0) {
        await member.locator('[data-testid="change-role"]').click();
        
        // Should show role selection
        await expect(page.locator('[data-testid="role-selector"]')).toBeVisible();
        
        // Change to admin
        await page.selectOption('[data-testid="role-selector"]', 'admin');
        await page.click('[data-testid="confirm-role-change"]');
        
        await pageHelpers.expectToastMessage('Member role updated');
        
        // Should update role badge
        await expect(member.locator('[data-testid="member-role"]')).toContainText('admin');
      }
    });

    test('should not allow changing owner role', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="team-tab"]');
      
      // Find owner
      const owner = page.locator('[data-testid="team-member-item"]')
        .filter({ has: page.locator('[data-testid="member-role"]:has-text("owner")') })
        .first();
      
      if (await owner.count() > 0) {
        // Change role button should not be visible for owner
        await expect(owner.locator('[data-testid="change-role"]')).not.toBeVisible();
      }
    });

    test('should show role permissions', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="team-tab"]');
      
      // Click on role info
      await page.click('[data-testid="role-info"]');
      
      // Should show permissions modal
      await expect(page.locator('[data-testid="role-permissions-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="owner-permissions"]')).toBeVisible();
      await expect(page.locator('[data-testid="admin-permissions"]')).toBeVisible();
      await expect(page.locator('[data-testid="member-permissions"]')).toBeVisible();
    });
  });

  test.describe('Member Removal', () => {
    test('should remove team member', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="team-tab"]');
      
      // Find removable member
      const member = page.locator('[data-testid="team-member-item"]')
        .filter({ hasNot: page.locator('[data-testid="member-role"]:has-text("owner")') })
        .first();
      
      if (await member.count() > 0) {
        await member.locator('[data-testid="remove-member"]').click();
        
        // Should show removal confirmation
        await expect(page.locator('[data-testid="remove-member-confirmation"]')).toBeVisible();
        await page.click('[data-testid="confirm-remove-member"]');
        
        await pageHelpers.expectToastMessage('Team member removed');
      }
    });

    test('should not allow removing organization owner', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="team-tab"]');
      
      // Find owner
      const owner = page.locator('[data-testid="team-member-item"]')
        .filter({ has: page.locator('[data-testid="member-role"]:has-text("owner")') })
        .first();
      
      if (await owner.count() > 0) {
        // Remove button should not be visible for owner
        await expect(owner.locator('[data-testid="remove-member"]')).not.toBeVisible();
      }
    });

    test('should handle member removal errors', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="team-tab"]');
      
      // Mock removal error
      await page.evaluate(() => {
        window.localStorage.setItem('mock_removal_error', 'true');
      });
      
      const member = page.locator('[data-testid="team-member-item"]')
        .filter({ hasNot: page.locator('[data-testid="member-role"]:has-text("owner")') })
        .first();
      
      if (await member.count() > 0) {
        await member.locator('[data-testid="remove-member"]').click();
        await page.click('[data-testid="confirm-remove-member"]');
        
        await pageHelpers.expectToastMessage('Failed to remove team member');
      }
    });
  });

  test.describe('Organization Deletion', () => {
    test('should show organization deletion option', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="org-settings"]');
      
      // Navigate to danger zone
      await page.click('[data-testid="danger-zone-tab"]');
      
      // Should show deletion option
      await expect(page.locator('[data-testid="delete-organization"]')).toBeVisible();
      await expect(page.locator('text=Delete Organization')).toBeVisible();
    });

    test('should require confirmation for organization deletion', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="org-settings"]');
      await page.click('[data-testid="danger-zone-tab"]');
      
      await page.click('[data-testid="delete-organization"]');
      
      // Should show confirmation modal
      await expect(page.locator('[data-testid="delete-org-confirmation"]')).toBeVisible();
      await expect(page.locator('text=Type the organization name to confirm')).toBeVisible();
    });

    test('should validate organization name for deletion', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="org-settings"]');
      await page.click('[data-testid="danger-zone-tab"]');
      
      await page.click('[data-testid="delete-organization"]');
      
      // Try with wrong name
      await page.fill('[data-testid="confirm-org-name"]', 'Wrong Name');
      await page.click('[data-testid="confirm-delete-org"]');
      
      await expect(page.locator('text=Organization name does not match')).toBeVisible();
    });

    test('should delete organization with correct confirmation', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="org-settings"]');
      await page.click('[data-testid="danger-zone-tab"]');
      
      await page.click('[data-testid="delete-organization"]');
      
      // Enter correct organization name
      await page.fill('[data-testid="confirm-org-name"]', testOrg.name);
      await page.click('[data-testid="confirm-delete-org"]');
      
      // Should show success message and redirect
      await pageHelpers.expectToastMessage('Organization deleted successfully');
      await expect(page).toHaveURL(/dashboard/);
    });
  });

  test.describe('Organization Analytics', () => {
    test('should display organization overview', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      
      // Navigate to analytics tab
      await page.click('[data-testid="analytics-tab"]');
      
      // Should show overview metrics
      await expect(page.locator('[data-testid="org-overview"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-spend"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-accounts"]')).toBeVisible();
      await expect(page.locator('[data-testid="team-size"]')).toBeVisible();
    });

    test('should show spend analytics', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="analytics-tab"]');
      
      // Should show spend charts
      await expect(page.locator('[data-testid="spend-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="monthly-spend"]')).toBeVisible();
      await expect(page.locator('[data-testid="spend-trend"]')).toBeVisible();
    });

    test('should export organization data', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      await page.click('[data-testid="analytics-tab"]');
      
      // Export organization data
      await page.click('[data-testid="export-org-data"]');
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toContain('organization-data');
      expect(download.suggestedFilename()).toContain('.csv');
    });
  });

  test.describe('Organization Notifications', () => {
    test('should show team member join notifications', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      
      // Mock member join notification
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('member-joined', {
          detail: { memberName: 'John Doe', memberEmail: 'john@example.com' }
        }));
      });
      
      await pageHelpers.expectToastMessage('John Doe joined the organization');
    });

    test('should show organization limit notifications', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      
      // Mock limit reached notification
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('org-limit-reached', {
          detail: { limitType: 'team_members', currentCount: 5, maxCount: 5 }
        }));
      });
      
      await pageHelpers.expectToastMessage('Team member limit reached');
    });

    test('should show billing notifications', async ({ page, pageHelpers }) => {
      await pageHelpers.navigateToOrganizations();
      
      // Mock billing notification
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('billing-issue', {
          detail: { type: 'payment_failed', amount: 99.99 }
        }));
      });
      
      await pageHelpers.expectToastMessage('Payment failed');
    });
  });
}); 
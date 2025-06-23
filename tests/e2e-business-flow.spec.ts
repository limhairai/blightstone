/**
 * End-to-End Business Flow Test
 * Tests complete user journey using demo data - no real auth or payments
 */

import { test, expect } from '@playwright/test'

test.describe('Complete Business Workflow - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Set demo mode to avoid real auth
    await page.addInitScript(() => {
      window.localStorage.setItem('demo_mode', 'true')
    })
  })

  test('should complete full business onboarding flow', async ({ page }) => {
    // Step 1: Visit landing page
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('AdHub')

    // Step 2: Go to register (will use demo mode)
    await page.click('[data-testid="get-started-button"], a[href="/register"]')
    await expect(page).toHaveURL('/register')

    // Step 3: Fill registration form (demo mode will bypass real auth)
    await page.fill('[data-testid="email-input"]', 'test@techcorp.com')
    await page.fill('[data-testid="password-input"]', 'secure-password')
    await page.fill('[data-testid="name-input"]', 'John Doe')
    await page.click('[data-testid="register-button"]')

    // Step 4: Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()

    // Step 5: Navigate to businesses page
    await page.click('[data-testid="businesses-nav"], a[href="/dashboard/businesses"]')
    await expect(page).toHaveURL('/dashboard/businesses')

    // Step 6: Create new business
    await page.click('[data-testid="create-business-button"]')
    await page.fill('[data-testid="business-name-input"]', 'TechCorp Marketing')
    await page.selectOption('[data-testid="business-type-select"]', 'Technology')
    await page.fill('[data-testid="business-website-input"]', 'https://techcorp.com')
    await page.fill('[data-testid="business-description-textarea"]', 'Marketing division of TechCorp')
    await page.click('[data-testid="submit-business-button"]')

    // Step 7: Verify business appears in list with pending status
    await expect(page.locator('[data-testid="business-list"]')).toContainText('TechCorp Marketing')
    await expect(page.locator('[data-testid="business-status"]')).toContainText('Pending')

    // Step 8: Check wallet (should show demo balance)
    await page.click('[data-testid="wallet-nav"], a[href="/dashboard/wallet"]')
    await expect(page).toHaveURL('/dashboard/wallet')
    await expect(page.locator('[data-testid="wallet-balance"]')).toContainText('$')

    // Step 9: Test wallet top-up (demo mode)
    await page.click('[data-testid="add-funds-button"]')
    await page.fill('[data-testid="amount-input"]', '500')
    await page.click('[data-testid="confirm-topup-button"]')
    
    // Should see updated balance
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('should handle admin approval workflow', async ({ page }) => {
    // Set admin mode
    await page.addInitScript(() => {
      window.localStorage.setItem('demo_mode', 'true')
      window.localStorage.setItem('demo_user_role', 'admin')
    })

    // Step 1: Go to admin panel
    await page.goto('/admin')
    await expect(page).toHaveURL('/admin')
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible()

    // Step 2: Navigate to applications
    await page.click('[data-testid="applications-nav"], a[href="/admin/applications"]')
    await expect(page).toHaveURL('/admin/applications')

    // Step 3: Should see pending applications
    await expect(page.locator('[data-testid="applications-table"]')).toBeVisible()
    await expect(page.locator('[data-testid="application-row"]').first()).toBeVisible()

    // Step 4: Approve first application
    await page.click('[data-testid="approve-button"]')
    await page.click('[data-testid="confirm-approval"]')
    
    // Should see success message
    await expect(page.locator('[data-testid="approval-success"]')).toBeVisible()

    // Step 5: Check assets page
    await page.click('[data-testid="assets-nav"], a[href="/admin/assets"]')
    await expect(page).toHaveURL('/admin/assets')

    // Step 6: Sync with Dolphin (demo mode)
    await page.click('[data-testid="sync-dolphin-button"]')
    await expect(page.locator('[data-testid="sync-progress"]')).toBeVisible()
    
    // Wait for sync to complete
    await expect(page.locator('[data-testid="sync-success"]')).toBeVisible({ timeout: 10000 })

    // Step 7: Bind asset to organization
    await page.click('[data-testid="bind-asset-button"]')
    await page.selectOption('[data-testid="organization-select"]', { label: "John's Organization" })
    await page.fill('[data-testid="spend-limit-input"]', '5000')
    await page.click('[data-testid="confirm-binding"]')
    
    // Should see binding success
    await expect(page.locator('[data-testid="binding-success"]')).toBeVisible()
  })

  test('should show client assets after binding', async ({ page }) => {
    // Set client mode with approved business
    await page.addInitScript(() => {
      window.localStorage.setItem('demo_mode', 'true')
      window.localStorage.setItem('demo_business_status', 'approved')
      window.localStorage.setItem('demo_has_assets', 'true')
    })

    // Step 1: Go to accounts page
    await page.goto('/dashboard/accounts')
    await expect(page).toHaveURL('/dashboard/accounts')

    // Step 2: Should see bound assets
    await expect(page.locator('[data-testid="accounts-table"]')).toBeVisible()
    await expect(page.locator('[data-testid="account-row"]').first()).toBeVisible()

    // Step 3: Verify account details
    const firstAccount = page.locator('[data-testid="account-row"]').first()
    await expect(firstAccount.locator('[data-testid="account-name"]')).toContainText('TechCorp BM')
    await expect(firstAccount.locator('[data-testid="account-status"]')).toContainText('Active')
    await expect(firstAccount.locator('[data-testid="spend-limit"]')).toContainText('$5,000')

    // Step 4: Check account performance
    await page.click('[data-testid="view-performance-button"]')
    await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="spend-metrics"]')).toBeVisible()
  })

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Step 1: Test network error handling
    await page.route('**/api/businesses', route => {
      route.fulfill({ status: 500, body: 'Server Error' })
    })

    await page.goto('/dashboard/businesses')
    await page.click('[data-testid="create-business-button"]')
    await page.fill('[data-testid="business-name-input"]', 'Test Business')
    await page.click('[data-testid="submit-business-button"]')

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to create business')

    // Step 2: Test validation errors
    await page.goto('/dashboard/businesses')
    await page.click('[data-testid="create-business-button"]')
    await page.click('[data-testid="submit-business-button"]') // Submit without filling

    // Should show validation errors
    await expect(page.locator('[data-testid="name-error"]')).toContainText('Business name is required')
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/dashboard')
    
    // Mobile navigation should work
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()
    
    // Should be able to navigate
    await page.click('[data-testid="businesses-mobile-nav"]')
    await expect(page).toHaveURL('/dashboard/businesses')
    
    // Tables should be scrollable on mobile
    await expect(page.locator('[data-testid="mobile-table-scroll"]')).toBeVisible()
  })
}) 
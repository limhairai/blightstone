import { test, expect } from '@playwright/test'

// Test data
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User'
}

const TEST_ORG = {
  name: 'Test Organization',
  description: 'A test organization for E2E testing'
}

test.describe('Critical User Flows', () => {
  
  test.describe('Authentication Flow', () => {
    test('user can register, login, and logout', async ({ page }) => {
      // Navigate to register page
      await page.goto('/register')
      
      // Fill registration form
      await page.fill('[data-testid="name-input"]', TEST_USER.name)
      await page.fill('[data-testid="email-input"]', TEST_USER.email)
      await page.fill('[data-testid="password-input"]', TEST_USER.password)
      await page.fill('[data-testid="confirm-password-input"]', TEST_USER.password)
      
      // Submit registration
      await page.click('[data-testid="register-button"]')
      
      // Should redirect to dashboard or email confirmation
      await expect(page).toHaveURL(/\/dashboard|\/confirm-email/)
      
      // If redirected to confirmation, navigate to login
      if (page.url().includes('/confirm-email')) {
        await page.goto('/login')
      }
      
      // Test login
      await page.fill('[data-testid="email-input"]', TEST_USER.email)
      await page.fill('[data-testid="password-input"]', TEST_USER.password)
      await page.click('[data-testid="login-button"]')
      
      // Should be redirected to dashboard
      await expect(page).toHaveURL('/dashboard')
      
      // Test logout
      await page.click('[data-testid="user-menu-trigger"]')
      await page.click('[data-testid="logout-button"]')
      
      // Should be redirected to login
      await expect(page).toHaveURL('/login')
    })
    
    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto('/login')
      
      await page.fill('[data-testid="email-input"]', 'invalid@example.com')
      await page.fill('[data-testid="password-input"]', 'wrongpassword')
      await page.click('[data-testid="login-button"]')
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    })
  })
  
  test.describe('Organization Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', TEST_USER.email)
      await page.fill('[data-testid="password-input"]', TEST_USER.password)
      await page.click('[data-testid="login-button"]')
      await expect(page).toHaveURL('/dashboard')
    })
    
    test('user can create and manage organization', async ({ page }) => {
      // Navigate to organization settings
      await page.click('[data-testid="organization-menu"]')
      await page.click('[data-testid="create-organization"]')
      
      // Fill organization form
      await page.fill('[data-testid="org-name-input"]', TEST_ORG.name)
      await page.fill('[data-testid="org-description-input"]', TEST_ORG.description)
      await page.click('[data-testid="create-org-button"]')
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      
      // Should be able to see organization in list
      await expect(page.locator('[data-testid="org-name"]')).toContainText(TEST_ORG.name)
      
      // Test organization switching
      await page.click('[data-testid="organization-menu"]')
      await page.click(`[data-testid="switch-to-${TEST_ORG.name}"]`)
      
      // Should update current organization display
      await expect(page.locator('[data-testid="current-org-name"]')).toContainText(TEST_ORG.name)
    })
    
    test('user can update organization settings', async ({ page }) => {
      // Navigate to organization settings
      await page.goto('/dashboard/settings/organization')
      
      // Update organization name
      await page.fill('[data-testid="org-name-input"]', 'Updated Organization Name')
      await page.click('[data-testid="save-org-button"]')
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      
      // Should reflect updated name
      await expect(page.locator('[data-testid="org-name-input"]')).toHaveValue('Updated Organization Name')
    })
  })
  
  test.describe('Wallet and Funding Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Login and navigate to wallet
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', TEST_USER.email)
      await page.fill('[data-testid="password-input"]', TEST_USER.password)
      await page.click('[data-testid="login-button"]')
      await page.goto('/dashboard/wallet')
    })
    
    test('user can view wallet balance and add funds', async ({ page }) => {
      // Should show wallet balance
      await expect(page.locator('[data-testid="wallet-balance"]')).toBeVisible()
      
      // Test add funds flow
      await page.fill('[data-testid="amount-input"]', '100')
      
      // Select payment method
      await page.click('[data-testid="payment-method-credit-card"]')
      
      // Click add funds button
      await page.click('[data-testid="add-funds-button"]')
      
      // Should redirect to payment provider or show payment form
      // Note: In test environment, this might redirect to a mock payment page
      await expect(page).toHaveURL(/stripe|payment|checkout/)
    })
    
    test('user can request bank transfer', async ({ page }) => {
      await page.fill('[data-testid="amount-input"]', '1000')
      
      // Select bank transfer
      await page.click('[data-testid="payment-method-bank-transfer"]')
      await page.click('[data-testid="add-funds-button"]')
      
      // Should open bank transfer dialog
      await expect(page.locator('[data-testid="bank-transfer-dialog"]')).toBeVisible()
      
      // Should show bank details
      await expect(page.locator('[data-testid="bank-details"]')).toBeVisible()
      
      // Submit bank transfer request
      await page.click('[data-testid="submit-transfer-button"]')
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    })
    
    test('user can create crypto payment', async ({ page }) => {
      await page.fill('[data-testid="amount-input"]', '500')
      
      // Select crypto payment
      await page.click('[data-testid="payment-method-crypto"]')
      await page.click('[data-testid="add-funds-button"]')
      
      // Should open crypto payment dialog
      await expect(page.locator('[data-testid="crypto-dialog"]')).toBeVisible()
      
      // Should show payment instructions
      await expect(page.locator('[data-testid="crypto-instructions"]')).toBeVisible()
      
      // Should have payment link or QR code
      await expect(page.locator('[data-testid="payment-link"]')).toBeVisible()
    })
    
    test('validates minimum amounts for different payment methods', async ({ page }) => {
      // Test credit card minimum
      await page.fill('[data-testid="amount-input"]', '5')
      await page.click('[data-testid="payment-method-credit-card"]')
      await page.click('[data-testid="add-funds-button"]')
      
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Minimum funding amount is $10')
      
      // Test bank transfer minimum
      await page.fill('[data-testid="amount-input"]', '25')
      await page.click('[data-testid="payment-method-bank-transfer"]')
      await page.click('[data-testid="add-funds-button"]')
      
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Minimum amount is $50')
    })
  })
  
  test.describe('Topup Requests Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Login and navigate to topup requests
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', TEST_USER.email)
      await page.fill('[data-testid="password-input"]', TEST_USER.password)
      await page.click('[data-testid="login-button"]')
      await page.goto('/dashboard/topup-requests')
    })
    
    test('user can view topup requests history', async ({ page }) => {
      // Should show topup requests table
      await expect(page.locator('[data-testid="topup-requests-table"]')).toBeVisible()
      
      // Should have table headers
      await expect(page.locator('[data-testid="table-header-amount"]')).toBeVisible()
      await expect(page.locator('[data-testid="table-header-status"]')).toBeVisible()
      await expect(page.locator('[data-testid="table-header-date"]')).toBeVisible()
    })
    
    test('user can filter topup requests by status', async ({ page }) => {
      // Open status filter
      await page.click('[data-testid="status-filter"]')
      
      // Select pending status
      await page.click('[data-testid="filter-pending"]')
      
      // Should filter table to show only pending requests
      const statusCells = page.locator('[data-testid="request-status"]')
      await expect(statusCells.first()).toContainText('Pending')
      
      // Test clearing filter
      await page.click('[data-testid="clear-filters"]')
      
      // Should show all requests again
      await expect(page.locator('[data-testid="topup-requests-table"]')).toBeVisible()
    })
    
    test('user can create new topup request', async ({ page }) => {
      // Click create new request
      await page.click('[data-testid="create-topup-request"]')
      
      // Should open create dialog
      await expect(page.locator('[data-testid="create-topup-dialog"]')).toBeVisible()
      
      // Fill request details
      await page.fill('[data-testid="request-amount-input"]', '1000')
      await page.fill('[data-testid="request-description-input"]', 'Test topup request')
      
      // Submit request
      await page.click('[data-testid="submit-request-button"]')
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      
      // Should close dialog
      await expect(page.locator('[data-testid="create-topup-dialog"]')).not.toBeVisible()
      
      // Should show new request in table
      await expect(page.locator('[data-testid="topup-requests-table"]')).toContainText('$1,000.00')
    })
  })
  
  test.describe('Asset Management Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Login and navigate to assets
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', TEST_USER.email)
      await page.fill('[data-testid="password-input"]', TEST_USER.password)
      await page.click('[data-testid="login-button"]')
      await page.goto('/dashboard/assets')
    })
    
    test('user can view assets and bind new ones', async ({ page }) => {
      // Should show assets table
      await expect(page.locator('[data-testid="assets-table"]')).toBeVisible()
      
      // Test binding new asset
      await page.click('[data-testid="bind-asset-button"]')
      
      // Should open binding dialog
      await expect(page.locator('[data-testid="bind-asset-dialog"]')).toBeVisible()
      
      // Should show available assets from Dolphin
      await expect(page.locator('[data-testid="available-assets"]')).toBeVisible()
      
      // Select an asset (mock selection)
      await page.click('[data-testid="asset-checkbox-1"]')
      
      // Confirm binding
      await page.click('[data-testid="confirm-binding-button"]')
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    })
    
    test('user can filter assets by type', async ({ page }) => {
      // Open asset type filter
      await page.click('[data-testid="asset-type-filter"]')
      
      // Select business manager filter
      await page.click('[data-testid="filter-business-manager"]')
      
      // Should show only business manager assets
      const assetTypes = page.locator('[data-testid="asset-type"]')
      await expect(assetTypes.first()).toContainText('Business Manager')
      
      // Test ad account filter
      await page.click('[data-testid="filter-ad-account"]')
      
      // Should show only ad account assets
      await expect(assetTypes.first()).toContainText('Ad Account')
    })
  })
  
  test.describe('Dashboard Overview', () => {
    test.beforeEach(async ({ page }) => {
      // Login and stay on dashboard
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', TEST_USER.email)
      await page.fill('[data-testid="password-input"]', TEST_USER.password)
      await page.click('[data-testid="login-button"]')
      await expect(page).toHaveURL('/dashboard')
    })
    
    test('dashboard shows key metrics and navigation', async ({ page }) => {
      // Should show wallet balance
      await expect(page.locator('[data-testid="wallet-balance-card"]')).toBeVisible()
      
      // Should show recent activity
      await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible()
      
      // Should show navigation menu
      await expect(page.locator('[data-testid="nav-wallet"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-topup-requests"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-assets"]')).toBeVisible()
      
      // Test navigation
      await page.click('[data-testid="nav-wallet"]')
      await expect(page).toHaveURL('/dashboard/wallet')
      
      await page.click('[data-testid="nav-topup-requests"]')
      await expect(page).toHaveURL('/dashboard/topup-requests')
      
      await page.click('[data-testid="nav-assets"]')
      await expect(page).toHaveURL('/dashboard/assets')
    })
    
    test('setup guide works correctly', async ({ page }) => {
      // Should show setup guide if not completed
      await expect(page.locator('[data-testid="setup-guide"]')).toBeVisible()
      
      // Click setup guide
      await page.click('[data-testid="setup-guide-button"]')
      
      // Should expand setup guide
      await expect(page.locator('[data-testid="setup-guide-expanded"]')).toBeVisible()
      
      // Should show setup steps
      await expect(page.locator('[data-testid="setup-step-1"]')).toBeVisible()
      await expect(page.locator('[data-testid="setup-step-2"]')).toBeVisible()
      await expect(page.locator('[data-testid="setup-step-3"]')).toBeVisible()
    })
  })
  
  test.describe('Error Handling', () => {
    test('handles network errors gracefully', async ({ page }) => {
      // Login first
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', TEST_USER.email)
      await page.fill('[data-testid="password-input"]', TEST_USER.password)
      await page.click('[data-testid="login-button"]')
      
      // Simulate network failure
      await page.route('**/api/**', route => route.abort())
      
      // Try to navigate to wallet
      await page.goto('/dashboard/wallet')
      
      // Should show error message
      await expect(page.locator('[data-testid="error-banner"]')).toBeVisible()
      await expect(page.locator('[data-testid="error-banner"]')).toContainText('Unable to load data')
    })
    
    test('handles session expiration', async ({ page }) => {
      // Login first
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', TEST_USER.email)
      await page.fill('[data-testid="password-input"]', TEST_USER.password)
      await page.click('[data-testid="login-button"]')
      
      // Simulate expired session
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' })
        })
      })
      
      // Try to access protected resource
      await page.goto('/dashboard/wallet')
      
      // Should redirect to login
      await expect(page).toHaveURL('/login')
      
      // Should show session expired message
      await expect(page.locator('[data-testid="session-expired-message"]')).toBeVisible()
    })
  })
}) 
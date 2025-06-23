import { test, expect } from '@playwright/test'

test.describe('Financial Operations - Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and ensure we're in demo mode
    await page.goto('/dashboard')
    
    // Wait for the app to load and verify we're on dashboard
    await expect(page.locator('[data-testid="wallet-balance"]')).toBeVisible()
  })

  test('wallet top-up increases balance correctly', async ({ page }) => {
    // Get initial wallet balance
    const initialBalanceText = await page.locator('[data-testid="wallet-balance"]').textContent()
    const initialBalance = parseFloat(initialBalanceText?.replace(/[^0-9.-]+/g, '') || '0')

    // Open wallet top-up dialog
    await page.click('[data-testid="add-funds-button"]')
    
    // Fill in amount and submit
    await page.fill('[data-testid="amount-input"]', '500')
    await page.click('[data-testid="confirm-topup"]')

    // Wait for success message
    await expect(page.locator('text=Successfully added')).toBeVisible()

    // Verify new balance
    const newBalanceText = await page.locator('[data-testid="wallet-balance"]').textContent()
    const newBalance = parseFloat(newBalanceText?.replace(/[^0-9.-]+/g, '') || '0')
    
    expect(newBalance).toBe(initialBalance + 500)
  })

  test('ad account top-up transfers money correctly', async ({ page }) => {
    // Navigate to accounts page
    await page.click('text=Accounts')
    
    // Get initial balances
    const initialWalletText = await page.locator('[data-testid="wallet-balance"]').textContent()
    const initialWallet = parseFloat(initialWalletText?.replace(/[^0-9.-]+/g, '') || '0')
    
    const initialAccountText = await page.locator('[data-testid="account-balance-0"]').textContent()
    const initialAccount = parseFloat(initialAccountText?.replace(/[^0-9.-]+/g, '') || '0')
    
    const totalBefore = initialWallet + initialAccount

    // Click top-up on first account
    await page.click('[data-testid="topup-account-0"]')
    
    // Fill amount and confirm
    await page.fill('[data-testid="topup-amount"]', '200')
    await page.click('[data-testid="confirm-account-topup"]')

    // Wait for success
    await expect(page.locator('text=Account Topped Up')).toBeVisible()

    // Verify balances changed correctly
    const finalWalletText = await page.locator('[data-testid="wallet-balance"]').textContent()
    const finalWallet = parseFloat(finalWalletText?.replace(/[^0-9.-]+/g, '') || '0')
    
    const finalAccountText = await page.locator('[data-testid="account-balance-0"]').textContent()
    const finalAccount = parseFloat(finalAccountText?.replace(/[^0-9.-]+/g, '') || '0')
    
    const totalAfter = finalWallet + finalAccount

    // Verify transfer (not creation of money)
    expect(finalWallet).toBe(initialWallet - 200)
    expect(finalAccount).toBe(initialAccount + 200)
    expect(totalAfter).toBe(totalBefore) // Conservation of money!
  })

  test('prevents top-up when insufficient wallet balance', async ({ page }) => {
    // Navigate to accounts
    await page.click('text=Accounts')
    
    // Get current wallet balance
    const walletText = await page.locator('[data-testid="wallet-balance"]').textContent()
    const walletBalance = parseFloat(walletText?.replace(/[^0-9.-]+/g, '') || '0')
    
    // Try to top up more than available
    await page.click('[data-testid="topup-account-0"]')
    await page.fill('[data-testid="topup-amount"]', (walletBalance + 1000).toString())
    await page.click('[data-testid="confirm-account-topup"]')

    // Should show error message
    await expect(page.locator('text=Amount exceeds available wallet balance')).toBeVisible()
    
    // Balances should remain unchanged
    const newWalletText = await page.locator('[data-testid="wallet-balance"]').textContent()
    const newWalletBalance = parseFloat(newWalletText?.replace(/[^0-9.-]+/g, '') || '0')
    
    expect(newWalletBalance).toBe(walletBalance)
  })

  test('transaction history records all financial operations', async ({ page }) => {
    // Perform a wallet top-up
    await page.click('[data-testid="add-funds-button"]')
    await page.fill('[data-testid="amount-input"]', '300')
    await page.click('[data-testid="confirm-topup"]')
    await expect(page.locator('text=Successfully added')).toBeVisible()

    // Perform an account top-up
    await page.click('text=Accounts')
    await page.click('[data-testid="topup-account-0"]')
    await page.fill('[data-testid="topup-amount"]', '150')
    await page.click('[data-testid="confirm-account-topup"]')
    await expect(page.locator('text=Account Topped Up')).toBeVisible()

    // Check transaction history
    await page.click('text=Transactions')
    
    // Should see both transactions
    await expect(page.locator('text=Wallet funding')).toBeVisible()
    await expect(page.locator('text=Top up for')).toBeVisible()
    
    // Verify transaction amounts
    const transactions = page.locator('[data-testid="transaction-row"]')
    await expect(transactions).toHaveCount(2)
  })

  test('multiple rapid operations maintain consistency', async ({ page }) => {
    // Get initial balance
    const initialText = await page.locator('[data-testid="wallet-balance"]').textContent()
    const initialBalance = parseFloat(initialText?.replace(/[^0-9.-]+/g, '') || '0')

    // Perform multiple rapid operations
    const operations = [
      { type: 'add', amount: 100 },
      { type: 'add', amount: 200 },
      { type: 'subtract', amount: 50 }, // via account top-up
      { type: 'add', amount: 300 },
      { type: 'subtract', amount: 100 } // via account top-up
    ]

    let expectedBalance = initialBalance

    for (const op of operations) {
      if (op.type === 'add') {
        await page.click('[data-testid="add-funds-button"]')
        await page.fill('[data-testid="amount-input"]', op.amount.toString())
        await page.click('[data-testid="confirm-topup"]')
        await expect(page.locator('text=Successfully added')).toBeVisible()
        expectedBalance += op.amount
      } else {
        await page.click('text=Accounts')
        await page.click('[data-testid="topup-account-0"]')
        await page.fill('[data-testid="topup-amount"]', op.amount.toString())
        await page.click('[data-testid="confirm-account-topup"]')
        await expect(page.locator('text=Account Topped Up')).toBeVisible()
        expectedBalance -= op.amount
        await page.click('text=Dashboard') // Go back
      }
    }

    // Verify final balance matches expected
    const finalText = await page.locator('[data-testid="wallet-balance"]').textContent()
    const finalBalance = parseFloat(finalText?.replace(/[^0-9.-]+/g, '') || '0')
    
    expect(finalBalance).toBe(expectedBalance)
  })
}) 
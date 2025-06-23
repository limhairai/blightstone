import { test, expect } from '@playwright/test'

/**
 * 🔄 COMPLETE WORKFLOW TEST
 * Tests the entire AdHub business flow end-to-end
 */

test.describe('Complete AdHub Workflow', () => {
  
  test('🎯 End-to-End Business Flow: Registration → Admin Processing → Live Operations', async ({ page, context }) => {
    
    // ========================================
    // 🚀 PHASE 1: USER REGISTRATION & ONBOARDING
    // ========================================
    
    await test.step('1. User Registration', async () => {
      await page.goto('http://localhost:3000/register')
      
      // Fill registration form
      await page.fill('[data-testid="email-input"]', 'newclient@adhub.test')
      await page.fill('[data-testid="password-input"]', 'SecurePassword123!')
      await page.fill('[data-testid="name-input"]', 'John Client')
      await page.click('[data-testid="register-button"]')
      
      // Should redirect to email confirmation
      await expect(page).toHaveURL(/confirm-email/)
    })
    
    await test.step('2. Email Confirmation & Login', async () => {
      // Navigate to login (simulating email confirmation)
      await page.goto('http://localhost:3000/login')
      
      await page.fill('[data-testid="email-input"]', 'newclient@adhub.test')
      await page.fill('[data-testid="password-input"]', 'SecurePassword123!')
      await page.click('[data-testid="login-button"]')
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/dashboard/)
    })
    
    // ========================================
    // 🏢 PHASE 2: BUSINESS APPLICATION
    // ========================================
    
    await test.step('3. Business Application Submission', async () => {
      await page.goto('http://localhost:3000/dashboard/businesses')
      
      // Click "Add Business" button
      await page.click('[data-testid="add-business-button"]')
      
      // Fill business application form
      await page.fill('[data-testid="business-name-input"]', 'E-commerce Store LLC')
      await page.fill('[data-testid="business-website-input"]', 'https://ecommercestore.com')
      await page.selectOption('[data-testid="business-type-select"]', 'E-commerce')
      
      // Submit application
      await page.click('[data-testid="submit-business-application"]')
      
      // Verify application submitted
      await expect(page.locator('text=Business application submitted')).toBeVisible()
    })
    
    // ========================================
    // 👨‍💼 PHASE 3: ADMIN PROCESSING
    // ========================================
    
    await test.step('4. Admin Login & Application Review', async () => {
      // Open new tab for admin
      const adminPage = await context.newPage()
      await adminPage.goto('http://localhost:3000/login')
      
      // Login as admin
      await adminPage.fill('[data-testid="email-input"]', 'admin@adhub.tech')
      await adminPage.fill('[data-testid="password-input"]', 'AdminPassword123!')
      await adminPage.click('[data-testid="login-button"]')
      
      // Navigate to admin panel
      await adminPage.goto('http://localhost:3000/admin/applications')
      
      // Verify pending application appears
      await expect(adminPage.locator('text=E-commerce Store LLC')).toBeVisible()
    })
    
    await test.step('5. Admin Approves Business Application', async () => {
      const adminPage = context.pages()[1]
      
      // Approve the application
      await adminPage.click('[data-testid="approve-application-button"]')
      
      // Verify approval
      await expect(adminPage.locator('text=Application approved')).toBeVisible()
    })
    
    // ========================================
    // 💰 PHASE 4: WALLET & FINANCIAL OPERATIONS
    // ========================================
    
    await test.step('6. Client Wallet Top-Up', async () => {
      // Switch back to client page
      await page.goto('http://localhost:3000/dashboard/wallet')
      
      // Top up wallet
      await page.click('[data-testid="top-up-wallet-button"]')
      await page.fill('[data-testid="top-up-amount-input"]', '1000')
      await page.click('[data-testid="confirm-top-up-button"]')
      
      // Verify top-up
      await expect(page.locator('text=Wallet topped up successfully')).toBeVisible()
    })
    
    // ========================================
    // 💳 PHASE 5: SUBSCRIPTION MANAGEMENT
    // ========================================
    
    await test.step('7. Subscription Plan Selection', async () => {
      await page.goto('http://localhost:3000/dashboard/settings/billing')
      
      // Upgrade to Silver plan
      await page.click('[data-testid="upgrade-plan-button"]')
      await page.click('[data-testid="select-silver-plan"]')
      
      // Verify plan selection
      await expect(page.locator('text=$299/month')).toBeVisible()
    })
    
    // ========================================
    // 📈 PHASE 6: FINAL VERIFICATION
    // ========================================
    
    await test.step('8. Complete Workflow Verification', async () => {
      // Return to dashboard and verify everything is working
      await page.goto('http://localhost:3000/dashboard')
      
      // Verify business is approved
      await expect(page.locator('[data-testid="business-status"]')).toContainText('approved')
      
      // Verify wallet has funds
      await page.goto('http://localhost:3000/dashboard/wallet')
      await expect(page.locator('[data-testid="wallet-balance"]')).toContainText('$')
    })
  })
})

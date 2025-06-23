/**
 * Performance Benchmark Tests
 * Ensures critical user paths meet performance requirements
 */

import { test, expect } from '@playwright/test'

test.describe('Performance Benchmarks', () => {
  test.beforeEach(async ({ page }) => {
    // Enable demo mode for consistent testing
    await page.addInitScript(() => {
      localStorage.setItem('demo_mode', 'true')
    })
  })

  test('dashboard should load within 2 seconds', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/dashboard')
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(2000) // 2 seconds
    
    console.log(`Dashboard load time: ${loadTime}ms`)
  })

  test('business creation should complete within 3 seconds', async ({ page }) => {
    await page.goto('/dashboard/businesses')
    
    const startTime = Date.now()
    
    // Create business
    await page.click('[data-testid="create-business-button"]')
    await page.fill('[data-testid="business-name-input"]', 'Performance Test Business')
    await page.selectOption('[data-testid="business-type-select"]', 'Technology')
    await page.fill('[data-testid="business-website-input"]', 'https://perf-test.com')
    await page.click('[data-testid="submit-business-button"]')
    
    // Wait for success confirmation
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    const completionTime = Date.now() - startTime
    expect(completionTime).toBeLessThan(3000) // 3 seconds
    
    console.log(`Business creation time: ${completionTime}ms`)
  })

  test('wallet operations should be fast', async ({ page }) => {
    await page.goto('/dashboard/wallet')
    
    const startTime = Date.now()
    
    // Top up wallet
    await page.click('[data-testid="add-funds-button"]')
    await page.fill('[data-testid="amount-input"]', '500')
    await page.click('[data-testid="confirm-topup"]')
    
    // Wait for balance update
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    const operationTime = Date.now() - startTime
    expect(operationTime).toBeLessThan(1500) // 1.5 seconds
    
    console.log(`Wallet operation time: ${operationTime}ms`)
  })

  test('admin panel should load efficiently', async ({ page }) => {
    // Set admin mode
    await page.addInitScript(() => {
      localStorage.setItem('demo_mode', 'true')
      localStorage.setItem('user_role', 'admin')
    })
    
    const startTime = Date.now()
    
    await page.goto('/admin')
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(2500) // 2.5 seconds
    
    console.log(`Admin panel load time: ${loadTime}ms`)
  })

  test('table rendering should be performant', async ({ page }) => {
    await page.goto('/dashboard/businesses')
    
    const startTime = Date.now()
    
    // Wait for table to fully render
    await expect(page.locator('[data-testid="businesses-table"]')).toBeVisible()
    await expect(page.locator('[data-testid="business-row"]').first()).toBeVisible()
    
    const renderTime = Date.now() - startTime
    expect(renderTime).toBeLessThan(1000) // 1 second
    
    console.log(`Table render time: ${renderTime}ms`)
  })

  test('navigation should be instant', async ({ page }) => {
    await page.goto('/dashboard')
    
    const navigationTests = [
      { from: '/dashboard', to: '/dashboard/businesses', name: 'businesses' },
      { from: '/dashboard/businesses', to: '/dashboard/accounts', name: 'accounts' },
      { from: '/dashboard/accounts', to: '/dashboard/wallet', name: 'wallet' },
      { from: '/dashboard/wallet', to: '/dashboard/settings', name: 'settings' }
    ]

    for (const nav of navigationTests) {
      const startTime = Date.now()
      
      await page.click(`[data-testid="${nav.name}-nav"]`)
      await expect(page).toHaveURL(nav.to)
      
      const navTime = Date.now() - startTime
      expect(navTime).toBeLessThan(500) // 500ms
      
      console.log(`${nav.name} navigation time: ${navTime}ms`)
    }
  })

  test('search functionality should be responsive', async ({ page }) => {
    await page.goto('/dashboard/businesses')
    
    const startTime = Date.now()
    
    // Type in search
    await page.fill('[data-testid="search-input"]', 'TechCorp')
    
    // Wait for filtered results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    
    const searchTime = Date.now() - startTime
    expect(searchTime).toBeLessThan(300) // 300ms
    
    console.log(`Search response time: ${searchTime}ms`)
  })

  test('mobile performance should be acceptable', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    const startTime = Date.now()
    
    await page.goto('/dashboard')
    await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible()
    
    const mobileLoadTime = Date.now() - startTime
    expect(mobileLoadTime).toBeLessThan(3000) // 3 seconds for mobile
    
    console.log(`Mobile load time: ${mobileLoadTime}ms`)
  })

  test('concurrent user simulation', async ({ browser }) => {
    // Simulate 5 concurrent users
    const contexts = await Promise.all(
      Array.from({ length: 5 }, () => browser.newContext())
    )
    
    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    )

    const startTime = Date.now()
    
    // All users navigate to dashboard simultaneously
    await Promise.all(
      pages.map(async (page, index) => {
        await page.addInitScript(() => {
          localStorage.setItem('demo_mode', 'true')
          localStorage.setItem('user_id', `user-${Math.random()}`)
        })
        
        await page.goto('/dashboard')
        await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible()
      })
    )
    
    const concurrentLoadTime = Date.now() - startTime
    expect(concurrentLoadTime).toBeLessThan(5000) // 5 seconds for 5 concurrent users
    
    console.log(`Concurrent load time (5 users): ${concurrentLoadTime}ms`)
    
    // Cleanup
    await Promise.all(contexts.map(context => context.close()))
  })

  test('memory usage should be reasonable', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })
    
    // Navigate through app
    const routes = ['/dashboard/businesses', '/dashboard/accounts', '/dashboard/wallet', '/dashboard/settings']
    
    for (const route of routes) {
      await page.goto(route)
      await page.waitForTimeout(1000) // Let it settle
    }
    
    // Check final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })
    
    const memoryIncrease = finalMemory - initialMemory
    const memoryIncreaseKB = memoryIncrease / 1024
    
    // Memory increase should be reasonable (less than 10MB)
    expect(memoryIncreaseKB).toBeLessThan(10 * 1024)
    
    console.log(`Memory increase: ${memoryIncreaseKB.toFixed(2)} KB`)
  })
}) 
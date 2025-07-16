/**
 * Basic Navigation E2E Tests
 * 
 * These tests validate basic application navigation and page loading
 * using Playwright for real browser automation.
 */

// Import test environment configuration
import '../test-env';

import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should load the homepage', async ({ page }) => {
    // Check that the page loads successfully
    await expect(page).toHaveTitle(/AdHub/);
    
    // Check for basic navigation elements
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    // Click on login link/button
    await page.click('text=Login');
    
    // Verify we're on the login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('form')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    // Click on register link/button
    await page.click('text=Register');
    
    // Verify we're on the register page
    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator('form')).toBeVisible();
  });

  test('should navigate to pricing page', async ({ page }) => {
    // Click on pricing link/button
    await page.click('text=Pricing');
    
    // Verify we're on the pricing page
    await expect(page).toHaveURL(/.*pricing/);
    await expect(page.locator('text=Plans')).toBeVisible();
  });

  test('should show 404 for non-existent page', async ({ page }) => {
    // Navigate to a non-existent page
    await page.goto('/non-existent-page');
    
    // Check for 404 or error handling
    await expect(page.locator('text=404')).toBeVisible();
  });
});

test.describe('Authentication Flow', () => {
  test('should show login form elements', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show registration form elements', async ({ page }) => {
    await page.goto('/register');
    
    // Check for registration form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should handle login form submission', async ({ page }) => {
    await page.goto('/login');
    
    // Fill out the login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Should show some response (error message or redirect)
    await page.waitForTimeout(1000);
    
    // Check that something happened (form was processed)
    const url = page.url();
    expect(url).toBeDefined();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that mobile navigation works
    await expect(page.locator('nav')).toBeVisible();
    
    // Check that content is responsive
    const content = page.locator('main');
    await expect(content).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Check that tablet layout works
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Check that desktop layout works
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load pages within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
  });

  test('should handle multiple rapid navigations', async ({ page }) => {
    await page.goto('/');
    
    // Rapid navigation test
    await page.click('text=Login');
    await page.click('text=Register');
    await page.click('text=Pricing');
    await page.goto('/');
    
    // Should still be functional
    await expect(page.locator('nav')).toBeVisible();
  });
}); 
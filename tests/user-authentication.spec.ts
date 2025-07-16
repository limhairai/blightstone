import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', 'test@example.com');
    await page.fill('input[type="password"], input[name="password"], input[placeholder*="password" i]', 'testpassword123');
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in")');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('nav, header, [role="navigation"], .dashboard, #dashboard')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', 'invalid@example.com');
    await page.fill('input[type="password"], input[name="password"], input[placeholder*="password" i]', 'wrongpassword');
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in")');
    
    // Look for error messages in various forms
    await expect(page.locator('.error, .alert, [role="alert"], .text-red, .text-danger, .invalid-feedback')).toBeVisible();
  });

  test('should logout user successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', 'test@example.com');
    await page.fill('input[type="password"], input[name="password"], input[placeholder*="password" i]', 'password123');
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    
    // Debug: Let's see what's actually on the page
    console.log('Page URL:', page.url());
    
    // Debug: Get all buttons on the page
    const buttons = await page.$$eval('button', buttons => 
      buttons.map(btn => ({
        text: btn.textContent?.trim(),
        className: btn.className,
        id: btn.id,
        type: btn.type
      }))
    );
    console.log('All buttons on page:', buttons);
    
    // Debug: Look for any images or avatars
    const images = await page.$$eval('img', imgs => 
      imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        className: img.className
      }))
    );
    console.log('All images on page:', images);
    
    // Debug: Look for dropdown triggers
    const dropdownTriggers = await page.$$eval('[data-radix-collection-item], [data-state], [role="button"]', elements => 
      elements.map(el => ({
        tagName: el.tagName,
        className: el.className,
        textContent: el.textContent?.trim(),
        role: el.getAttribute('role'),
        dataState: el.getAttribute('data-state')
      }))
    );
    console.log('Potential dropdown triggers:', dropdownTriggers);
    
    // Try different selectors
    const selectors = [
      'button:has([class*="avatar"])',
      'button:has(img)',
      '[data-testid="user-menu"]',
      '[data-testid="profile-menu"]',
      'button[aria-haspopup="menu"]',
      'button[role="button"]:has(img)',
      '.avatar',
      '[class*="avatar"]'
    ];
    
    for (const selector of selectors) {
      const element = await page.$(selector);
      if (element) {
        console.log(`Found element with selector: ${selector}`);
        try {
          await element.click();
          console.log(`Successfully clicked: ${selector}`);
          
          // Wait a bit and check if dropdown appeared
          await page.waitForTimeout(1000);
          
          // Look for logout option
          const logoutButton = await page.$('text="Log out"');
          if (logoutButton) {
            console.log('Found logout button!');
            await logoutButton.click();
            await page.waitForURL('/login');
            expect(page.url()).toContain('/login');
            return;
          }
        } catch (e) {
          console.log(`Failed to click ${selector}:`, e.message);
        }
      }
    }
    
    throw new Error('Could not find avatar/profile button');
  });

  test('should redirect to login when accessing protected page', async ({ page }) => {
    // Clear storage to simulate logged out state
    await page.context().clearCookies();
    await page.context().clearPermissions();
    
    await page.goto('/dashboard');
    // Accept redirect with query parameters
    await expect(page).toHaveURL(/\/login/);
  });
}); 
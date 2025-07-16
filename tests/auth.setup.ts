import { test as setup, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const authFile = 'playwright/.auth/user.json';
const adminAuthFile = 'playwright/.auth/admin.json';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  fullName: 'Test User E2E',
};

const TEST_ADMIN = {
  email: 'admin@example.com', 
  password: 'adminpassword123',
  fullName: 'Admin User E2E',
};

setup('authenticate regular user', async ({ page }) => {
  console.log('🔐 Setting up regular user authentication...');
  
  // First, register the test user
  await page.goto('/register');
  
  // Fill registration form
  await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', TEST_USER.email);
  await page.fill('input[type="password"], input[name="password"], input[placeholder*="password" i]', TEST_USER.password);
  
  // Fill name field if it exists
  try {
    await page.fill('input[name="name"], input[name="full_name"], input[placeholder*="name" i]', TEST_USER.fullName, { timeout: 2000 });
  } catch (e) {
    console.log('Name field not found, skipping...');
  }
  
  // Submit registration
  await page.click('button[type="submit"], button:has-text("Sign up"), button:has-text("Register"), button:has-text("Create account")');
  
  // Wait for successful registration (might redirect to dashboard or login)
  try {
    await page.waitForURL('/dashboard', { timeout: 10000 });
  } catch (e) {
    // If not redirected to dashboard, try to login
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', TEST_USER.email);
    await page.fill('input[type="password"], input[name="password"], input[placeholder*="password" i]', TEST_USER.password);
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in")');
    await page.waitForURL('/dashboard');
  }
  
  // Verify user is logged in - check for common dashboard elements
  await expect(page.locator('nav, header, [role="navigation"], .dashboard, #dashboard')).toBeVisible();
  
  // Save authenticated state
  await page.context().storageState({ path: authFile });
  
  console.log('✅ Regular user authentication setup completed');
});

setup('authenticate admin user', async ({ page }) => {
  console.log('🔐 Setting up admin user authentication...');
  
  // First, register the admin user
  await page.goto('/register');
  
  // Fill registration form
  await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', TEST_ADMIN.email);
  await page.fill('input[type="password"], input[name="password"], input[placeholder*="password" i]', TEST_ADMIN.password);
  
  // Fill name field if it exists
  try {
    await page.fill('input[name="name"], input[name="full_name"], input[placeholder*="name" i]', TEST_ADMIN.fullName, { timeout: 2000 });
  } catch (e) {
    console.log('Name field not found, skipping...');
  }
  
  // Submit registration
  await page.click('button[type="submit"], button:has-text("Sign up"), button:has-text("Register"), button:has-text("Create account")');
  
  // Wait for successful registration (might redirect to dashboard)
  try {
    await page.waitForURL('/dashboard', { timeout: 10000 });
  } catch (e) {
    // If not redirected to dashboard, try to login
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', TEST_ADMIN.email);
    await page.fill('input[type="password"], input[name="password"], input[placeholder*="password" i]', TEST_ADMIN.password);
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in")');
    await page.waitForURL('/dashboard');
  }
  
  // For admin, we expect to be on dashboard initially, not /admin
  // Admin access might be role-based after login
  await expect(page.locator('nav, header, [role="navigation"], .dashboard, #dashboard')).toBeVisible();
  
  // Save authenticated state
  await page.context().storageState({ path: adminAuthFile });
  
  console.log('✅ Admin user authentication setup completed');
});

async function createTestUser(user: typeof TEST_USER, isAdmin: boolean) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Supabase credentials not found, skipping user creation');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(user.email);
    
    if (existingUser.user) {
      console.log(`User ${user.email} already exists`);
      return;
    }

    // Create user
    const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });

    if (userError) {
      console.error('Error creating user:', userError);
      return;
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: newUser.user.id,
        full_name: user.fullName,
        email: user.email,
        role: isAdmin ? 'admin' : 'user',
        created_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return;
    }

    // Create organization for regular user
    if (!isAdmin) {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: 'Test Organization E2E',
          owner_id: newUser.user.id,
          subscription_tier: 'starter',
          status: 'active',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orgError) {
        console.error('Error creating organization:', orgError);
        return;
      }
    }

    console.log(`✅ Created ${isAdmin ? 'admin' : 'user'}: ${user.email}`);
  } catch (error) {
    console.error('Error in createTestUser:', error);
  }
} 
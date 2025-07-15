import { test as base } from '@playwright/test';

// Test environment configuration
export const TEST_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  apiURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  resendApiKey: process.env.RESEND_API_KEY,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  
  // Test user configuration
  testUser: {
    email: `test-${Date.now()}@adhub-test.com`,
    password: 'TestPassword123!',
    name: 'Test User'
  },
  
  adminUser: {
    email: 'admin@adhub.com',
    password: 'AdminPassword123!'
  },
  
  // Test timeouts
  timeout: 30000,
  emailTimeout: 30000,
  
  // Test data
  testOrganization: {
    name: 'Test Organization',
    newName: 'Updated Test Organization'
  }
};

// Environment validation
export function validateTestEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Warn about optional but recommended variables
  const recommended = [
    'RESEND_API_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ];
  
  const missingRecommended = recommended.filter(key => !process.env[key]);
  
  if (missingRecommended.length > 0) {
    console.warn(`⚠️  Missing recommended environment variables: ${missingRecommended.join(', ')}`);
    console.warn('Some tests may be skipped or use mock data.');
  }
}

// Test utilities
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@adhub-test.com`;
}

export function generateTestUser(overrides: Partial<any> = {}) {
  return {
    email: generateTestEmail(),
    password: 'TestPassword123!',
    name: 'Test User',
    ...overrides
  };
}

// Test data cleanup
export async function cleanupTestData() {
  // This would clean up any test data created during tests
  // Implementation depends on your database structure
  console.log('Cleaning up test data...');
}

// Custom test fixture with additional context
export const test = base.extend<{
  testUser: any;
  adminUser: any;
  testConfig: typeof TEST_CONFIG;
}>({
  testUser: async ({}, use) => {
    const user = generateTestUser();
    await use(user);
    // Cleanup after test
  },
  
  adminUser: async ({}, use) => {
    await use(TEST_CONFIG.adminUser);
  },
  
  testConfig: async ({}, use) => {
    await use(TEST_CONFIG);
  }
});

export { expect } from '@playwright/test'; 
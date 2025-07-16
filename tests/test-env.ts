/**
 * Test Environment Configuration
 * 
 * This file sets up mock environment variables and configurations
 * needed for testing without requiring real API keys or services.
 */

// Mock Supabase environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase-url.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key-for-testing';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key-for-testing';

// Mock other API keys for testing
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_stripe_key';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_stripe_secret';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock_webhook_secret';

// Mock Dolphin API credentials
process.env.DOLPHIN_API_URL = 'https://mock-dolphin-api.com';
process.env.DOLPHIN_API_KEY = 'mock-dolphin-api-key';

// Mock Facebook API credentials
process.env.FACEBOOK_APP_ID = 'mock-facebook-app-id';
process.env.FACEBOOK_APP_SECRET = 'mock-facebook-app-secret';

// Mock Binance Pay credentials
process.env.BINANCE_PAY_API_KEY = 'mock-binance-pay-key';
process.env.BINANCE_PAY_SECRET = 'mock-binance-pay-secret';

// Mock application URLs
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';

// Mock email service
process.env.RESEND_API_KEY = 'mock-resend-api-key';

// Mock other required environment variables
process.env.NEXTAUTH_SECRET = 'mock-nextauth-secret-for-testing';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Test database configuration
process.env.TEST_DATABASE_URL = 'postgresql://test:test@localhost:5432/adhub_test';

// Set Node environment to test
process.env.NODE_ENV = 'test';

export const testConfig = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  dolphin: {
    apiUrl: process.env.DOLPHIN_API_URL,
    apiKey: process.env.DOLPHIN_API_KEY,
  },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
  },
  binancePay: {
    apiKey: process.env.BINANCE_PAY_API_KEY,
    secret: process.env.BINANCE_PAY_SECRET,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
  },
  auth: {
    nextAuthSecret: process.env.NEXTAUTH_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL,
  },
};

// Export for use in tests
export default testConfig; 
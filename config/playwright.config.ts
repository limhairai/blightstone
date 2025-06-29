import { defineConfig, devices } from '@playwright/test';

// ✅ SECURE: Environment-based URL configuration (no hardcoded localhost)
const getBaseUrl = () => {
  // 1. Check explicit environment variable
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  
  // 2. Environment-based URLs
  if (process.env.NODE_ENV === 'production') return 'https://adhub.com'
  if (process.env.NODE_ENV === 'staging') return 'https://staging.adhub.tech'
  
  // 3. Development fallback
  return 'http://localhost:3000'
}

const getBackendUrl = () => {
  // 1. Check explicit environment variable
  if (process.env.BACKEND_URL) return process.env.BACKEND_URL
  if (process.env.BACKEND_API_URL) return process.env.BACKEND_API_URL
  
  // 2. Environment-based URLs
  if (process.env.NODE_ENV === 'production') return 'https://api.adhub.com'
  if (process.env.NODE_ENV === 'staging') return 'https://api-staging.adhub.tech'
  
  // 3. Development fallback
  return 'http://localhost:8000'
}

const FRONTEND_URL = getBaseUrl()
const BACKEND_URL = getBackendUrl()

export default defineConfig({
  testDir: '../tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'cd frontend && npm run dev',
    url: FRONTEND_URL,
    reuseExistingServer: !process.env.CI,
  },
});

import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const PROJECT_ROOT = __dirname; // Assumes playwright.config.ts is in project root which is adhub/
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');
// const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'scripts'); // No longer needed if manage_emulators.sh is removed

export default defineConfig({
  testDir: './tests', // Create a 'tests' folder in adhub/ for your spec files
  timeout: 5 * 60 * 1000, 
  expect: {
    timeout: 20 * 1000, // Increased default timeout for expect assertions
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, 
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    actionTimeout: 25 * 1000, // Default timeout for actions like page.click()
    navigationTimeout: 45 * 1000, // Default timeout for page.goto()
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    // Removed webServer entry for manage_emulators.sh
    {
      command: `${path.join(BACKEND_DIR, 'venv', 'bin', 'python')} -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`,
      cwd: BACKEND_DIR,
      url: 'http://localhost:8000/docs', 
      reuseExistingServer: false,
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: 90 * 1000,
      env: {
        PYTHONUNBUFFERED: "1",
        PYTHONIOENCODING: "UTF-8"
        // FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST removed
      }
    },
    {
      command: 'npm run dev',
      cwd: FRONTEND_DIR,
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: 120 * 1000, 
      env: {
        // NEXT_PUBLIC_USE_FIREBASE_EMULATOR, NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST, NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST removed
      }
    },
  ],
}); 
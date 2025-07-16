# E2E Testing Setup for AdHub

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
npx playwright install
```

### 2. Set Environment Variables
Create `.env.test` file in the root directory:
```env
# Test Environment Configuration
NODE_ENV=test

# Base URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase Configuration (use your test database)
NEXT_PUBLIC_SUPABASE_URL=your-test-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-supabase-anon-key
SUPABASE_SERVICE_KEY=your-test-supabase-service-key

# Stripe Configuration (use test keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
STRIPE_SECRET_KEY=sk_test_your_test_key

# Playwright Configuration
PLAYWRIGHT_BASE_URL=http://localhost:3000
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000
```

### 3. Run Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test user-authentication.spec.ts

# Run tests for specific browser
npx playwright test --project=chromium
```

## 📁 Test Structure

```
tests/
├── auth.setup.ts              # Authentication setup
├── auth.cleanup.ts            # Authentication cleanup
├── global-setup.ts            # Global test setup
├── global-teardown.ts         # Global test teardown
├── user-authentication.spec.ts # User auth tests
├── application-workflow.spec.ts # Application flow tests
├── admin-panel.admin.spec.ts   # Admin panel tests
├── payment-flow.spec.ts        # Payment & subscription tests
├── utils/
│   └── test-helpers.ts        # Test utilities
└── README.md                  # This file
```

## 🔧 Test Configuration

### Playwright Configuration
- **Multiple browsers**: Chrome, Firefox, Safari
- **Authentication**: Persistent login states
- **Parallel execution**: Tests run in parallel for speed
- **Retry logic**: Automatic retry on failure
- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure

### Test Data Management
- **Setup**: Creates test users and organizations
- **Isolation**: Each test runs with clean data
- **Cleanup**: Automatic cleanup after tests
- **Supabase**: Uses real database with test data

## 🧪 Test Categories

### 1. Authentication Tests (`user-authentication.spec.ts`)
- User login/logout
- Invalid credentials handling
- Protected route access
- Session management

### 2. Application Workflow Tests (`application-workflow.spec.ts`)
- Business application submission
- Form validation
- Status tracking
- Application management

### 3. Admin Panel Tests (`admin-panel.admin.spec.ts`)
- Admin dashboard access
- Application management
- Organization management
- Bulk operations

### 4. Payment Flow Tests (`payment-flow.spec.ts`)
- Subscription plans display
- Wallet top-up flow
- Transaction history
- Subscription upgrades

## 🛠️ Available Scripts

```bash
# Core test commands
npm run test:e2e                 # Run all E2E tests
npm run test:e2e:ui              # Run with Playwright UI
npm run test:e2e:headed          # Run in headed mode
npm run test:e2e:debug           # Run in debug mode

# Environment-specific tests
npm run test:e2e:staging         # Run against staging
npm run test:e2e:production      # Run smoke tests in production

# Utilities
npm run test:e2e:report          # Show test report
npm run test:e2e:codegen         # Generate test code
npm run test:setup               # Install browsers and deps
```

## 🎯 Test Patterns

### Using Test Helpers
```typescript
import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test('should complete user flow', async ({ page }) => {
  const helpers = new TestHelpers(page);
  
  await helpers.loginAsUser();
  await helpers.navigateToSection('applications');
  await helpers.createApplication({
    name: 'Test Application',
    websiteUrl: 'https://example.com',
    requestType: 'new_business_manager'
  });
  
  await helpers.verifyElementVisible('[data-testid="success-message"]');
});
```

### Data-Testid Pattern
All interactive elements should have `data-testid` attributes:
```html
<button data-testid="submit-button">Submit</button>
<input data-testid="email-input" type="email" />
<div data-testid="error-message">Error text</div>
```

### Page Object Pattern
```typescript
class ApplicationPage {
  constructor(private page: Page) {}
  
  async submitApplication(data: ApplicationData) {
    await this.page.fill('[data-testid="business-name"]', data.name);
    await this.page.click('[data-testid="submit-button"]');
  }
  
  async verifySuccess() {
    await expect(this.page.locator('[data-testid="success"]')).toBeVisible();
  }
}
```

## 🔒 Authentication Setup

### Test Users
The setup creates these test users:
- **Regular User**: `test@example.com` / `testpassword123`
- **Admin User**: `admin@example.com` / `adminpassword123`

### Authentication Flow
1. `auth.setup.ts` creates test users and saves login states
2. Tests use persistent authentication via `storageState`
3. `auth.cleanup.ts` removes authentication files

## 🗄️ Database Management

### Test Data Creation
```typescript
// Global setup creates:
- Test organization
- Test business
- Test user profiles
- Sample applications
```

### Data Isolation
- Each test runs with fresh data
- Tests don't interfere with each other
- Automatic cleanup prevents data pollution

### Supabase Integration
- Uses real Supabase database
- Test data is clearly marked (names contain "test")
- Automatic cleanup removes test data

## 🚀 CI/CD Integration

### GitHub Actions
- **Triggers**: Push to main/staging, PRs, nightly runs
- **Matrix Testing**: Chrome, Firefox, Safari
- **Environment Testing**: Local, staging, production
- **Artifacts**: Reports, videos, screenshots

### Environment Variables (GitHub Secrets)
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
STAGING_SUPABASE_URL
STAGING_SUPABASE_ANON_KEY
STAGING_SUPABASE_SERVICE_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
SLACK_WEBHOOK_URL
```

## 📊 Test Reporting

### HTML Report
```bash
npm run test:e2e:report
```
- Interactive test results
- Screenshots and videos
- Performance metrics
- Failure analysis

### CI Reports
- JUnit XML for CI integration
- JSON reports for custom processing
- GitHub Actions integration
- Slack notifications on failure

## 🐛 Debugging Tests

### Local Debugging
```bash
# Run in debug mode
npm run test:e2e:debug

# Run specific test in debug mode
npx playwright test user-authentication.spec.ts --debug

# Generate test code
npm run test:e2e:codegen
```

### Debug Tips
1. Use `page.pause()` to pause execution
2. Enable headed mode to see browser
3. Use `console.log()` for debugging
4. Check screenshots in `test-results/`
5. Review videos for failed tests

## 🔄 Maintenance

### Regular Tasks
- Update test data when schema changes
- Review and update selectors
- Monitor test performance
- Update browser versions

### Best Practices
- Keep tests independent
- Use descriptive test names
- Avoid hardcoded waits
- Clean up test data
- Use data-testid consistently

## 📈 Performance

### Test Optimization
- Parallel execution across browsers
- Persistent authentication states
- Efficient test data setup
- Smart waiting strategies

### Metrics to Monitor
- Test execution time
- Flaky test rate
- Browser coverage
- CI pipeline duration

## 🆘 Troubleshooting

### Common Issues

**Tests failing locally but passing in CI:**
- Check environment variables
- Verify database state
- Review timing issues

**Authentication failures:**
- Verify test user credentials
- Check Supabase connection
- Review auth setup logs

**Timeout errors:**
- Increase timeout values
- Check for loading states
- Review network conditions

**Database errors:**
- Verify test data cleanup
- Check Supabase permissions
- Review migration status

### Getting Help
1. Check test logs and screenshots
2. Review GitHub Actions output
3. Verify environment setup
4. Check database state
5. Review recent code changes

## 🎯 Production Readiness

This E2E testing setup ensures:
- ✅ **Authentication flows work correctly**
- ✅ **Core user workflows are tested**
- ✅ **Admin functionality is verified**
- ✅ **Payment flows are validated**
- ✅ **Cross-browser compatibility**
- ✅ **Automated CI/CD integration**
- ✅ **Proper test data management**
- ✅ **Comprehensive error handling**

Your application is now ready for production deployment with confidence! 🚀 
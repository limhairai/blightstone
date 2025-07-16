import { test, expect } from '../utils/test-helpers';

test.describe('Subscription and Billing', () => {
  test.beforeEach(async ({ page, testUser, testOrg, databaseCleaner }) => {
    await databaseCleaner.cleanAll();
    
    // Login as test user
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
  });

  test.describe('Subscription Plans', () => {
    test('should display available subscription plans', async ({ page }) => {
      await page.goto('/pricing');
      
      // Check plan cards are displayed
      await expect(page.locator('[data-testid="plan-card"]')).toHaveCount(3);
      
      // Verify plan details
      const basicPlan = page.locator('[data-testid="basic-plan"]');
      await expect(basicPlan.locator('[data-testid="plan-name"]')).toContainText('Basic');
      await expect(basicPlan.locator('[data-testid="plan-price"]')).toContainText('$99');
      await expect(basicPlan.locator('[data-testid="plan-features"]')).toContainText('10 Business Managers');
      
      const proPlan = page.locator('[data-testid="pro-plan"]');
      await expect(proPlan.locator('[data-testid="plan-name"]')).toContainText('Pro');
      await expect(proPlan.locator('[data-testid="plan-price"]')).toContainText('$299');
      await expect(proPlan.locator('[data-testid="plan-features"]')).toContainText('50 Business Managers');
      
      const enterprisePlan = page.locator('[data-testid="enterprise-plan"]');
      await expect(enterprisePlan.locator('[data-testid="plan-name"]')).toContainText('Enterprise');
      await expect(enterprisePlan.locator('[data-testid="plan-price"]')).toContainText('$999');
      await expect(enterprisePlan.locator('[data-testid="plan-features"]')).toContainText('Unlimited Business Managers');
    });

    test('should handle plan comparison', async ({ page }) => {
      await page.goto('/pricing');
      
      // Click compare plans button
      await page.click('[data-testid="compare-plans-button"]');
      
      // Verify comparison modal
      await expect(page.locator('[data-testid="comparison-modal"]')).toBeVisible();
      
      // Check feature comparison table
      const comparisonTable = page.locator('[data-testid="comparison-table"]');
      await expect(comparisonTable.locator('thead tr th')).toHaveCount(4); // Feature + 3 plans
      
      // Verify specific features are compared
      await expect(comparisonTable.locator('tbody tr')).toContainText(['Business Managers', 'Ad Accounts', 'API Access', 'Support Level']);
      
      // Close modal
      await page.click('[data-testid="close-comparison-modal"]');
      await expect(page.locator('[data-testid="comparison-modal"]')).not.toBeVisible();
    });

    test('should show current plan status', async ({ page }) => {
      await page.goto('/dashboard/billing');
      
      // Check current plan display
      const currentPlan = page.locator('[data-testid="current-plan"]');
      await expect(currentPlan.locator('[data-testid="plan-name"]')).toContainText('Free');
      await expect(currentPlan.locator('[data-testid="plan-status"]')).toContainText('Active');
      
      // Check usage limits
      await expect(page.locator('[data-testid="usage-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="bm-usage"]')).toContainText('0 / 3 Business Managers');
      await expect(page.locator('[data-testid="ad-account-usage"]')).toContainText('0 / 10 Ad Accounts');
    });
  });

  test.describe('Subscription Upgrade', () => {
    test('should handle subscription upgrade flow', async ({ page }) => {
      await page.goto('/pricing');
      
      // Click upgrade to Pro plan
      await page.click('[data-testid="pro-plan"] [data-testid="select-plan-button"]');
      
      // Verify redirect to checkout
      await page.waitForURL('/payment/checkout*');
      
      // Check checkout form
      await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="plan-summary"]')).toContainText('Pro Plan - $299/month');
      
      // Fill payment details
      await page.fill('[data-testid="card-number"]', '4242424242424242');
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvc"]', '123');
      await page.fill('[data-testid="cardholder-name"]', 'Test User');
      
      // Fill billing address
      await page.fill('[data-testid="billing-country"]', 'US');
      await page.fill('[data-testid="billing-zip"]', '12345');
      
      // Process payment
      await page.click('[data-testid="complete-payment-button"]');
      
      // Wait for success page
      await page.waitForURL('/payment/success');
      await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Welcome to Pro Plan!');
    });

    test('should handle payment failures', async ({ page }) => {
      await page.goto('/pricing');
      
      // Click upgrade to Pro plan
      await page.click('[data-testid="pro-plan"] [data-testid="select-plan-button"]');
      await page.waitForURL('/payment/checkout*');
      
      // Fill invalid payment details (declined card)
      await page.fill('[data-testid="card-number"]', '4000000000000002');
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvc"]', '123');
      await page.fill('[data-testid="cardholder-name"]', 'Test User');
      
      // Fill billing address
      await page.fill('[data-testid="billing-country"]', 'US');
      await page.fill('[data-testid="billing-zip"]', '12345');
      
      // Attempt payment
      await page.click('[data-testid="complete-payment-button"]');
      
      // Check error message
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-error"]')).toContainText('Your card was declined');
      
      // Verify user remains on checkout page
      expect(page.url()).toContain('/payment/checkout');
    });

    test('should validate payment form fields', async ({ page }) => {
      await page.goto('/pricing');
      
      // Click upgrade to Pro plan
      await page.click('[data-testid="pro-plan"] [data-testid="select-plan-button"]');
      await page.waitForURL('/payment/checkout*');
      
      // Try to submit empty form
      await page.click('[data-testid="complete-payment-button"]');
      
      // Check validation errors
      await expect(page.locator('[data-testid="card-number-error"]')).toContainText('Card number is required');
      await expect(page.locator('[data-testid="card-expiry-error"]')).toContainText('Expiry date is required');
      await expect(page.locator('[data-testid="card-cvc-error"]')).toContainText('CVC is required');
      await expect(page.locator('[data-testid="cardholder-name-error"]')).toContainText('Cardholder name is required');
      
      // Fill invalid card number
      await page.fill('[data-testid="card-number"]', '1234');
      await page.blur('[data-testid="card-number"]');
      await expect(page.locator('[data-testid="card-number-error"]')).toContainText('Invalid card number');
      
      // Fill invalid expiry
      await page.fill('[data-testid="card-expiry"]', '13/20');
      await page.blur('[data-testid="card-expiry"]');
      await expect(page.locator('[data-testid="card-expiry-error"]')).toContainText('Invalid expiry date');
    });
  });

  test.describe('Billing Management', () => {
    test('should display billing history', async ({ page }) => {
      await page.goto('/dashboard/billing');
      
      // Check billing history section
      await expect(page.locator('[data-testid="billing-history"]')).toBeVisible();
      
      // For new user, should show empty state
      await expect(page.locator('[data-testid="no-invoices"]')).toBeVisible();
      await expect(page.locator('[data-testid="no-invoices"]')).toContainText('No invoices yet');
      
      // Check "View all invoices" link
      await expect(page.locator('[data-testid="view-all-invoices"]')).toBeVisible();
    });

    test('should handle invoice downloads', async ({ page }) => {
      // First create a subscription to have invoices
      await page.goto('/api/test/create-subscription');
      
      await page.goto('/dashboard/billing');
      
      // Wait for invoices to load
      await page.waitForSelector('[data-testid="invoice-item"]');
      
      // Check invoice details
      const firstInvoice = page.locator('[data-testid="invoice-item"]').first();
      await expect(firstInvoice.locator('[data-testid="invoice-date"]')).toBeVisible();
      await expect(firstInvoice.locator('[data-testid="invoice-amount"]')).toContainText('$299.00');
      await expect(firstInvoice.locator('[data-testid="invoice-status"]')).toContainText('Paid');
      
      // Test download functionality
      const downloadPromise = page.waitForEvent('download');
      await firstInvoice.locator('[data-testid="download-invoice"]').click();
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/invoice-.*\.pdf/);
    });

    test('should manage payment methods', async ({ page }) => {
      await page.goto('/dashboard/billing');
      
      // Click manage payment methods
      await page.click('[data-testid="manage-payment-methods"]');
      
      // Check payment methods section
      await expect(page.locator('[data-testid="payment-methods"]')).toBeVisible();
      
      // For new user, should show empty state
      await expect(page.locator('[data-testid="no-payment-methods"]')).toBeVisible();
      
      // Add new payment method
      await page.click('[data-testid="add-payment-method"]');
      
      // Fill payment method form
      await page.fill('[data-testid="new-card-number"]', '4242424242424242');
      await page.fill('[data-testid="new-card-expiry"]', '12/25');
      await page.fill('[data-testid="new-card-cvc"]', '123');
      await page.fill('[data-testid="new-cardholder-name"]', 'Test User');
      
      // Save payment method
      await page.click('[data-testid="save-payment-method"]');
      
      // Verify payment method was added
      await expect(page.locator('[data-testid="payment-method-item"]')).toBeVisible();
      await expect(page.locator('[data-testid="card-ending"]')).toContainText('•••• 4242');
      await expect(page.locator('[data-testid="card-brand"]')).toContainText('Visa');
    });

    test('should handle subscription cancellation', async ({ page }) => {
      // First create a subscription
      await page.goto('/api/test/create-subscription');
      
      await page.goto('/dashboard/billing');
      
      // Click cancel subscription
      await page.click('[data-testid="cancel-subscription"]');
      
      // Verify cancellation modal
      await expect(page.locator('[data-testid="cancellation-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="cancellation-warning"]')).toContainText('Your subscription will remain active until');
      
      // Fill cancellation reason
      await page.selectOption('[data-testid="cancellation-reason"]', 'too-expensive');
      await page.fill('[data-testid="cancellation-feedback"]', 'The pricing is too high for our needs');
      
      // Confirm cancellation
      await page.click('[data-testid="confirm-cancellation"]');
      
      // Verify cancellation success
      await expect(page.locator('[data-testid="cancellation-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="plan-status"]')).toContainText('Cancelled');
      
      // Check reactivation option
      await expect(page.locator('[data-testid="reactivate-subscription"]')).toBeVisible();
    });
  });

  test.describe('Usage Tracking', () => {
    test('should track and display usage metrics', async ({ page }) => {
      await page.goto('/dashboard/billing');
      
      // Check usage section
      await expect(page.locator('[data-testid="usage-tracking"]')).toBeVisible();
      
      // Verify usage bars
      const bmUsage = page.locator('[data-testid="bm-usage-bar"]');
      await expect(bmUsage).toBeVisible();
      await expect(bmUsage.locator('[data-testid="usage-percentage"]')).toContainText('0%');
      
      const adAccountUsage = page.locator('[data-testid="ad-account-usage-bar"]');
      await expect(adAccountUsage).toBeVisible();
      await expect(adAccountUsage.locator('[data-testid="usage-percentage"]')).toContainText('0%');
      
      // Check usage warnings (should not be visible for free tier with no usage)
      await expect(page.locator('[data-testid="usage-warning"]')).not.toBeVisible();
    });

    test('should show usage warnings when approaching limits', async ({ page }) => {
      // Create test data to approach limits
      await page.goto('/api/test/create-usage-data');
      
      await page.goto('/dashboard/billing');
      
      // Wait for usage data to load
      await page.waitForSelector('[data-testid="usage-warning"]');
      
      // Check warning message
      await expect(page.locator('[data-testid="usage-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="usage-warning"]')).toContainText('You are approaching your plan limits');
      
      // Check upgrade suggestion
      await expect(page.locator('[data-testid="upgrade-suggestion"]')).toBeVisible();
      await page.click('[data-testid="upgrade-now-button"]');
      
      // Should redirect to pricing page
      await page.waitForURL('/pricing');
    });

    test('should handle usage overage', async ({ page }) => {
      // Create test data that exceeds limits
      await page.goto('/api/test/create-overage-data');
      
      await page.goto('/dashboard/billing');
      
      // Check overage warning
      await expect(page.locator('[data-testid="overage-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="overage-warning"]')).toContainText('You have exceeded your plan limits');
      
      // Check overage charges
      await expect(page.locator('[data-testid="overage-charges"]')).toBeVisible();
      await expect(page.locator('[data-testid="overage-amount"]')).toContainText('$50.00');
      
      // Check action required message
      await expect(page.locator('[data-testid="action-required"]')).toContainText('Please upgrade your plan or reduce usage');
    });
  });

  test.describe('Billing Notifications', () => {
    test('should handle payment failure notifications', async ({ page }) => {
      // Simulate payment failure
      await page.goto('/api/test/simulate-payment-failure');
      
      await page.goto('/dashboard/billing');
      
      // Check payment failure notification
      await expect(page.locator('[data-testid="payment-failure-alert"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-failure-alert"]')).toContainText('Payment failed');
      
      // Click update payment method
      await page.click('[data-testid="update-payment-method"]');
      
      // Should show payment method form
      await expect(page.locator('[data-testid="payment-method-form"]')).toBeVisible();
    });

    test('should show upcoming renewal notifications', async ({ page }) => {
      // Create subscription with upcoming renewal
      await page.goto('/api/test/create-upcoming-renewal');
      
      await page.goto('/dashboard/billing');
      
      // Check renewal notification
      await expect(page.locator('[data-testid="renewal-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="renewal-notification"]')).toContainText('Your subscription will renew in 3 days');
      
      // Check renewal amount
      await expect(page.locator('[data-testid="renewal-amount"]')).toContainText('$299.00');
      
      // Check manage subscription link
      await expect(page.locator('[data-testid="manage-subscription"]')).toBeVisible();
    });
  });

  test.describe('Billing API Integration', () => {
    test('should handle Stripe webhook events', async ({ page }) => {
      // Test webhook endpoint
      const response = await page.request.post('/api/webhooks/stripe', {
        data: {
          type: 'invoice.payment_succeeded',
          data: {
            object: {
              id: 'in_test123',
              customer: 'cus_test123',
              amount_paid: 29900,
              status: 'paid'
            }
          }
        },
        headers: {
          'stripe-signature': 'test-signature'
        }
      });
      
      expect(response.status()).toBe(200);
    });

    test('should sync subscription status with Stripe', async ({ page, apiHelpers }) => {
      // Create subscription via API
      const subscriptionData = await apiHelpers.post('/api/subscriptions', {
        plan_id: 'pro',
        payment_method_id: 'pm_test123'
      });
      
      expect(subscriptionData.status).toBe('active');
      expect(subscriptionData.current_period_end).toBeDefined();
      
      // Verify subscription appears in dashboard
      await page.goto('/dashboard/billing');
      await expect(page.locator('[data-testid="current-plan"]')).toContainText('Pro');
      await expect(page.locator('[data-testid="plan-status"]')).toContainText('Active');
    });

    test('should handle subscription modifications', async ({ page, apiHelpers }) => {
      // Create initial subscription
      await apiHelpers.post('/api/subscriptions', {
        plan_id: 'basic',
        payment_method_id: 'pm_test123'
      });
      
      // Upgrade subscription
      const upgradeResponse = await apiHelpers.put('/api/subscriptions/current', {
        plan_id: 'pro'
      });
      
      expect(upgradeResponse.status).toBe('active');
      expect(upgradeResponse.plan_id).toBe('pro');
      
      // Verify upgrade in dashboard
      await page.goto('/dashboard/billing');
      await expect(page.locator('[data-testid="current-plan"]')).toContainText('Pro');
    });
  });

  test.describe('Enterprise Features', () => {
    test('should handle custom enterprise pricing', async ({ page }) => {
      await page.goto('/pricing');
      
      // Click enterprise plan
      await page.click('[data-testid="enterprise-plan"] [data-testid="contact-sales-button"]');
      
      // Verify contact form
      await expect(page.locator('[data-testid="enterprise-contact-form"]')).toBeVisible();
      
      // Fill contact form
      await page.fill('[data-testid="company-name"]', 'Test Enterprise Corp');
      await page.fill('[data-testid="contact-email"]', 'enterprise@test.com');
      await page.fill('[data-testid="phone-number"]', '+1234567890');
      await page.fill('[data-testid="company-size"]', '500-1000');
      await page.fill('[data-testid="use-case"]', 'Large scale ad management');
      
      // Submit form
      await page.click('[data-testid="submit-enterprise-inquiry"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="enterprise-inquiry-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="enterprise-inquiry-success"]')).toContainText('Thank you for your interest');
    });

    test('should handle volume discounts', async ({ page }) => {
      await page.goto('/pricing');
      
      // Check volume discount information
      await expect(page.locator('[data-testid="volume-discount-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="volume-discount-info"]')).toContainText('Volume discounts available');
      
      // Click volume discount details
      await page.click('[data-testid="volume-discount-details"]');
      
      // Verify discount tiers
      await expect(page.locator('[data-testid="discount-tier-1"]')).toContainText('10+ licenses: 10% off');
      await expect(page.locator('[data-testid="discount-tier-2"]')).toContainText('50+ licenses: 20% off');
      await expect(page.locator('[data-testid="discount-tier-3"]')).toContainText('100+ licenses: 30% off');
    });
  });
}); 
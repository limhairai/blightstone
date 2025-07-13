# Stripe Pricing Update Guide

## Issue
The current Stripe price IDs in the database are from the old pricing model ($29, $149, $499) but the app now uses new pricing ($79, $299, $799). This causes checkout issues.

## Solution
Create new Stripe price IDs for the updated pricing and update the database.

## Steps

### 1. Set up your Stripe environment
```bash
# Make sure you have your Stripe secret key set
export STRIPE_SECRET_KEY="sk_test_..." # or sk_live_... for production
```

### 2. Install dependencies (if not already installed)
```bash
npm install stripe
```

### 3. Run the Stripe setup script
```bash
cd scripts
node setup-stripe-products.js
```

This will:
- Create new Stripe products for Starter ($79), Growth ($299), Scale ($799)
- Generate new price IDs
- Output SQL commands to update your database

### 4. Update your database
Copy and run the SQL commands that the script outputs. They will look like:

```sql
UPDATE public.plans SET 
  stripe_price_id = 'price_1NewStarterPriceId',
  monthly_subscription_fee_cents = 7900,
  ad_spend_fee_percentage = 1.00
WHERE plan_id = 'starter';

UPDATE public.plans SET 
  stripe_price_id = 'price_1NewGrowthPriceId',
  monthly_subscription_fee_cents = 29900,
  ad_spend_fee_percentage = 1.00
WHERE plan_id = 'growth';

UPDATE public.plans SET 
  stripe_price_id = 'price_1NewScalePriceId',
  monthly_subscription_fee_cents = 79900,
  ad_spend_fee_percentage = 1.00
WHERE plan_id = 'scale';
```

### 5. Test the checkout flow
- Go to your pricing page
- Try to upgrade to each plan
- Verify the correct prices show in Stripe checkout

## New Pricing Structure

| Plan | Old Price | New Price | BMs | Ad Accounts | Pixels | Ad Spend Fee |
|------|-----------|-----------|-----|-------------|--------|--------------|
| Starter | $29 | **$79** | 3 | 10 | 1 | 1% |
| Growth | $149 | **$299** | 5 | 25 | 3 | 1% |
| Scale | $499 | **$799** | 15 | 75 | 10 | 1% |

## Plus Plan
The Plus plan is "Coming Soon" and doesn't need Stripe integration yet.

## Notes
- The app will automatically use the new Stripe price IDs from the database
- Old price IDs will remain in Stripe but won't be used
- Make sure to test in your Stripe test environment first 
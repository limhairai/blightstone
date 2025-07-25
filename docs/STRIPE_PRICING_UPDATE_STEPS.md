# 🚀 Stripe Pricing Update Guide

## Current Issue
The database still has old pricing ($29 for starter) but our pricing-config.ts has new pricing ($79 for starter). We need to:

1. ✅ **Update database pricing** (migration created)
2. 🔄 **Create new Stripe products** (needs Stripe API key)
3. 🔄 **Update database with new Stripe price IDs**

## 📋 Step-by-Step Instructions

### Step 1: Apply Database Migration
```bash
# Run the migration to update pricing in database
cd supabase
supabase db push
```

This updates:
- **Starter**: $29 → $79 (monthly_subscription_fee_cents: 2900 → 7900)
- **Growth**: $149 → $299 (monthly_subscription_fee_cents: 14900 → 29900)  
- **Scale**: $499 → $699 (monthly_subscription_fee_cents: 49900 → 69900)

### Step 2: Set Up Stripe Environment Variable
```bash
# Add your Stripe secret key to environment
export STRIPE_SECRET_KEY="sk_test_YOUR_STRIPE_SECRET_KEY_HERE"

# For production, use:
# export STRIPE_SECRET_KEY="sk_live_YOUR_LIVE_STRIPE_SECRET_KEY_HERE"
```

### Step 3: Create New Stripe Products
```bash
cd scripts
node setup-stripe-products.js
```

This will:
- Create new Stripe products for Starter ($79), Growth ($299), Scale ($699)
- Generate new price IDs
- Output SQL commands to update your database

### Step 4: Update Database with New Stripe Price IDs
Copy and run the SQL commands from Step 3 output. They will look like:

```sql
UPDATE public.plans SET 
  stripe_price_id = 'price_NEW_STARTER_PRICE_ID'
WHERE plan_id = 'starter';

UPDATE public.plans SET 
  stripe_price_id = 'price_NEW_GROWTH_PRICE_ID' 
WHERE plan_id = 'growth';

UPDATE public.plans SET 
  stripe_price_id = 'price_NEW_SCALE_PRICE_ID'
WHERE plan_id = 'scale';
```

### Step 5: Test the Integration
1. Go to your pricing page
2. Try to upgrade to starter plan ($79)
3. Verify Stripe checkout shows correct price
4. Complete a test payment

## 🎯 Current vs New Pricing

| Plan | Old Price | New Price | Monthly Allowance |
|------|-----------|-----------|-------------------|
| Starter | $29 | **$79** | $15,000 |
| Growth | $149 | **$299** | $60,000 |
| Scale | $499 | **$699** | $300,000 |

## 🔍 Verification Steps

After completing all steps:

1. **Check Database**: Query `SELECT plan_id, monthly_subscription_fee_cents, stripe_price_id FROM plans;`
2. **Check Frontend**: Visit `/pricing` and verify displayed prices
3. **Check Stripe**: Login to Stripe dashboard and verify new products exist
4. **Test Checkout**: Try subscribing to starter plan and verify $79 charge

## 🚨 Important Notes

- **Old Stripe price IDs** will still work for existing customers
- **New customers** will use the new price IDs  
- **Test thoroughly** before deploying to production
- **Update both test and live Stripe** environments separately

## 🐛 Troubleshooting

**Issue**: "Stripe authentication error"
**Solution**: Make sure `STRIPE_SECRET_KEY` environment variable is set

**Issue**: "Price mismatch in checkout"  
**Solution**: Verify database has new stripe_price_id values

**Issue**: "Plan not found"
**Solution**: Check that migration was applied successfully 
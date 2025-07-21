# 🚨 PRODUCTION STRIPE SETUP - Fix Checkout Error

## Issue
Your production app is using **live Stripe keys** but your database has **test mode price IDs**. This causes the error:
```
No such price: 'price_1RkDMeA3aCFhTOKMheTqL06p'; a similar object exists in test mode, but a live mode key was used to make this request.
```

## Solution
Create **live mode Stripe products** and update your **production database** with the new price IDs.

---

## 🔧 **Step 1: Get Your Live Stripe Key**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Toggle to LIVE mode** (top-left corner - should be orange/red)
3. Go to **Developers → API Keys**
4. Copy your **Secret key** (starts with `sk_live_...`)

## 🚀 **Step 2: Run Production Setup Script**

```bash
# Set your LIVE Stripe key
export STRIPE_SECRET_KEY="sk_live_YOUR_ACTUAL_LIVE_KEY_HERE"

# Run the production setup script
cd scripts
node setup-stripe-products-production.js
```

This will:
- ✅ Create live Stripe products for your **correct pricing**:
  - **Starter**: $29/month + 5% ad spend fee
  - **Growth**: $299/month, no ad spend fee  
  - **Scale**: $699/month, no ad spend fee
- ✅ Generate SQL to update your production database
- ✅ Save the SQL to `production-stripe-update.sql`

## 🗄️ **Step 3: Update Production Database**

1. Go to your **Supabase Dashboard** (production project)
2. Go to **SQL Editor**
3. Copy and paste the SQL from the script output
4. **Run the SQL**

The SQL will look like this:
```sql
-- Update PRODUCTION database with LIVE Stripe price IDs
UPDATE public.plans SET 
  stripe_price_id = 'price_1LIVE_STARTER_ID',
  monthly_subscription_fee_cents = 2900,
  ad_spend_fee_percentage = 5.00
WHERE plan_id = 'starter';

UPDATE public.plans SET 
  stripe_price_id = 'price_1LIVE_GROWTH_ID',
  monthly_subscription_fee_cents = 29900,
  ad_spend_fee_percentage = 0.00
WHERE plan_id = 'growth';

UPDATE public.plans SET 
  stripe_price_id = 'price_1LIVE_SCALE_ID',
  monthly_subscription_fee_cents = 69900,
  ad_spend_fee_percentage = 0.00
WHERE plan_id = 'scale';
```

## ✅ **Step 4: Test**

1. Try upgrading your plan in production
2. Should now work without errors
3. Verify in Stripe that test payments work correctly

---

## 🔍 **Logs & Debugging**

**Production logs are on Vercel**, not Render:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project
3. Go to **Functions** tab
4. Look for recent errors or logs

**The checkout logs will now show**:
- ✅ Plan found with correct price ID
- ✅ Organization found
- ✅ Stripe session created successfully

---

## 🚨 **Important Notes**

1. **Test vs Live Mode**: Always use live keys for production
2. **Database Sync**: Price IDs in database must match Stripe mode
3. **Webhooks**: Make sure your webhook endpoints can handle live events
4. **Testing**: Test with real payment methods in live mode

---

## ❌ **If Something Goes Wrong**

**Rollback Plan**:
1. Keep your test price IDs as backup
2. Can always switch back to test mode temporarily
3. Re-run script if needed with different pricing

**Get Help**:
- Check Vercel logs for specific errors
- Verify Stripe products were created correctly
- Ensure database was updated properly 
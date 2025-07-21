#!/usr/bin/env node

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createStripeProductsProduction() {
  console.log('🚀 Creating Stripe products for AdHub PRODUCTION (LIVE MODE)...');
  
  // Verify we're using live mode keys
  if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
    console.error('❌ ERROR: Must use live Stripe secret key (starts with sk_live_) for production');
    console.error('Current key starts with:', process.env.STRIPE_SECRET_KEY?.substring(0, 8) || 'undefined');
    process.exit(1);
  }

  try {
    // 1. Create Starter Plan - $29/month + 5% ad spend fee (LIVE MODE)
    const starterProduct = await stripe.products.create({
      name: 'AdHub Starter',
      description: '1 Active Ad Account, 1 BM, 1 Domain Per BM, $1000 Spend Limit',
      metadata: {
        plan_id: 'starter',
        max_business_managers: '1',
        max_ad_accounts: '1',
        domains_per_bm: '1',
        ad_spend_fee: '5.0',
        monthly_topup_limit: '1000',
        bm_application_fee: '50'
      }
    });

    const starterPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 2900, // $29.00
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_id: 'starter'
      }
    });

    console.log('✅ Starter Plan created (LIVE):', starterProduct.id, starterPrice.id);

    // 2. Create Growth Plan - $299/month, no ad spend fee (LIVE MODE)
    const growthProduct = await stripe.products.create({
      name: 'AdHub Growth',
      description: '3 Active Ad Accounts, 2 BMs, 3 Domains Per BM, $3000 Spend Limit',
      metadata: {
        plan_id: 'growth',
        max_business_managers: '2',
        max_ad_accounts: '3',
        domains_per_bm: '3',
        ad_spend_fee: '0',
        monthly_topup_limit: '3000',
        bm_application_fee: '30'
      }
    });

    const growthPrice = await stripe.prices.create({
      product: growthProduct.id,
      unit_amount: 29900, // $299.00
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_id: 'growth'
      }
    });

    console.log('✅ Growth Plan created (LIVE):', growthProduct.id, growthPrice.id);

    // 3. Create Scale Plan - $699/month, no ad spend fee, no spend limit (LIVE MODE)
    const scaleProduct = await stripe.products.create({
      name: 'AdHub Scale',
      description: '5 Active Ad Accounts, 3 BMs, 5 Domains Per BM, No Spend Limit',
      metadata: {
        plan_id: 'scale',
        max_business_managers: '3',
        max_ad_accounts: '5',
        domains_per_bm: '5',
        ad_spend_fee: '0',
        monthly_topup_limit: '-1',
        bm_application_fee: '0'
      }
    });

    const scalePrice = await stripe.prices.create({
      product: scaleProduct.id,
      unit_amount: 69900, // $699.00
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_id: 'scale'
      }
    });

    console.log('✅ Scale Plan created (LIVE):', scaleProduct.id, scalePrice.id);

    // 4. Output SQL to update PRODUCTION database
    console.log('\n🚨 PRODUCTION DATABASE UPDATE REQUIRED:');
    console.log('📋 Run this SQL in your PRODUCTION Supabase dashboard:');
    console.log(`
-- Update PRODUCTION database with LIVE Stripe price IDs
UPDATE public.plans SET 
  stripe_price_id = '${starterPrice.id}',
  monthly_subscription_fee_cents = 2900,
  ad_spend_fee_percentage = 5.00
WHERE plan_id = 'starter';

UPDATE public.plans SET 
  stripe_price_id = '${growthPrice.id}',
  monthly_subscription_fee_cents = 29900,
  ad_spend_fee_percentage = 0.00
WHERE plan_id = 'growth';

UPDATE public.plans SET 
  stripe_price_id = '${scalePrice.id}',
  monthly_subscription_fee_cents = 69900,
  ad_spend_fee_percentage = 0.00
WHERE plan_id = 'scale';

-- Verify the updates
SELECT plan_id, name, monthly_subscription_fee_cents, ad_spend_fee_percentage, stripe_price_id 
FROM public.plans 
WHERE plan_id IN ('starter', 'growth', 'scale'); 
    `);

    console.log('\n🎉 All PRODUCTION Stripe products created successfully!');
    console.log('\n⚠️  CRITICAL NEXT STEPS:');
    console.log('1. 🗄️  Copy and run the SQL above in your PRODUCTION Supabase dashboard');
    console.log('2. 🧪 Test subscription creation in your live app');
    console.log('3. 🔔 Set up webhooks for subscription status updates');
    console.log('4. 💳 Verify checkout works with real payment methods');

    // Save the SQL to a file for easy access
    const fs = require('fs');
    const sql = `-- Update PRODUCTION database with LIVE Stripe price IDs
-- Generated on ${new Date().toISOString()}

UPDATE public.plans SET 
  stripe_price_id = '${starterPrice.id}',
  monthly_subscription_fee_cents = 2900,
  ad_spend_fee_percentage = 5.00
WHERE plan_id = 'starter';

UPDATE public.plans SET 
  stripe_price_id = '${growthPrice.id}',
  monthly_subscription_fee_cents = 29900,
  ad_spend_fee_percentage = 0.00
WHERE plan_id = 'growth';

UPDATE public.plans SET 
  stripe_price_id = '${scalePrice.id}',
  monthly_subscription_fee_cents = 69900,
  ad_spend_fee_percentage = 0.00
WHERE plan_id = 'scale';

-- Verify the updates
SELECT plan_id, name, monthly_subscription_fee_cents, ad_spend_fee_percentage, stripe_price_id 
FROM public.plans 
WHERE plan_id IN ('starter', 'growth', 'scale'); 
`;

    fs.writeFileSync('./production-stripe-update.sql', sql);
    console.log('\n💾 SQL commands saved to: ./production-stripe-update.sql');

  } catch (error) {
    console.error('💥 Error creating Stripe products:', error);
    if (error.message?.includes('test mode')) {
      console.error('\n🚨 SOLUTION: Make sure you are using LIVE mode Stripe keys');
      console.error('  - Go to https://dashboard.stripe.com');
      console.error('  - Toggle to LIVE mode (top-left corner)');
      console.error('  - Get your LIVE secret key (sk_live_...)');
    }
  }
}

// Run the setup
createStripeProductsProduction(); 
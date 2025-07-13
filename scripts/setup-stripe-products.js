#!/usr/bin/env node

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createStripeProducts() {
  console.log('Creating Stripe products for AdHub NEW PRICING...');

  try {
    // 1. Create Starter Plan - $79/month
    const starterProduct = await stripe.products.create({
      name: 'AdHub Starter',
      description: 'Perfect for small businesses getting started with Facebook advertising',
      metadata: {
        plan_id: 'starter',
        max_businesses: '3',
        max_ad_accounts: '10',
        max_pixels: '1',
        ad_spend_fee: '1'
      }
    });

    const starterPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 7900, // $79.00
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_id: 'starter'
      }
    });

    console.log('✅ Starter Plan created:', starterProduct.id, starterPrice.id);

    // 2. Create Growth Plan - $299/month
    const growthProduct = await stripe.products.create({
      name: 'AdHub Growth',
      description: 'For growing businesses that need more ad accounts and pixels',
      metadata: {
        plan_id: 'growth',
        max_businesses: '5',
        max_ad_accounts: '25',
        max_pixels: '3',
        ad_spend_fee: '1'
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

    console.log('✅ Growth Plan created:', growthProduct.id, growthPrice.id);

    // 3. Create Scale Plan - $799/month
    const scaleProduct = await stripe.products.create({
      name: 'AdHub Scale',
      description: 'For scaling businesses with multiple teams and high ad spend',
      metadata: {
        plan_id: 'scale',
        max_businesses: '15',
        max_ad_accounts: '75',
        max_pixels: '10',
        ad_spend_fee: '1'
      }
    });

    const scalePrice = await stripe.prices.create({
      product: scaleProduct.id,
      unit_amount: 79900, // $799.00
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_id: 'scale'
      }
    });

    console.log('✅ Scale Plan created:', scaleProduct.id, scalePrice.id);

    // 4. Output SQL to update database
    console.log('\n📋 Run this SQL to update your database with NEW Stripe price IDs:');
    console.log(`
UPDATE public.plans SET 
  stripe_price_id = '${starterPrice.id}',
  monthly_subscription_fee_cents = 7900,
  ad_spend_fee_percentage = 1.00
WHERE plan_id = 'starter';

UPDATE public.plans SET 
  stripe_price_id = '${growthPrice.id}',
  monthly_subscription_fee_cents = 29900,
  ad_spend_fee_percentage = 1.00
WHERE plan_id = 'growth';

UPDATE public.plans SET 
  stripe_price_id = '${scalePrice.id}',
  monthly_subscription_fee_cents = 79900,
  ad_spend_fee_percentage = 1.00
WHERE plan_id = 'scale';
    `);

    console.log('\n🎉 All NEW Stripe products created successfully!');
    console.log('\nNext steps:');
    console.log('1. Run the SQL commands above to update your database');
    console.log('2. Test subscription creation in your app');
    console.log('3. Set up webhooks for subscription status updates');

  } catch (error) {
    console.error('Error creating Stripe products:', error);
  }
}

createStripeProducts(); 
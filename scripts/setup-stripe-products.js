#!/usr/bin/env node

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createStripeProducts() {
  console.log('Creating Stripe products for AdHub...');

  try {
    // 1. Create Starter Plan
    const starterProduct = await stripe.products.create({
      name: 'AdHub Starter',
      description: 'Perfect for small businesses getting started with Facebook advertising',
      metadata: {
        plan_id: 'starter',
        max_businesses: '1',
        max_ad_accounts: '5',
        max_team_members: '2',
        ad_spend_fee: '6'
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

    console.log('✅ Starter Plan created:', starterProduct.id, starterPrice.id);

    // 2. Create Growth Plan
    const growthProduct = await stripe.products.create({
      name: 'AdHub Growth',
      description: 'For growing businesses that need more ad accounts and team members',
      metadata: {
        plan_id: 'growth',
        max_businesses: '3',
        max_ad_accounts: '21',
        max_team_members: '5',
        ad_spend_fee: '3'
      }
    });

    const growthPrice = await stripe.prices.create({
      product: growthProduct.id,
      unit_amount: 14900, // $149.00
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_id: 'growth'
      }
    });

    console.log('✅ Growth Plan created:', growthProduct.id, growthPrice.id);

    // 3. Create Scale Plan
    const scaleProduct = await stripe.products.create({
      name: 'AdHub Scale',
      description: 'For scaling businesses with multiple teams and high ad spend',
      metadata: {
        plan_id: 'scale',
        max_businesses: '10',
        max_ad_accounts: '70',
        max_team_members: '15',
        ad_spend_fee: '1.5'
      }
    });

    const scalePrice = await stripe.prices.create({
      product: scaleProduct.id,
      unit_amount: 49900, // $499.00
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_id: 'scale'
      }
    });

    console.log('✅ Scale Plan created:', scaleProduct.id, scalePrice.id);

    // 4. Create Enterprise Plan
    const enterpriseProduct = await stripe.products.create({
      name: 'AdHub Enterprise',
      description: 'For large organizations with unlimited needs and priority support',
      metadata: {
        plan_id: 'enterprise',
        max_businesses: '-1', // Unlimited
        max_ad_accounts: '-1', // Unlimited
        max_team_members: '-1', // Unlimited
        ad_spend_fee: '1'
      }
    });

    const enterprisePrice = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 149900, // $1,499.00
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_id: 'enterprise'
      }
    });

    console.log('✅ Enterprise Plan created:', enterpriseProduct.id, enterprisePrice.id);

    // 5. Output SQL to update database
    console.log('\n📋 Run this SQL to update your database with Stripe price IDs:');
    console.log(`
UPDATE public.plans SET stripe_price_id = '${starterPrice.id}' WHERE id = 'starter';
UPDATE public.plans SET stripe_price_id = '${growthPrice.id}' WHERE id = 'growth';
UPDATE public.plans SET stripe_price_id = '${scalePrice.id}' WHERE id = 'scale';
UPDATE public.plans SET stripe_price_id = '${enterprisePrice.id}' WHERE id = 'enterprise';
    `);

    console.log('\n🎉 All Stripe products created successfully!');
    console.log('\nNext steps:');
    console.log('1. Run the SQL commands above to update your database');
    console.log('2. Test subscription creation in your app');
    console.log('3. Set up webhooks for subscription status updates');

    return {
      starter: { product: starterProduct.id, price: starterPrice.id },
      growth: { product: growthProduct.id, price: growthPrice.id },
      scale: { product: scaleProduct.id, price: scalePrice.id },
      enterprise: { product: enterpriseProduct.id, price: enterprisePrice.id }
    };

  } catch (error) {
    console.error('❌ Error creating Stripe products:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createStripeProducts()
    .then((products) => {
      console.log('\n✅ Setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createStripeProducts }; 
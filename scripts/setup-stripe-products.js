#!/usr/bin/env node

const Stripe = require('stripe');

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const SUBSCRIPTION_PLANS = [
  {
    id: 'starter',
    name: 'Starter Plan',
    description: 'Perfect for testing and small projects',
    price: 2900, // $29.00 in cents
    features: ['1 Business Manager', '5 Ad Accounts', '2 Team Members', '6% ad spend fee']
  },
  {
    id: 'growth', 
    name: 'Growth Plan',
    description: 'For growing businesses',
    price: 14900, // $149.00 in cents
    features: ['3 Business Managers', '21 Ad Accounts', '5 Team Members', '3% ad spend fee']
  },
  {
    id: 'scale',
    name: 'Scale Plan', 
    description: 'For scaling teams',
    price: 49900, // $499.00 in cents
    features: ['10 Business Managers', '70 Ad Accounts', '15 Team Members', '1.5% ad spend fee']
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    description: 'For large organizations', 
    price: 149900, // $1499.00 in cents
    features: ['Unlimited Business Managers', 'Unlimited Ad Accounts', 'Unlimited Team Members', '1% ad spend fee']
  }
];

async function createStripeProducts() {
  console.log('🚀 Setting up Stripe products and prices...\n');
  
  const results = [];
  
  for (const plan of SUBSCRIPTION_PLANS) {
    try {
      console.log(`Creating product: ${plan.name}...`);
      
      // Create product
      const product = await stripe.products.create({
        id: `adhub_${plan.id}`,
        name: plan.name,
        description: plan.description,
        metadata: {
          plan_id: plan.id,
          features: JSON.stringify(plan.features)
        }
      });
      
      console.log(`✅ Product created: ${product.id}`);
      
      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price,
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        lookup_key: plan.id,
        metadata: {
          plan_id: plan.id
        }
      });
      
      console.log(`✅ Price created: ${price.id} ($${plan.price / 100}/month)`);
      
      results.push({
        plan_id: plan.id,
        product_id: product.id,
        price_id: price.id,
        amount: plan.price
      });
      
      console.log('');
      
    } catch (error) {
      console.error(`❌ Error creating ${plan.name}:`, error.message);
      
      // If product already exists, try to get existing price
      if (error.code === 'resource_already_exists') {
        try {
          const existingProduct = await stripe.products.retrieve(`adhub_${plan.id}`);
          const prices = await stripe.prices.list({
            product: existingProduct.id,
            active: true
          });
          
          if (prices.data.length > 0) {
            console.log(`✅ Using existing product and price for ${plan.name}`);
            results.push({
              plan_id: plan.id,
              product_id: existingProduct.id,
              price_id: prices.data[0].id,
              amount: prices.data[0].unit_amount
            });
          }
        } catch (retrieveError) {
          console.error(`❌ Error retrieving existing product:`, retrieveError.message);
        }
      }
    }
  }
  
  // Output results for database update
  console.log('\n🎯 Stripe Setup Complete!');
  console.log('\n📋 Update your database with these Stripe Price IDs:');
  console.log('\n```sql');
  
  for (const result of results) {
    console.log(`UPDATE plans SET stripe_price_id = '${result.price_id}' WHERE id = '${result.plan_id}';`);
  }
  
  console.log('```\n');
  
  // Output for environment variables
  console.log('🔧 Add these to your environment variables:');
  console.log('\n```env');
  for (const result of results) {
    console.log(`STRIPE_PRICE_${result.plan_id.toUpperCase()}=${result.price_id}`);
  }
  console.log('```\n');
  
  return results;
}

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY environment variable is required');
    process.exit(1);
  }
  
  try {
    await createStripeProducts();
    console.log('✅ All done! Your Stripe products are ready for subscriptions.');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createStripeProducts, SUBSCRIPTION_PLANS }; 
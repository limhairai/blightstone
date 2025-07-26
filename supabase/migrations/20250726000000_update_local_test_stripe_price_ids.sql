-- Update local database with TEST MODE Stripe price IDs for localhost development
-- These are different from production price IDs and work with test Stripe keys

-- Update starter plan with test mode price ID
UPDATE public.plans SET 
  stripe_price_id = 'price_1Rp53rBj0uRvksOpt4K3Bqxr',
  monthly_subscription_fee_cents = 7900,
  ad_spend_fee_percentage = 1.00
WHERE plan_id = 'starter';

-- Update growth plan with test mode price ID  
UPDATE public.plans SET 
  stripe_price_id = 'price_1Rp53rBj0uRvksOpvRlZY2zp',
  monthly_subscription_fee_cents = 29900,
  ad_spend_fee_percentage = 1.00
WHERE plan_id = 'growth';

-- Update scale plan with test mode price ID
UPDATE public.plans SET 
  stripe_price_id = 'price_1Rp53sBj0uRvksOpn7oEZdSq',
  monthly_subscription_fee_cents = 79900,
  ad_spend_fee_percentage = 1.00
WHERE plan_id = 'scale';

-- Verify the update
SELECT plan_id, stripe_price_id, monthly_subscription_fee_cents, ad_spend_fee_percentage 
FROM public.plans 
WHERE plan_id IN ('starter', 'growth', 'scale'); 
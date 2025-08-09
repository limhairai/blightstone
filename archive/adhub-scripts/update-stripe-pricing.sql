-- Update database with new Stripe price IDs for updated pricing
-- Generated from setup-stripe-products.js script

UPDATE public.plans SET 
  stripe_price_id = 'price_1RkDMdA3aCFhTOKM184QD0FK',
  monthly_subscription_fee_cents = 7900,
  ad_spend_fee_percentage = 1.00
WHERE plan_id = 'starter';

UPDATE public.plans SET 
  stripe_price_id = 'price_1RkDMeA3aCFhTOKMheTqL06p',
  monthly_subscription_fee_cents = 29900,
  ad_spend_fee_percentage = 1.00
WHERE plan_id = 'growth';

UPDATE public.plans SET 
  stripe_price_id = 'price_1RkDMfA3aCFhTOKMcCfj3HJV',
  monthly_subscription_fee_cents = 79900,
  ad_spend_fee_percentage = 1.00
WHERE plan_id = 'scale';

-- Verify the updates
SELECT plan_id, name, monthly_subscription_fee_cents, ad_spend_fee_percentage, stripe_price_id 
FROM public.plans 
WHERE plan_id IN ('starter', 'growth', 'scale'); 
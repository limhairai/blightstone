-- Update PRODUCTION database with LIVE Stripe price IDs
-- Generated on 2025-07-21T08:34:08.789Z

UPDATE public.plans SET 
  stripe_price_id = 'price_1RnFAgA3aCFhTOKM7PDMMfvo',
  monthly_subscription_fee_cents = 2900,
  ad_spend_fee_percentage = 5.00
WHERE plan_id = 'starter';

UPDATE public.plans SET 
  stripe_price_id = 'price_1RnFAhA3aCFhTOKMYWZ8ByZX',
  monthly_subscription_fee_cents = 29900,
  ad_spend_fee_percentage = 0.00
WHERE plan_id = 'growth';

UPDATE public.plans SET 
  stripe_price_id = 'price_1RnFAiA3aCFhTOKMCWr2rfHd',
  monthly_subscription_fee_cents = 69900,
  ad_spend_fee_percentage = 0.00
WHERE plan_id = 'scale';

-- Verify the updates
SELECT plan_id, name, monthly_subscription_fee_cents, ad_spend_fee_percentage, stripe_price_id 
FROM public.plans 
WHERE plan_id IN ('starter', 'growth', 'scale'); 

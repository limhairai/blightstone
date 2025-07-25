-- Update Stripe price IDs for new Stripe account
-- These are the NEW price IDs from the updated Stripe account

UPDATE public.plans SET 
  stripe_price_id = 'price_1RojZYBj0uRvksOpiAxVzshZ'
WHERE plan_id = 'starter';

UPDATE public.plans SET 
  stripe_price_id = 'price_1RojZZBj0uRvksOpSwmFXagI'
WHERE plan_id = 'growth';

UPDATE public.plans SET 
  stripe_price_id = 'price_1RojZaBj0uRvksOpqFuTcuGI'
WHERE plan_id = 'scale'; 
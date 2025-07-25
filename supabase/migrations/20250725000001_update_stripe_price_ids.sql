-- Update Stripe price IDs for new pricing structure
-- These are the NEW live Stripe price IDs for updated pricing

UPDATE public.plans SET 
  stripe_price_id = 'price_1RojAzA3aCFhTOKMFXA9K92v'
WHERE plan_id = 'starter';

UPDATE public.plans SET 
  stripe_price_id = 'price_1RojB0A3aCFhTOKMtoI3KnwD'
WHERE plan_id = 'growth';

UPDATE public.plans SET 
  stripe_price_id = 'price_1RojB1A3aCFhTOKM8fW4Vz5F'
WHERE plan_id = 'scale'; 
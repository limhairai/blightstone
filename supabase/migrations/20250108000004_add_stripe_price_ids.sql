-- Add Stripe price IDs to existing plans
-- Generated from Stripe products setup script

UPDATE public.plans SET stripe_price_id = 'price_1RgEqyA3aCFhTOKMThZzQCkl' WHERE id = 'starter';
UPDATE public.plans SET stripe_price_id = 'price_1RgEqzA3aCFhTOKMnDvGYIzC' WHERE id = 'growth';
UPDATE public.plans SET stripe_price_id = 'price_1RgEr0A3aCFhTOKMt4Ayx24U' WHERE id = 'scale';
UPDATE public.plans SET stripe_price_id = 'price_1RgEr0A3aCFhTOKMSHTidcpm' WHERE id = 'enterprise';

-- Verify all paid plans now have Stripe price IDs (free plan doesn't need one)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.plans WHERE stripe_price_id IS NULL AND id != 'free') THEN
        RAISE EXCEPTION 'Some paid plans are missing Stripe price IDs';
    END IF;
    
    RAISE NOTICE 'All paid plans successfully updated with Stripe price IDs';
END $$; 
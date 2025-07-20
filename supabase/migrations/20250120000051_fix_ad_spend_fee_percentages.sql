-- Fix ad spend fee percentages to match the correct pricing structure
-- Current issue: All plans have 1.00% fee, but they should be different

-- Update ad spend fee percentages according to backend/app/core/plans.py
UPDATE public.plans SET ad_spend_fee_percentage = 1.25 WHERE plan_id = 'starter';   -- 1.25%
UPDATE public.plans SET ad_spend_fee_percentage = 1.0 WHERE plan_id = 'growth';     -- 1.0%
UPDATE public.plans SET ad_spend_fee_percentage = 0.5 WHERE plan_id = 'scale';      -- 0.5%
UPDATE public.plans SET ad_spend_fee_percentage = 0.0 WHERE plan_id = 'enterprise'; -- 0% (contract-based)

-- Verify the updates
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Updated ad spend fee percentages:';
    FOR rec IN SELECT plan_id, name, ad_spend_fee_percentage FROM plans WHERE is_active = true ORDER BY monthly_subscription_fee_cents
    LOOP
        RAISE NOTICE '% (%): % fee', rec.name, rec.plan_id, rec.ad_spend_fee_percentage;
    END LOOP;
END $$; 
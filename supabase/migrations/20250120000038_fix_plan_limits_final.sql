-- Fix plan limits to match the correct subscription tiers
-- Starter: 3 BM, 10 ad accounts
-- Growth: 5 BM, 25 ad accounts  
-- Scale: 15 BM, 75 ad accounts
-- Enterprise: unlimited

-- Show current limits before update
DO $$
DECLARE
    plan_record RECORD;
BEGIN
    RAISE NOTICE 'Current plan limits before update:';
    FOR plan_record IN 
        SELECT plan_id, name, max_businesses, max_ad_accounts 
        FROM plans 
        WHERE plan_id IN ('starter', 'growth', 'scale', 'enterprise')
        ORDER BY monthly_subscription_fee_cents
    LOOP
        RAISE NOTICE '% (%): % BM, % ad accounts', plan_record.name, plan_record.plan_id, plan_record.max_businesses, plan_record.max_ad_accounts;
    END LOOP;
END $$;

-- Update plan limits to correct values
UPDATE public.plans SET 
    max_businesses = 3,
    max_ad_accounts = 10
WHERE plan_id = 'starter';

UPDATE public.plans SET 
    max_businesses = 5,
    max_ad_accounts = 25
WHERE plan_id = 'growth';

UPDATE public.plans SET 
    max_businesses = 15,
    max_ad_accounts = 75
WHERE plan_id = 'scale';

-- Enterprise should already be unlimited (-1) but let's make sure
UPDATE public.plans SET 
    max_businesses = -1,
    max_ad_accounts = -1
WHERE plan_id = 'enterprise';

-- Verify the changes
DO $$
DECLARE
    plan_record RECORD;
    starter_bm INTEGER;
    starter_accounts INTEGER;
    growth_bm INTEGER;
    growth_accounts INTEGER;
    scale_bm INTEGER;
    scale_accounts INTEGER;
BEGIN
    -- Get updated values
    SELECT max_businesses, max_ad_accounts INTO starter_bm, starter_accounts FROM plans WHERE plan_id = 'starter';
    SELECT max_businesses, max_ad_accounts INTO growth_bm, growth_accounts FROM plans WHERE plan_id = 'growth';
    SELECT max_businesses, max_ad_accounts INTO scale_bm, scale_accounts FROM plans WHERE plan_id = 'scale';
    
    -- Verify correct values
    IF starter_bm != 3 OR starter_accounts != 10 THEN
        RAISE EXCEPTION 'Starter plan should have 3 BM and 10 accounts, found % BM and % accounts', starter_bm, starter_accounts;
    END IF;
    
    IF growth_bm != 5 OR growth_accounts != 25 THEN
        RAISE EXCEPTION 'Growth plan should have 5 BM and 25 accounts, found % BM and % accounts', growth_bm, growth_accounts;
    END IF;
    
    IF scale_bm != 15 OR scale_accounts != 75 THEN
        RAISE EXCEPTION 'Scale plan should have 15 BM and 75 accounts, found % BM and % accounts', scale_bm, scale_accounts;
    END IF;
    
    RAISE NOTICE 'Successfully updated plan limits:';
    FOR plan_record IN 
        SELECT plan_id, name, max_businesses, max_ad_accounts 
        FROM plans 
        WHERE plan_id IN ('starter', 'growth', 'scale', 'enterprise')
        ORDER BY monthly_subscription_fee_cents
    LOOP
        RAISE NOTICE '% (%): % BM, % ad accounts', plan_record.name, plan_record.plan_id, plan_record.max_businesses, plan_record.max_ad_accounts;
    END LOOP;
END $$; 
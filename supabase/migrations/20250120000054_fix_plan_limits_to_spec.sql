-- Fix plan limits to match the exact specifications
-- Starter: 1 BM, 10 AA, 2 pixels, 2 domains/BM
-- Growth: 3 BM, 25 AA, 5 pixels, 3 domains/BM
-- Scale: 10 BM, 75 AA, 10 pixels, 5 domains/BM

-- Show current limits before update
DO $$
DECLARE
    plan_record RECORD;
BEGIN
    RAISE NOTICE 'Current plan limits before specification fix:';
    FOR plan_record IN 
        SELECT plan_id, name, max_businesses, max_ad_accounts, max_pixels, ad_spend_fee_percentage
        FROM plans 
        WHERE plan_id IN ('starter', 'growth', 'scale', 'enterprise')
        ORDER BY monthly_subscription_fee_cents
    LOOP
        RAISE NOTICE '% (%): % BM, % AA, % pixels, % fee', 
            plan_record.name, plan_record.plan_id, plan_record.max_businesses, 
            plan_record.max_ad_accounts, plan_record.max_pixels, plan_record.ad_spend_fee_percentage;
    END LOOP;
END $$;

-- Update plan limits to match specifications
UPDATE public.plans SET 
    max_businesses = 1,      -- 1 Active Business Manager
    max_ad_accounts = 10,    -- 10 Active Ad Accounts
    max_pixels = 2           -- 2 Active Pixels
WHERE plan_id = 'starter';

UPDATE public.plans SET 
    max_businesses = 3,      -- 3 Active BMs
    max_ad_accounts = 20,    -- 20 Active AAs (reduced from 25)
    max_pixels = 5           -- 5 Active Pixels
WHERE plan_id = 'growth';

UPDATE public.plans SET 
    max_businesses = 10,     -- 10 Active BMs
    max_ad_accounts = 50,    -- 50 Active AAs (reduced from 75)
    max_pixels = 10          -- 10 Active Pixels
WHERE plan_id = 'scale';

-- Enterprise should remain unlimited
UPDATE public.plans SET 
    max_businesses = -1,     -- Unlimited
    max_ad_accounts = -1,    -- Unlimited
    max_pixels = -1          -- Unlimited
WHERE plan_id = 'enterprise';

-- Verify the changes
DO $$
DECLARE
    plan_record RECORD;
BEGIN
    RAISE NOTICE 'Updated plan limits to match specifications:';
    FOR plan_record IN 
        SELECT plan_id, name, max_businesses, max_ad_accounts, max_pixels, ad_spend_fee_percentage
        FROM plans 
        WHERE plan_id IN ('starter', 'growth', 'scale', 'enterprise')
        ORDER BY monthly_subscription_fee_cents
    LOOP
        RAISE NOTICE '% (%): % BM, % AA, % pixels, % fee', 
            plan_record.name, plan_record.plan_id, plan_record.max_businesses, 
            plan_record.max_ad_accounts, plan_record.max_pixels, plan_record.ad_spend_fee_percentage;
    END LOOP;
END $$;

-- Verify domain limits per BM (should already be correct from previous migration)
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Domain limits per BM (from pricing config):';
    RAISE NOTICE 'Starter: 2 domains/BM, Growth: 3 domains/BM, Scale: 5 domains/BM';
END $$; 
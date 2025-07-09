-- Fix Growth plan business manager limit to 3
-- This ensures the plan limits are correctly enforced

-- First, let's check current plan limits
DO $$
DECLARE
    growth_businesses INTEGER;
BEGIN
    SELECT max_businesses INTO growth_businesses FROM plans WHERE plan_id = 'growth';
    RAISE NOTICE 'Current Growth plan max_businesses: %', COALESCE(growth_businesses::TEXT, 'NULL');
END $$;

-- Update Growth plan to have correct business manager limit
UPDATE plans SET 
  max_businesses = 3
WHERE plan_id = 'growth';

-- Verify the update
DO $$
DECLARE
    growth_businesses INTEGER;
BEGIN
    SELECT max_businesses INTO growth_businesses FROM plans WHERE plan_id = 'growth';
    
    IF growth_businesses != 3 THEN
        RAISE EXCEPTION 'Growth plan should have 3 business managers, found %', growth_businesses;
    END IF;
    
    RAISE NOTICE 'Successfully updated Growth plan max_businesses to %', growth_businesses;
END $$;

-- Show all plan limits for verification
SELECT 
    plan_id,
    name,
    max_businesses,
    max_ad_accounts,
    max_team_members
FROM plans 
WHERE is_active = true
ORDER BY monthly_subscription_fee_cents; 
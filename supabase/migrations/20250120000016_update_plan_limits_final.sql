-- Update plan limits to match user requirements
-- Growth: 15 ad accounts (not 21)
-- Scale: 50 ad accounts (not 70)

UPDATE plans SET 
  max_ad_accounts = 15
WHERE plan_id = 'growth';

UPDATE plans SET 
  max_ad_accounts = 50
WHERE plan_id = 'scale';

-- Verify the changes
DO $$
DECLARE
    growth_accounts INTEGER;
    scale_accounts INTEGER;
BEGIN
    SELECT max_ad_accounts INTO growth_accounts FROM plans WHERE plan_id = 'growth';
    SELECT max_ad_accounts INTO scale_accounts FROM plans WHERE plan_id = 'scale';
    
    IF growth_accounts != 15 THEN
        RAISE EXCEPTION 'Growth plan should have 15 ad accounts, found %', growth_accounts;
    END IF;
    
    IF scale_accounts != 50 THEN
        RAISE EXCEPTION 'Scale plan should have 50 ad accounts, found %', scale_accounts;
    END IF;
    
    RAISE NOTICE 'Successfully updated plan limits: Growth=% ad accounts, Scale=% ad accounts', growth_accounts, scale_accounts;
END $$; 
-- Update plan limits to 5 accounts per BM and clean features
-- Based on provider constraint of 7 accounts per BM, we'll use 5 for cleaner numbers

UPDATE plans SET 
  max_ad_accounts = 5,
  features = '["Basic Support"]'
WHERE id = 'starter';

UPDATE plans SET 
  max_ad_accounts = 15,  -- 3 BMs × 5 accounts
  features = '["Priority Support"]'
WHERE id = 'growth';

UPDATE plans SET 
  max_ad_accounts = 50,  -- 10 BMs × 5 accounts  
  features = '["Dedicated Support"]'
WHERE id = 'scale';

UPDATE plans SET 
  features = '["Account Manager", "Priority Feature Requests"]'
WHERE id = 'enterprise';

-- Verify the changes
SELECT id, name, max_businesses, max_ad_accounts, features 
FROM plans 
ORDER BY monthly_subscription_fee_cents; 
-- Update starter plan pricing to match the new pricing config
-- This migration updates the starter plan from $29 to $79 to match pricing-config.ts

-- Update the starter plan pricing
UPDATE public.plans SET 
  monthly_subscription_fee_cents = 7900, -- $79.00 (updated from $29.00)
  ad_spend_fee_percentage = 1.25, -- Updated to match pricing-config.ts
  max_ad_accounts = 3, -- Updated to match pricing-config.ts  
  features = '["Basic Support", "Standard Features", "1 Business Manager", "3 Ad Accounts", "2 Domains per BM"]'::jsonb
WHERE plan_id = 'starter';

-- Update growth plan to match pricing-config.ts
UPDATE public.plans SET 
  monthly_subscription_fee_cents = 29900, -- $299.00 (updated from $149.00)
  ad_spend_fee_percentage = 1.00, -- Updated to match pricing-config.ts
  max_businesses = 3, -- Updated to match pricing-config.ts
  max_ad_accounts = 10, -- Updated to match pricing-config.ts
  features = '["Priority Support", "Advanced Analytics", "3 Business Managers", "10 Ad Accounts", "3 Domains per BM"]'::jsonb
WHERE plan_id = 'growth';

-- Update scale plan to match pricing-config.ts  
UPDATE public.plans SET 
  monthly_subscription_fee_cents = 69900, -- $699.00 (updated from $499.00)
  ad_spend_fee_percentage = 0.50, -- Updated to match pricing-config.ts
  max_businesses = 5, -- Updated to match pricing-config.ts
  max_ad_accounts = 20, -- Updated to match pricing-config.ts
  features = '["Dedicated Support", "Custom Integrations", "5 Business Managers", "20 Ad Accounts", "5 Domains per BM"]'::jsonb
WHERE plan_id = 'scale';

-- Note: Stripe price IDs will need to be updated separately after creating new Stripe products
-- Run the setup-stripe-products.js script with proper STRIPE_SECRET_KEY environment variable
-- Then update the stripe_price_id fields with the new price IDs 
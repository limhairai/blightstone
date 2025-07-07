-- Fix plans table data to ensure all plans exist with correct stripe_price_id values
-- This migration ensures consistency after the semantic ID migration

-- First, ensure the free plan exists (it might not have been inserted due to column name conflicts)
INSERT INTO public.plans (
    plan_id,
    name,
    description,
    monthly_subscription_fee_cents,
    ad_spend_fee_percentage,
    max_team_members,
    max_businesses,
    max_ad_accounts,
    features,
    stripe_price_id,
    is_active
) VALUES (
    'free',
    'Free',
    'Explore AdHub dashboard and features',
    0,
    0,
    1,
    0,
    0,
    '["Dashboard Access", "Feature Preview", "Account Management"]'::jsonb,
    NULL,
    true
) ON CONFLICT (plan_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    monthly_subscription_fee_cents = EXCLUDED.monthly_subscription_fee_cents,
    ad_spend_fee_percentage = EXCLUDED.ad_spend_fee_percentage,
    max_team_members = EXCLUDED.max_team_members,
    max_businesses = EXCLUDED.max_businesses,
    max_ad_accounts = EXCLUDED.max_ad_accounts,
    features = EXCLUDED.features,
    stripe_price_id = EXCLUDED.stripe_price_id,
    is_active = EXCLUDED.is_active;

-- Ensure all other plans exist with correct data
INSERT INTO public.plans (
    plan_id,
    name,
    description,
    monthly_subscription_fee_cents,
    ad_spend_fee_percentage,
    max_team_members,
    max_businesses,
    max_ad_accounts,
    features,
    stripe_price_id,
    is_active
) VALUES 
(
    'starter',
    'Starter',
    'Perfect for testing and small projects',
    2900,
    6.00,
    2,
    1,
    5,
    '["Basic Support", "Standard Features"]'::jsonb,
    'price_1RgEqyA3aCFhTOKMThZzQCkl',
    true
),
(
    'growth',
    'Growth',
    'For growing businesses',
    14900,
    3.00,
    5,
    3,
    21,
    '["Priority Support", "Advanced Analytics"]'::jsonb,
    'price_1RgEqzA3aCFhTOKMnDvGYIzC',
    true
),
(
    'scale',
    'Scale',
    'For scaling teams',
    49900,
    1.50,
    15,
    10,
    70,
    '["Dedicated Support", "Custom Integrations", "Advanced Reporting"]'::jsonb,
    'price_1RgEr0A3aCFhTOKMt4Ayx24U',
    true
),
(
    'enterprise',
    'Enterprise',
    'For large organizations',
    149900,
    1.00,
    -1,
    -1,
    -1,
    '["White-label Options", "Account Manager", "API Access", "Priority Feature Requests"]'::jsonb,
    'price_1RgEr0A3aCFhTOKMSHTidcpm',
    true
) ON CONFLICT (plan_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    monthly_subscription_fee_cents = EXCLUDED.monthly_subscription_fee_cents,
    ad_spend_fee_percentage = EXCLUDED.ad_spend_fee_percentage,
    max_team_members = EXCLUDED.max_team_members,
    max_businesses = EXCLUDED.max_businesses,
    max_ad_accounts = EXCLUDED.max_ad_accounts,
    features = EXCLUDED.features,
    stripe_price_id = EXCLUDED.stripe_price_id,
    is_active = EXCLUDED.is_active;

-- Verify all plans now have proper data
DO $$
DECLARE
    plan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO plan_count FROM public.plans WHERE is_active = true;
    
    IF plan_count < 4 THEN
        RAISE EXCEPTION 'Expected at least 4 active plans, found %', plan_count;
    END IF;
    
    -- Check that paid plans have stripe_price_id
    IF EXISTS (SELECT 1 FROM public.plans WHERE plan_id != 'free' AND stripe_price_id IS NULL AND is_active = true) THEN
        RAISE EXCEPTION 'Some paid plans are missing Stripe price IDs';
    END IF;
    
    RAISE NOTICE 'Successfully verified % active plans with proper Stripe price IDs', plan_count;
END $$; 
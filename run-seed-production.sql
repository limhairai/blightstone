-- Seed data for production database
-- Run this after the main schema has been created

-- Insert subscription plans
INSERT INTO public.plans (
    id, name, monthly_subscription_fee_cents, ad_spend_fee_percentage, 
    ad_account_pool_limit, unlimited_replacements, stripe_price_id, is_active,
    max_businesses, max_ad_accounts, max_team_members, max_monthly_spend_cents, features, trial_days
) VALUES 
    (
        'free', 
        'Free', 
        0, 
        0.0500, 
        1, 
        false, 
        null, 
        true,
        1,
        5,
        1,
        500000, -- $5,000
        '["1 business", "5 ad accounts", "1 team member", "Basic support", "Email notifications"]'::jsonb,
        0
    ),
    (
        'bronze', 
        'Bronze', 
        2900, 
        0.0400, 
        3, 
        false, 
        'price_bronze_monthly', 
        true,
        3,
        25,
        3,
        2500000, -- $25,000
        '["3 businesses", "25 ad accounts", "3 team members", "Priority support", "All notifications", "Basic analytics"]'::jsonb,
        14
    ),
    (
        'silver', 
        'Silver', 
        9900, 
        0.0300, 
        5, 
        true, 
        'price_silver_monthly', 
        true,
        10,
        100,
        10,
        10000000, -- $100,000
        '["10 businesses", "100 ad accounts", "10 team members", "Priority support", "All notifications", "Advanced analytics", "API access"]'::jsonb,
        14
    ),
    (
        'gold', 
        'Gold', 
        49900, 
        0.0250, 
        10, 
        true, 
        'price_gold_monthly', 
        true,
        25,
        250,
        25,
        25000000, -- $250,000
        '["25 businesses", "250 ad accounts", "25 team members", "Dedicated support", "All notifications", "Advanced analytics", "Full API access", "Custom integrations"]'::jsonb,
        30
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    monthly_subscription_fee_cents = EXCLUDED.monthly_subscription_fee_cents,
    ad_spend_fee_percentage = EXCLUDED.ad_spend_fee_percentage,
    ad_account_pool_limit = EXCLUDED.ad_account_pool_limit,
    unlimited_replacements = EXCLUDED.unlimited_replacements,
    stripe_price_id = EXCLUDED.stripe_price_id,
    is_active = EXCLUDED.is_active,
    max_businesses = EXCLUDED.max_businesses,
    max_ad_accounts = EXCLUDED.max_ad_accounts,
    max_team_members = EXCLUDED.max_team_members,
    max_monthly_spend_cents = EXCLUDED.max_monthly_spend_cents,
    features = EXCLUDED.features,
    trial_days = EXCLUDED.trial_days,
    updated_at = timezone('utc'::text, now()); 
-- Enhanced seed data for production-ready plans
-- Note: Ensure these IDs match what you might use in your application logic or frontend.

INSERT INTO public.plans (
    id, 
    name, 
    monthly_subscription_fee_cents, 
    ad_spend_fee_percentage, 
    ad_account_pool_limit, 
    unlimited_replacements, 
    stripe_price_id, 
    is_active,
    max_businesses,
    max_ad_accounts,
    max_team_members,
    max_monthly_spend_cents,
    features,
    trial_days
)
VALUES
    (
        'bronze', 
        'Bronze', 
        0, 
        0.0600, 
        1, 
        true, 
        'price_bronze_monthly', 
        true,
        2,
        20,
        3,
        1000000, -- $10,000
        '["2 businesses", "20 ad accounts", "3 team members", "Basic support", "Email notifications"]'::jsonb,
        14
    ),
    (
        'silver', 
        'Silver', 
        29900, 
        0.0400, 
        3, 
        true, 
        'price_silver_monthly', 
        true,
        5,
        50,
        10,
        3000000, -- $30,000
        '["5 businesses", "50 ad accounts", "10 team members", "Priority support", "Email & SMS notifications", "Advanced analytics"]'::jsonb,
        14
    ),
    (
        'gold', 
        'Gold', 
        79900, 
        0.0300, 
        5, 
        true, 
        'price_gold_monthly', 
        true,
        10,
        100,
        25,
        10000000, -- $100,000
        '["10 businesses", "100 ad accounts", "25 team members", "Premium support", "All notifications", "Advanced analytics", "Custom integrations", "API access"]'::jsonb,
        14
    ),
    (
        'platinum', 
        'Platinum', 
        249900, 
        0.0200, 
        10, 
        true, 
        'price_platinum_monthly', 
        true,
        25,
        250,
        50,
        25000000, -- $250,000
        '["25 businesses", "250 ad accounts", "50 team members", "Dedicated support", "All notifications", "Advanced analytics", "Custom integrations", "Full API access", "White-label options", "Custom reporting"]'::jsonb,
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

-- Create demo organization with proper plan assignment
DO $$
DECLARE
    demo_user_id uuid;
    demo_org_id uuid;
BEGIN
    -- Get the demo user ID
    SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@adhub.com';
    
    IF demo_user_id IS NOT NULL THEN
        -- Create demo organization if it doesn't exist
        INSERT INTO public.organizations (
            name, 
            owner_id, 
            plan_id,
            current_businesses_count,
            current_ad_accounts_count,
            current_team_members_count,
            current_monthly_spend_cents
        ) 
        VALUES (
            'Demo Organization', 
            demo_user_id, 
            'silver',
            0,
            0,
            1,
            0
        )
        ON CONFLICT (owner_id) DO UPDATE SET
            plan_id = 'silver',
            updated_at = timezone('utc'::text, now())
        RETURNING id INTO demo_org_id;
        
        -- Get the org ID if it already existed
        IF demo_org_id IS NULL THEN
            SELECT id INTO demo_org_id FROM public.organizations WHERE owner_id = demo_user_id;
        END IF;
        
        -- Add the user as owner to organization_members if not exists
        INSERT INTO public.organization_members (organization_id, user_id, role)
        VALUES (demo_org_id, demo_user_id, 'owner')
        ON CONFLICT (organization_id, user_id) DO NOTHING;
        
        -- Create demo wallet for the organization
        INSERT INTO public.wallets (organization_id, balance_cents, currency)
        VALUES (demo_org_id, 125000, 'USD') -- $1,250.00
        ON CONFLICT (organization_id) DO UPDATE SET
            balance_cents = 125000,
            updated_at = timezone('utc'::text, now());
            
        RAISE NOTICE 'Demo organization and wallet created for user %', demo_user_id;
    ELSE
        RAISE NOTICE 'Demo user not found. Please create demo user first.';
    END IF;
END $$;

-- Seed data for an initial organization's plan (example)
-- This is just illustrative. In a real app, organizations would get their plan_id set
-- when they are created or when they subscribe.
-- Ensure you have a user and an organization if you want to test this part.

-- Example: To link a specific organization (if you know its ID) to a plan:
-- UPDATE public.organizations SET plan_id = 'gold' WHERE id = 'your_known_organization_id';

-- Example: If you have a default user and want to create a default organization for them on a plan:
-- WITH new_org AS (
--   INSERT INTO public.organizations (name, owner_id, plan_id)
--   VALUES ('Test Org Default Plan', (SELECT id FROM auth.users LIMIT 1), 'silver')
--   RETURNING id, owner_id, plan_id
-- )
-- INSERT INTO public.organization_members (organization_id, user_id, role)
-- SELECT id, owner_id, 'owner' FROM new_org;

-- Note on Stripe Price IDs:
-- Replace 'your_stripe_price_id_for_...' with the actual Price IDs from your Stripe account 
-- for each corresponding subscription plan. For the Bronze (free) plan, if there's no direct 
-- Stripe subscription, you might leave stripe_price_id as NULL or use a placeholder. 
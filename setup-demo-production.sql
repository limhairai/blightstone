-- Demo Setup for Production
-- This script creates demo data that matches your DemoStateContext

-- First, insert the subscription plans if they don't exist
INSERT INTO public.plans (
    id, name, monthly_subscription_fee_cents, ad_spend_fee_percentage, 
    ad_account_pool_limit, unlimited_replacements, stripe_price_id, is_active,
    max_businesses, max_ad_accounts, max_team_members, max_monthly_spend_cents, features, trial_days
) VALUES 
    ('free', 'Free', 0, 0.0500, 1, false, null, true, 1, 5, 1, 500000, '["1 business", "5 ad accounts", "1 team member", "Basic support", "Email notifications"]'::jsonb, 0),
    ('bronze', 'Bronze', 2900, 0.0400, 3, false, 'price_bronze_monthly', true, 3, 25, 3, 2500000, '["3 businesses", "25 ad accounts", "3 team members", "Priority support", "All notifications", "Basic analytics"]'::jsonb, 14),
    ('silver', 'Silver', 9900, 0.0300, 5, true, 'price_silver_monthly', true, 10, 100, 10, 10000000, '["10 businesses", "100 ad accounts", "10 team members", "Priority support", "All notifications", "Advanced analytics", "API access"]'::jsonb, 14),
    ('gold', 'Gold', 49900, 0.0250, 10, true, 'price_gold_monthly', true, 25, 250, 25, 25000000, '["25 businesses", "250 ad accounts", "25 team members", "Dedicated support", "All notifications", "Advanced analytics", "Full API access", "Custom integrations"]'::jsonb, 30)
ON CONFLICT (id) DO NOTHING;

-- Function to create demo data for any user email
CREATE OR REPLACE FUNCTION setup_demo_for_user(user_email text)
RETURNS text AS $$
DECLARE
    target_user_id uuid;
    demo_org_id uuid;
    business_1_id uuid;
    business_2_id uuid;
    business_3_id uuid;
    result_text text;
BEGIN
    -- Get the user ID
    SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RETURN 'ERROR: User with email ' || user_email || ' not found. Please sign up first.';
    END IF;
    
    -- Create user profile if it doesn't exist
    INSERT INTO public.profiles (id, email, name, role, is_superuser)
    VALUES (target_user_id, user_email, 'Demo User', 'client', false)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, public.profiles.name),
        updated_at = timezone('utc'::text, now());
    
    -- Create demo organization
    INSERT INTO public.organizations (
        name, 
        owner_id, 
        plan_id,
        verification_status,
        current_businesses_count,
        current_ad_accounts_count,
        current_team_members_count,
        current_monthly_spend_cents
    ) 
    VALUES (
        'Demo Organization', 
        target_user_id, 
        'silver',
        'approved',
        3,
        4,
        1,
        0
    )
    ON CONFLICT (owner_id) DO UPDATE SET
        name = 'Demo Organization',
        plan_id = 'silver',
        verification_status = 'approved',
        current_businesses_count = 3,
        current_ad_accounts_count = 4,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO demo_org_id;
    
    -- Get the org ID if it already existed
    IF demo_org_id IS NULL THEN
        SELECT id INTO demo_org_id FROM public.organizations WHERE owner_id = target_user_id;
    END IF;
    
    -- Add the user as owner to organization_members
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (demo_org_id, target_user_id, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
    
    -- Create demo wallet for the organization
    INSERT INTO public.wallets (organization_id, balance_cents, currency)
    VALUES (demo_org_id, 125000, 'USD') -- $1,250.00
    ON CONFLICT (organization_id) DO UPDATE SET
        balance_cents = 125000,
        updated_at = timezone('utc'::text, now());
    
    -- Clear existing demo data first
    DELETE FROM public.ad_accounts WHERE user_id = target_user_id;
    DELETE FROM public.businesses WHERE user_id = target_user_id;
    
    -- Insert demo businesses (matching your DemoStateContext)
    INSERT INTO public.businesses (
        user_id, organization_id, name, business_id, status, verification,
        landing_page, website, business_type, description, country, timezone, created_at
    ) VALUES 
    (
        target_user_id, demo_org_id,
        'TechFlow Solutions', '118010225380663', 'active', 'verified',
        'https://techflow.example.com', 'https://techflow.example.com', 'technology',
        'B2B SaaS platform for workflow automation and business intelligence',
        'US', 'America/New_York', NOW() - INTERVAL '15 days'
    ),
    (
        target_user_id, demo_org_id,
        'Digital Marketing Co', '117291547115266', 'active', 'verified',
        'https://digitalmarketing.example.com', 'https://digitalmarketing.example.com', 'agency',
        'Full-service digital marketing agency specializing in performance marketing',
        'US', 'America/Los_Angeles', NOW() - INTERVAL '8 days'
    ),
    (
        target_user_id, demo_org_id,
        'E-Commerce Store', '847810749229077', 'pending', 'pending',
        'https://store.example.com', 'https://store.example.com', 'ecommerce',
        'Online retail store specializing in consumer electronics and accessories',
        'US', 'America/Chicago', NOW() - INTERVAL '3 days'
    )
    RETURNING id INTO business_1_id, business_2_id, business_3_id;
    
    -- Get the business IDs properly
    SELECT id INTO business_1_id FROM public.businesses WHERE business_id = '118010225380663' AND user_id = target_user_id;
    SELECT id INTO business_2_id FROM public.businesses WHERE business_id = '117291547115266' AND user_id = target_user_id;
    SELECT id INTO business_3_id FROM public.businesses WHERE business_id = '847810749229077' AND user_id = target_user_id;
    
    -- Insert demo ad accounts (matching your DemoStateContext)
    INSERT INTO public.ad_accounts (
        business_id, user_id, name, account_id, status, balance, spent, spend_limit, platform, last_activity, created_at
    ) VALUES 
    (
        business_1_id, target_user_id,
        'TechFlow - Lead Generation', 'act_1180102253806631', 'active', 2847.50, 1152.50, 5000.00, 'Meta', '2 hours ago', NOW() - INTERVAL '15 days'
    ),
    (
        business_2_id, target_user_id,
        'Digital Marketing - Performance', 'act_1172915471152661', 'active', 1923.75, 2076.25, 4000.00, 'Meta', '5 hours ago', NOW() - INTERVAL '8 days'
    ),
    (
        business_2_id, target_user_id,
        'Digital Marketing - Retargeting', 'act_1172915471152662', 'active', 3456.80, 1543.20, 5000.00, 'Meta', '1 hour ago', NOW() - INTERVAL '6 days'
    ),
    (
        business_3_id, target_user_id,
        'E-Commerce - General', 'act_8478107492290771', 'paused', 892.30, 607.70, 1500.00, 'Meta', '1 day ago', NOW() - INTERVAL '3 days'
    );
    
    -- Create some demo transactions
    INSERT INTO public.transactions (
        organization_id, business_id, amount_cents, currency, type, description, created_at
    ) VALUES 
    (demo_org_id, business_1_id, -115250, 'USD', 'ad_spend', 'TechFlow - Lead Generation Campaign', NOW() - INTERVAL '2 hours'),
    (demo_org_id, business_2_id, -207625, 'USD', 'ad_spend', 'Digital Marketing - Performance Campaign', NOW() - INTERVAL '5 hours'),
    (demo_org_id, business_2_id, -154320, 'USD', 'ad_spend', 'Digital Marketing - Retargeting Campaign', NOW() - INTERVAL '1 hour'),
    (demo_org_id, business_3_id, -60770, 'USD', 'ad_spend', 'E-Commerce - General Campaign', NOW() - INTERVAL '1 day'),
    (demo_org_id, NULL, 125000, 'USD', 'deposit', 'Initial wallet funding', NOW() - INTERVAL '20 days');
    
    result_text := 'SUCCESS: Demo data created for ' || user_email || 
                   '. Organization ID: ' || demo_org_id || 
                   '. Created 3 businesses and 4 ad accounts.';
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION setup_demo_for_user(text) TO authenticated;

-- Example usage (uncomment and replace with your email):
-- SELECT setup_demo_for_user('your-email@example.com'); 
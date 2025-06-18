-- Global Demo Data Setup (Option B) - FIXED VERSION
-- This creates demo data that ALL users will see
-- Perfect for staging environment and initial production demos

-- Create a demo user account (this will be the "owner" of demo data)
-- Note: This user won't actually be able to log in, it's just for data ownership
DO $$
DECLARE
    demo_user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid; -- Fixed demo user ID
    demo_org_id uuid;
    demo_wallet_id uuid;
    business_1_id uuid;
    business_2_id uuid;
    business_3_id uuid;
BEGIN
    -- Insert demo user into auth.users if it doesn't exist
    -- This is a system user, not a real login
    INSERT INTO auth.users (
        id, 
        email, 
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data
    ) VALUES (
        demo_user_id,
        'demo-system@adhub.internal',
        'demo-password-hash',
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "demo", "providers": ["demo"]}'::jsonb,
        '{"name": "Demo System User"}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;

    -- Create demo profile
    INSERT INTO public.profiles (id, email, name)
    VALUES (demo_user_id, 'demo-system@adhub.internal', 'Demo System')
    ON CONFLICT (id) DO NOTHING;

    -- Create demo organization
    INSERT INTO public.organizations (
        id,
        name, 
        owner_id, 
        plan_id
    ) 
    VALUES (
        '10000000-0000-0000-0000-000000000001'::uuid, -- Fixed org ID
        'TechFlow Solutions', 
        demo_user_id, 
        'silver'
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO demo_org_id;

    -- If org already exists, get its ID
    IF demo_org_id IS NULL THEN
        demo_org_id := '10000000-0000-0000-0000-000000000001'::uuid;
    END IF;

    -- Add demo user to organization_members
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (demo_org_id, demo_user_id, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- Create demo wallet if wallets table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets') THEN
        INSERT INTO public.wallets (id, organization_id, balance_cents, currency)
        VALUES ('40000000-0000-0000-0000-000000000001'::uuid, demo_org_id, 125000, 'USD') -- $1,250.00
        ON CONFLICT (organization_id) DO UPDATE SET
            balance_cents = 125000,
            updated_at = timezone('utc'::text, now())
        RETURNING id INTO demo_wallet_id;
        
        -- If wallet already exists, get its ID
        IF demo_wallet_id IS NULL THEN
            SELECT id INTO demo_wallet_id FROM public.wallets WHERE organization_id = demo_org_id;
        END IF;
    END IF;

    -- Clear existing demo data 
    -- Delete ad_accounts first (has foreign key to businesses)
    DELETE FROM public.ad_accounts WHERE business_id IN (
        SELECT id FROM public.businesses WHERE organization_id = demo_org_id
    );
    
    -- Delete businesses for this demo organization
    DELETE FROM public.businesses WHERE organization_id = demo_org_id;

    -- Insert demo businesses (only using columns that actually exist)
    INSERT INTO public.businesses (
        id,
        organization_id, 
        name, 
        business_id, 
        status, 
        verification,
        landing_page, 
        website, 
        business_type, 
        country, 
        timezone, 
        created_at
    ) VALUES 
    (
        '20000000-0000-0000-0000-000000000001'::uuid,
        demo_org_id,
        'TechFlow Solutions', 
        '118010225380663', 
        'active', 
        'verified',
        'https://techflow.example.com', 
        'https://techflow.example.com', 
        'technology',
        'US', 
        'America/New_York', 
        NOW() - INTERVAL '15 days'
    ),
    (
        '20000000-0000-0000-0000-000000000002'::uuid,
        demo_org_id,
        'Digital Marketing Co', 
        '117291547115266', 
        'active', 
        'verified',
        'https://digitalmarketing.example.com', 
        'https://digitalmarketing.example.com', 
        'agency',
        'US', 
        'America/Los_Angeles', 
        NOW() - INTERVAL '8 days'
    ),
    (
        '20000000-0000-0000-0000-000000000003'::uuid,
        demo_org_id,
        'E-Commerce Store', 
        '847810749229077', 
        'pending', 
        'pending',
        'https://store.example.com', 
        'https://store.example.com', 
        'ecommerce',
        'US', 
        'America/Chicago', 
        NOW() - INTERVAL '3 days'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Get business IDs
    business_1_id := '20000000-0000-0000-0000-000000000001'::uuid;
    business_2_id := '20000000-0000-0000-0000-000000000002'::uuid;
    business_3_id := '20000000-0000-0000-0000-000000000003'::uuid;

    -- Insert demo ad accounts (conditionally include user_id if column exists)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_accounts' AND column_name = 'user_id') THEN
        -- Include user_id if column exists
        INSERT INTO public.ad_accounts (
            id, business_id, user_id, name, account_id, status, balance, spent, spend_limit, platform, last_activity, created_at
        ) VALUES 
        ('30000000-0000-0000-0000-000000000001'::uuid, business_1_id, demo_user_id, 'TechFlow - Lead Generation', 'act_1180102253806631', 'active', 2847.50, 1152.50, 5000.00, 'Meta', '2 hours ago', NOW() - INTERVAL '15 days'),
        ('30000000-0000-0000-0000-000000000002'::uuid, business_2_id, demo_user_id, 'Digital Marketing - Performance', 'act_1172915471152661', 'active', 1923.75, 2076.25, 4000.00, 'Meta', '5 hours ago', NOW() - INTERVAL '8 days'),
        ('30000000-0000-0000-0000-000000000003'::uuid, business_2_id, demo_user_id, 'Digital Marketing - Retargeting', 'act_1172915471152662', 'active', 3456.80, 1543.20, 5000.00, 'Meta', '1 hour ago', NOW() - INTERVAL '6 days'),
        ('30000000-0000-0000-0000-000000000004'::uuid, business_3_id, demo_user_id, 'E-Commerce - General', 'act_8478107492290771', 'paused', 892.30, 607.70, 1500.00, 'Meta', '1 day ago', NOW() - INTERVAL '3 days')
        ON CONFLICT (id) DO NOTHING;
    ELSE
        -- Exclude user_id if column doesn't exist
        INSERT INTO public.ad_accounts (
            id, business_id, name, account_id, status, balance, spent, spend_limit, platform, last_activity, created_at
        ) VALUES 
        ('30000000-0000-0000-0000-000000000001'::uuid, business_1_id, 'TechFlow - Lead Generation', 'act_1180102253806631', 'active', 2847.50, 1152.50, 5000.00, 'Meta', '2 hours ago', NOW() - INTERVAL '15 days'),
        ('30000000-0000-0000-0000-000000000002'::uuid, business_2_id, 'Digital Marketing - Performance', 'act_1172915471152661', 'active', 1923.75, 2076.25, 4000.00, 'Meta', '5 hours ago', NOW() - INTERVAL '8 days'),
        ('30000000-0000-0000-0000-000000000003'::uuid, business_2_id, 'Digital Marketing - Retargeting', 'act_1172915471152662', 'active', 3456.80, 1543.20, 5000.00, 'Meta', '1 hour ago', NOW() - INTERVAL '6 days'),
        ('30000000-0000-0000-0000-000000000004'::uuid, business_3_id, 'E-Commerce - General', 'act_8478107492290771', 'paused', 892.30, 607.70, 1500.00, 'Meta', '1 day ago', NOW() - INTERVAL '3 days')
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Create demo transactions if transactions table exists and we have a wallet
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') AND demo_wallet_id IS NOT NULL THEN
        INSERT INTO public.transactions (
            wallet_id,
            organization_id, 
            business_id, 
            type,
            amount_cents, 
            description,
            status,
            transaction_date,
            created_at
        ) VALUES 
        (demo_wallet_id, demo_org_id, business_1_id, 'ad_spend', -115250, 'TechFlow - Lead Generation Campaign', 'completed', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
        (demo_wallet_id, demo_org_id, business_2_id, 'ad_spend', -207625, 'Digital Marketing - Performance Campaign', 'completed', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'),
        (demo_wallet_id, demo_org_id, business_2_id, 'ad_spend', -154320, 'Digital Marketing - Retargeting Campaign', 'completed', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
        (demo_wallet_id, demo_org_id, business_3_id, 'ad_spend', -60770, 'E-Commerce - General Campaign', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
        (demo_wallet_id, demo_org_id, NULL, 'deposit', 125000, 'Initial wallet funding', 'completed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days')
        ON CONFLICT DO NOTHING;
    END IF;

    RAISE NOTICE 'Global demo data created successfully! Demo organization ID: %', demo_org_id;
END $$;

-- Function to add any user to the demo organization (so they can see the data)
CREATE OR REPLACE FUNCTION add_user_to_demo_org(user_email text)
RETURNS text AS $$
DECLARE
    target_user_id uuid;
    demo_org_id uuid := '10000000-0000-0000-0000-000000000001'::uuid;
    result_text text;
BEGIN
    -- Get the user ID
    SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RETURN 'ERROR: User with email ' || user_email || ' not found. Please sign up first.';
    END IF;
    
    -- Create user profile if it doesn't exist
    INSERT INTO public.profiles (id, email, name)
    VALUES (target_user_id, user_email, 'Demo User')
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = timezone('utc'::text, now());
    
    -- Add user to the demo organization as a member
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (demo_org_id, target_user_id, 'member')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
    
    result_text := 'SUCCESS: User ' || user_email || ' added to demo organization. They can now see all demo data.';
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_user_to_demo_org(text) TO authenticated; 
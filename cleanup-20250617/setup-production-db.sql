-- Production Database Setup Script
-- This script creates all required tables and seed data for AdHub production

BEGIN;

-- ============================================================================
-- 1. CORE UTILITY FUNCTIONS
-- ============================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email text,
    name text,
    avatar_url text,
    is_superuser BOOLEAN DEFAULT FALSE NOT NULL,
    role TEXT DEFAULT 'client' NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Policies
DROP POLICY IF EXISTS "Profiles read access" ON public.profiles;
CREATE POLICY "Profiles read access"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = id)
    WITH CHECK ((select auth.uid()) = id);

-- ============================================================================
-- 3. PLANS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.plans (
    id text NOT NULL PRIMARY KEY,
    name text NOT NULL,
    monthly_subscription_fee_cents bigint NOT NULL DEFAULT 0,
    ad_spend_fee_percentage numeric(5,4) NOT NULL DEFAULT 0.0000,
    ad_account_pool_limit integer NOT NULL DEFAULT 1,
    unlimited_replacements boolean NOT NULL DEFAULT false,
    stripe_price_id text,
    is_active boolean NOT NULL DEFAULT true,
    max_businesses integer DEFAULT 1 NOT NULL,
    max_ad_accounts integer DEFAULT 10 NOT NULL,
    max_team_members integer DEFAULT 1 NOT NULL,
    max_monthly_spend_cents bigint DEFAULT 1000000 NOT NULL,
    features jsonb DEFAULT '[]'::jsonb NOT NULL,
    trial_days integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 4. ORGANIZATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    owner_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    avatar_url text,
    plan_id text DEFAULT 'free'::text REFERENCES public.plans(id),
    ad_spend_monthly text,
    support_channel_type text,
    support_channel_contact text,
    verification_status TEXT DEFAULT 'pending_review' NOT NULL,
    current_businesses_count integer DEFAULT 0 NOT NULL,
    current_ad_accounts_count integer DEFAULT 0 NOT NULL,
    current_team_members_count integer DEFAULT 1 NOT NULL,
    current_monthly_spend_cents bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_organizations_updated_at ON public.organizations;
CREATE TRIGGER set_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);

-- Policies
DROP POLICY IF EXISTS "Organizations read access" ON public.organizations;
CREATE POLICY "Organizations read access"
    ON public.organizations FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.organizations.id 
        AND om.user_id = (select auth.uid())
    ));

DROP POLICY IF EXISTS "Organization owners can update their own organizations" ON public.organizations;
CREATE POLICY "Organization owners can update their own organizations"
    ON public.organizations FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = owner_id)
    WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Organization owners can delete their own organizations" ON public.organizations;
CREATE POLICY "Organization owners can delete their own organizations" 
    ON public.organizations FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = owner_id);

-- ============================================================================
-- 5. ORGANIZATION_MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_members (
    organization_id uuid NOT NULL REFERENCES public.organizations ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'member'::text,
    joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (organization_id, user_id)
);

-- Enable RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON public.organization_members(organization_id);

-- Policies
DROP POLICY IF EXISTS "Organization members can view other members of the same organization" ON public.organization_members;
CREATE POLICY "Organization members can view other members of the same organization"
    ON public.organization_members FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om_check
        WHERE om_check.organization_id = public.organization_members.organization_id
        AND om_check.user_id = (select auth.uid())
    ));

DROP POLICY IF EXISTS "Organization owners/admins can add members to their organization" ON public.organization_members;
CREATE POLICY "Organization owners/admins can add members to their organization"
    ON public.organization_members FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.organization_members om_check
        WHERE om_check.organization_id = public.organization_members.organization_id
        AND om_check.user_id = (select auth.uid())
        AND (om_check.role = 'owner' OR om_check.role = 'admin')
    ));

-- ============================================================================
-- 6. BUSINESSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.businesses (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES public.organizations ON DELETE CASCADE,
    name text NOT NULL,
    business_id text UNIQUE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended', 'inactive')),
    verification text NOT NULL DEFAULT 'pending' CHECK (verification IN ('verified', 'not_verified', 'pending')),
    landing_page text,
    website text,
    business_type text,
    description text,
    country text DEFAULT 'US',
    timezone text DEFAULT 'America/New_York',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_businesses_updated_at ON public.businesses;
CREATE TRIGGER set_businesses_updated_at
BEFORE UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_businesses_organization_id ON public.businesses(organization_id);
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_business_id_unique ON public.businesses(business_id) WHERE business_id IS NOT NULL;

-- Policies
DROP POLICY IF EXISTS "Users can read businesses of organizations they are a member of" ON public.businesses;
CREATE POLICY "Users can read businesses of organizations they are a member of"
ON public.businesses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = public.businesses.organization_id
    AND om.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- 7. AD_ACCOUNTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'paused', 'error')),
  balance DECIMAL(10,2) DEFAULT 0,
  spent DECIMAL(10,2) DEFAULT 0,
  spend_limit DECIMAL(10,2) DEFAULT 5000,
  platform TEXT NOT NULL DEFAULT 'Meta' CHECK (platform = 'Meta'),
  last_activity TEXT DEFAULT 'Just created',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ad_accounts_business_id ON public.ad_accounts(business_id);
CREATE INDEX IF NOT EXISTS idx_ad_accounts_user_id ON public.ad_accounts(user_id);

-- ============================================================================
-- 8. WALLETS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wallets (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations ON DELETE CASCADE,
    balance_cents bigint NOT NULL DEFAULT 0,
    currency text NOT NULL DEFAULT 'USD'::text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations ON DELETE CASCADE,
    business_id uuid REFERENCES public.businesses ON DELETE SET NULL,
    amount_cents bigint NOT NULL,
    currency text NOT NULL DEFAULT 'USD'::text,
    type text NOT NULL,
    description text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. SEED DATA
-- ============================================================================

-- Insert plans
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

COMMIT;

-- ============================================================================
-- 11. DEMO USER AND ORGANIZATION SETUP FUNCTION
-- ============================================================================

-- Function to create demo data for any user
CREATE OR REPLACE FUNCTION create_demo_user_data(user_email text)
RETURNS void AS $$
DECLARE
    target_user_id uuid;
    demo_org_id uuid;
    business_1_id uuid;
    business_2_id uuid;
    business_3_id uuid;
BEGIN
    -- Get the user ID
    SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    -- Create user profile if it doesn't exist
    INSERT INTO public.profiles (id, email, name, role, is_superuser)
    VALUES (target_user_id, user_email, 'Demo User', 'client', false)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = timezone('utc'::text, now());
    
    -- Create demo organization if it doesn't exist
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
        0,
        0,
        1,
        0
    )
    ON CONFLICT (owner_id) DO UPDATE SET
        plan_id = 'silver',
        verification_status = 'approved',
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO demo_org_id;
    
    -- Get the org ID if it already existed
    IF demo_org_id IS NULL THEN
        SELECT id INTO demo_org_id FROM public.organizations WHERE owner_id = target_user_id;
    END IF;
    
    -- Add the user as owner to organization_members if not exists
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
    DELETE FROM public.businesses WHERE user_id = target_user_id AND business_id IS NOT NULL;
    
    -- Insert demo businesses
    INSERT INTO public.businesses (
        user_id, organization_id, name, business_id, status, verification,
        landing_page, website, business_type, description, country, timezone, created_at
    ) VALUES 
    (
        target_user_id, demo_org_id,
        'My E-Commerce Store', '118010225380663', 'active', 'verified',
        'https://store.example.com', 'https://store.example.com', 'ecommerce',
        'Online retail store specializing in consumer electronics and accessories',
        'US', 'America/New_York', NOW() - INTERVAL '15 days'
    ),
    (
        target_user_id, demo_org_id,
        'Blog Network', '117291547115266', 'pending', 'pending',
        'https://blog.example.com', 'https://blog.example.com', 'other',
        'Content marketing and blog network',
        'US', 'America/New_York', NOW() - INTERVAL '3 days'
    ),
    (
        target_user_id, demo_org_id,
        'Affiliate Marketing Hub', '847810749229077', 'active', 'verified',
        'https://affiliate.example.com', 'https://affiliate.example.com', 'agency',
        'Performance marketing and affiliate management',
        'US', 'America/Los_Angeles', NOW() - INTERVAL '7 days'
    )
    RETURNING id INTO business_1_id, business_2_id, business_3_id;
    
    -- Get the business IDs
    SELECT id INTO business_1_id FROM public.businesses WHERE business_id = '118010225380663' AND user_id = target_user_id;
    SELECT id INTO business_3_id FROM public.businesses WHERE business_id = '847810749229077' AND user_id = target_user_id;
    
    -- Insert demo ad accounts
    INSERT INTO public.ad_accounts (
        business_id, user_id, name, account_id, status, balance, spent, spend_limit, platform, last_activity, created_at
    ) VALUES 
    (
        business_1_id, target_user_id,
        'E-Commerce - General', 'act_1180102253806631', 'active', 2847.50, 1152.50, 5000.00, 'Meta', '2 hours ago', NOW() - INTERVAL '15 days'
    ),
    (
        business_1_id, target_user_id,
        'E-Commerce - Retargeting', 'act_1180102253806632', 'active', 1923.75, 2076.25, 4000.00, 'Meta', '5 hours ago', NOW() - INTERVAL '12 days'
    ),
    (
        business_3_id, target_user_id,
        'Affiliate - Performance', 'act_8478107492290771', 'active', 3456.80, 1543.20, 5000.00, 'Meta', '1 hour ago', NOW() - INTERVAL '7 days'
    ),
    (
        business_3_id, target_user_id,
        'Affiliate - Lookalike', 'act_8478107492290772', 'paused', 892.30, 607.70, 1500.00, 'Meta', '1 day ago', NOW() - INTERVAL '5 days'
    );
    
    RAISE NOTICE 'Demo data created for user %', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_demo_user_data(text) TO authenticated; 
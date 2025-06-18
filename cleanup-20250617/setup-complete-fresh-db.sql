-- COMPLETE DATABASE SETUP - Single consolidated migration
-- This replaces all individual migration files for faster setup

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. UTILITY FUNCTIONS
-- ============================================================================

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
    id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    name text,
    avatar_url text,
    email text UNIQUE,
    role text DEFAULT 'client',
    is_superuser boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- ============================================================================
-- 3. PLANS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.plans (
    id text NOT NULL PRIMARY KEY,
    name text NOT NULL,
    monthly_subscription_fee_cents bigint NOT NULL DEFAULT 0,
    ad_spend_fee_percentage numeric(5,4) NOT NULL DEFAULT 0.05,
    ad_account_pool_limit integer,
    unlimited_replacements boolean NOT NULL DEFAULT false,
    stripe_price_id text,
    is_active boolean NOT NULL DEFAULT true,
    max_businesses integer NOT NULL DEFAULT 1,
    max_ad_accounts integer NOT NULL DEFAULT 5,
    max_team_members integer NOT NULL DEFAULT 1,
    max_monthly_spend_cents bigint NOT NULL DEFAULT 500000,
    features jsonb,
    trial_days integer NOT NULL DEFAULT 0,
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
    verification_status text DEFAULT 'pending',
    current_businesses_count integer DEFAULT 0,
    current_ad_accounts_count integer DEFAULT 0,
    current_team_members_count integer DEFAULT 1,
    current_monthly_spend_cents bigint DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);

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

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON public.organization_members(organization_id);

-- ============================================================================
-- 6. BUSINESSES TABLE (formerly projects)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.businesses (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations ON DELETE CASCADE,
    name text NOT NULL,
    website_url text,
    business_id text UNIQUE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended', 'inactive')),
    verification text NOT NULL DEFAULT 'pending' CHECK (verification IN ('verified', 'not_verified', 'pending')),
    landing_page text,
    website text,
    business_type text,
    country text DEFAULT 'US',
    timezone text DEFAULT 'America/New_York',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_businesses_updated_at
BEFORE UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_businesses_organization_id ON public.businesses(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_business_id_unique ON public.businesses(business_id) WHERE business_id IS NOT NULL;

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

ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ad_accounts_business_id ON public.ad_accounts(business_id);
CREATE INDEX IF NOT EXISTS idx_ad_accounts_user_id ON public.ad_accounts(user_id);

-- ============================================================================
-- 8. WALLETS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wallets (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations ON DELETE CASCADE,
    balance_cents bigint NOT NULL DEFAULT 0,
    currency char(3) NOT NULL DEFAULT 'USD',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_wallets_organization_id ON public.wallets(organization_id);

-- ============================================================================
-- 9. TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    wallet_id uuid NOT NULL REFERENCES public.wallets ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES public.organizations ON DELETE CASCADE,
    business_id uuid REFERENCES public.businesses ON DELETE SET NULL,
    type text NOT NULL,
    amount_cents bigint NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'pending'::text,
    metadata jsonb,
    transaction_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_organization_id ON public.transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_business_id ON public.transactions(business_id);

-- ============================================================================
-- 10. SEED PLANS DATA
-- ============================================================================

INSERT INTO public.plans (
    id, name, monthly_subscription_fee_cents, ad_spend_fee_percentage, 
    ad_account_pool_limit, unlimited_replacements, stripe_price_id, is_active,
    max_businesses, max_ad_accounts, max_team_members, max_monthly_spend_cents, features, trial_days
) VALUES 
    ('free', 'Free', 0, 0.0500, 1, false, null, true, 1, 5, 1, 500000, '["1 business", "5 ad accounts", "1 team member", "Basic support"]'::jsonb, 0),
    ('bronze', 'Bronze', 2900, 0.0400, 3, false, 'price_bronze_monthly', true, 3, 25, 3, 2500000, '["3 businesses", "25 ad accounts", "3 team members", "Priority support"]'::jsonb, 14),
    ('silver', 'Silver', 9900, 0.0300, 5, true, 'price_silver_monthly', true, 10, 100, 10, 10000000, '["10 businesses", "100 ad accounts", "10 team members", "Priority support", "Advanced analytics"]'::jsonb, 14),
    ('gold', 'Gold', 49900, 0.0250, 10, true, 'price_gold_monthly', true, 25, 250, 25, 25000000, '["25 businesses", "250 ad accounts", "25 team members", "Dedicated support", "Full API access"]'::jsonb, 30)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    monthly_subscription_fee_cents = EXCLUDED.monthly_subscription_fee_cents,
    updated_at = timezone('utc'::text, now());

-- ============================================================================
-- 11. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Profiles policies
CREATE POLICY "Users can read their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Organizations policies
CREATE POLICY "Users can read organizations they are a member of" ON public.organizations FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = public.organizations.id AND om.user_id = auth.uid())
);
CREATE POLICY "Organization owners can update their organizations" ON public.organizations FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Organization owners can delete their organizations" ON public.organizations FOR DELETE USING (auth.uid() = owner_id);

-- Organization members policies
CREATE POLICY "Members can view other members of same organization" ON public.organization_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = public.organization_members.organization_id AND om.user_id = auth.uid())
);

-- Businesses policies
CREATE POLICY "Users can read businesses of organizations they are a member of" ON public.businesses FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = public.businesses.organization_id AND om.user_id = auth.uid())
);

-- Ad accounts policies
CREATE POLICY "Users can view ad accounts of their organizations" ON public.ad_accounts FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.businesses b 
        JOIN public.organization_members om ON b.organization_id = om.organization_id 
        WHERE b.id = public.ad_accounts.business_id AND om.user_id = auth.uid()
    )
);

-- Wallets policies
CREATE POLICY "Org members can view their organization's wallet" ON public.wallets FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = public.wallets.organization_id AND om.user_id = auth.uid())
);

-- Transactions policies
CREATE POLICY "Org members can view transactions for their organization" ON public.transactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = public.transactions.organization_id AND om.user_id = auth.uid())
); 
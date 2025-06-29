-- ============================================================================
-- ADHUB COMPREHENSIVE DATABASE SCHEMA
-- This migration creates all necessary tables, functions, and triggers
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Plans table (subscription plans)
CREATE TABLE IF NOT EXISTS public.plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    monthly_subscription_fee_cents INTEGER DEFAULT 0,
    max_team_members INTEGER DEFAULT 1,
    max_businesses INTEGER DEFAULT 1,
    max_ad_accounts INTEGER DEFAULT 1,
    max_monthly_spend_cents INTEGER DEFAULT 0,
    ad_account_pool_limit INTEGER DEFAULT 0,
    ad_spend_fee_percentage DECIMAL(5,2) DEFAULT 0.00,
    trial_days INTEGER DEFAULT 0,
    unlimited_replacements BOOLEAN DEFAULT FALSE,
    features JSONB DEFAULT '{}',
    stripe_price_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations table (main entity for multi-tenancy)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT REFERENCES public.plans(id),
    verification_status TEXT DEFAULT 'unverified',
    avatar_url TEXT,
    balance DECIMAL(10,2) DEFAULT 0.00,
    monthly_spent DECIMAL(10,2) DEFAULT 0.00,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    current_team_members_count INTEGER DEFAULT 1,
    current_businesses_count INTEGER DEFAULT 0,
    current_ad_accounts_count INTEGER DEFAULT 0,
    current_monthly_spend_cents INTEGER DEFAULT 0,
    ad_spend_monthly TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_subscription_status TEXT,
    last_payment_at TIMESTAMPTZ,
    support_channel_type TEXT,
    support_channel_contact TEXT,
    telegram_alerts_enabled BOOLEAN DEFAULT FALSE,
    telegram_alert_thresholds JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'client',
    is_superuser BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    telegram_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members (team management)
CREATE TABLE IF NOT EXISTS public.organization_members (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, organization_id)
);

-- Wallets table (financial management)
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    balance_cents INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Businesses table
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    business_id TEXT,
    business_type TEXT,
    status TEXT DEFAULT 'active',
    verification TEXT DEFAULT 'pending',
    website TEXT,
    website_url TEXT,
    landing_page TEXT,
    country TEXT,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ad accounts table
CREATE TABLE IF NOT EXISTS public.ad_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    account_id TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    balance DECIMAL(10,2) DEFAULT 0.00,
    spend_limit DECIMAL(10,2),
    spent DECIMAL(10,2) DEFAULT 0.00,
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id),
    type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'spend', 'refund'
    amount_cents INTEGER NOT NULL,
    status TEXT DEFAULT 'completed',
    description TEXT,
    metadata JSONB,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ad account applications table
CREATE TABLE IF NOT EXISTS public.ad_account_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    spend_limit DECIMAL(10,2),
    landing_page_url TEXT,
    facebook_page_url TEXT,
    campaign_description TEXT,
    notes TEXT,
    admin_notes TEXT,
    assigned_account_id TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    rejected_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding progress table
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    has_verified_email BOOLEAN DEFAULT FALSE,
    has_created_wallet BOOLEAN DEFAULT FALSE,
    has_submitted_business BOOLEAN DEFAULT FALSE,
    has_created_ad_account BOOLEAN DEFAULT FALSE,
    has_dismissed_onboarding BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ADDITIONAL TABLES (for completeness)
-- ============================================================================

-- Team invitations
CREATE TABLE IF NOT EXISTS public.team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',
    invited_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Application notifications
CREATE TABLE IF NOT EXISTS public.application_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES public.ad_account_applications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE OR REPLACE TRIGGER set_timestamp_organizations
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER set_timestamp_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER set_timestamp_businesses
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER set_timestamp_ad_accounts
    BEFORE UPDATE ON public.ad_accounts
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER set_timestamp_wallets
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER set_timestamp_transactions
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER set_timestamp_onboarding_progress
    BEFORE UPDATE ON public.onboarding_progress
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- ONBOARDING FUNCTIONS
-- ============================================================================

-- Get onboarding progress
CREATE OR REPLACE FUNCTION public.get_onboarding_progress(p_user_id UUID)
RETURNS TABLE (
    has_verified_email BOOLEAN,
    has_created_wallet BOOLEAN,
    has_submitted_business BOOLEAN,
    has_created_ad_account BOOLEAN,
    has_dismissed_onboarding BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ensure a progress record exists for the user
    INSERT INTO public.onboarding_progress (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Return the user's progress
    RETURN QUERY
    SELECT
        op.has_verified_email,
        op.has_created_wallet,
        op.has_submitted_business,
        op.has_created_ad_account,
        op.has_dismissed_onboarding
    FROM
        public.onboarding_progress op
    WHERE
        op.user_id = p_user_id;
END;
$$;

-- Update onboarding step
CREATE OR REPLACE FUNCTION public.update_user_onboarding_state(
    p_user_id UUID,
    p_field TEXT,
    p_value BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ensure a progress record exists
    INSERT INTO public.onboarding_progress (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Update the specific field
    CASE p_field
        WHEN 'has_verified_email' THEN
            UPDATE public.onboarding_progress SET has_verified_email = p_value WHERE user_id = p_user_id;
        WHEN 'has_created_wallet' THEN
            UPDATE public.onboarding_progress SET has_created_wallet = p_value WHERE user_id = p_user_id;
        WHEN 'has_submitted_business' THEN
            UPDATE public.onboarding_progress SET has_submitted_business = p_value WHERE user_id = p_user_id;
        WHEN 'has_created_ad_account' THEN
            UPDATE public.onboarding_progress SET has_created_ad_account = p_value WHERE user_id = p_user_id;
        WHEN 'has_dismissed_onboarding' THEN
            UPDATE public.onboarding_progress SET has_dismissed_onboarding = p_value WHERE user_id = p_user_id;
    END CASE;
END;
$$;

-- Handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create a profile for the user
    INSERT INTO public.profiles (id, name, email, is_superuser)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 
        NEW.email, 
        FALSE
    );

    -- Create a default organization for the user
    INSERT INTO public.organizations (owner_id, name)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User') || '''s Organization'
    );

    -- Add user as organization member
    INSERT INTO public.organization_members (user_id, organization_id, role)
    SELECT NEW.id, o.id, 'owner'
    FROM public.organizations o
    WHERE o.owner_id = NEW.id;

    -- Create a wallet for the organization
    INSERT INTO public.wallets (organization_id)
    SELECT o.id
    FROM public.organizations o
    WHERE o.owner_id = NEW.id;

    -- Create onboarding progress record
    INSERT INTO public.onboarding_progress (user_id, has_verified_email)
    VALUES (NEW.id, NEW.email_confirmed_at IS NOT NULL);

    RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default plans
INSERT INTO public.plans (id, name, monthly_subscription_fee_cents, max_team_members, max_businesses, max_ad_accounts, max_monthly_spend_cents) VALUES
    ('free', 'Free Plan', 0, 1, 1, 1, 100000),
    ('starter', 'Starter Plan', 2900, 3, 5, 10, 1000000),
    ('professional', 'Professional Plan', 9900, 10, 20, 50, 5000000),
    ('enterprise', 'Enterprise Plan', 29900, 50, 100, 200, 20000000)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant specific permissions to anon users (for public functions)
GRANT EXECUTE ON FUNCTION public.get_onboarding_progress(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_onboarding_progress(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_onboarding_progress(UUID) TO service_role;

-- ============================================================================
-- INDEXES (for performance)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_organization_id ON public.businesses(organization_id);
CREATE INDEX IF NOT EXISTS idx_ad_accounts_business_id ON public.ad_accounts(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_organization_id ON public.transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallets_organization_id ON public.wallets(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON public.organization_members(organization_id); 
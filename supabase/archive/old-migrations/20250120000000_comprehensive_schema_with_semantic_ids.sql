-- ============================================================================
-- COMPREHENSIVE ADHUB SCHEMA WITH SEMANTIC IDS
-- This migration creates the complete, clean database schema for AdHub
-- Includes: Core tables, Semantic IDs, Subscription system, RLS policies
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES WITH SEMANTIC IDS FROM THE START
-- ============================================================================

-- Organizations table (main entity for multi-tenancy)
CREATE TABLE public.organizations (
    organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL,
    plan_id TEXT DEFAULT 'free',
    avatar_url TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_subscription_status TEXT,
    subscription_status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table (with semantic ID from start)
CREATE TABLE public.profiles (
    profile_id UUID PRIMARY KEY,
    organization_id UUID,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'client',
    is_superuser BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members (team management)
CREATE TABLE public.organization_members (
    user_id UUID,
    organization_id UUID,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, organization_id)
);

-- Wallets table (financial management)
CREATE TABLE public.wallets (
    wallet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID UNIQUE NOT NULL,
    balance_cents INTEGER DEFAULT 0,
    reserved_balance_cents INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE public.transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    wallet_id UUID NOT NULL,
    type TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    status TEXT DEFAULT 'completed',
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications table - client requests for assets
CREATE TABLE public.application (
    application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    name TEXT,
    request_type TEXT NOT NULL CHECK (request_type IN ('new_business_manager', 'additional_accounts')),
    target_bm_dolphin_id TEXT NULL,
    website_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'rejected', 'fulfilled')),
    
    -- Audit trail
    approved_by UUID NULL,
    approved_at TIMESTAMPTZ NULL,
    rejected_by UUID NULL,
    rejected_at TIMESTAMPTZ NULL,
    fulfilled_by UUID NULL,
    fulfilled_at TIMESTAMPTZ NULL,
    
    -- Notes
    client_notes TEXT NULL,
    admin_notes TEXT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assets table - all Facebook assets (BMs, ad accounts, profiles)
CREATE TABLE public.asset (
    asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('business_manager', 'ad_account', 'profile')),
    dolphin_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    metadata JSONB DEFAULT '{}',
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(type, dolphin_id)
);

-- Asset bindings - which organization owns which assets
CREATE TABLE public.asset_binding (
    binding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    bound_by UUID NOT NULL,
    bound_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Application fulfillment tracking
CREATE TABLE public.application_fulfillment (
    fulfillment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    asset_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(application_id, asset_id)
);

-- Onboarding states table
CREATE TABLE public.onboarding_states (
    user_id UUID PRIMARY KEY,
    has_created_organization BOOLEAN DEFAULT FALSE,
    has_verified_email BOOLEAN DEFAULT FALSE,
    has_completed_profile BOOLEAN DEFAULT FALSE,
    has_submitted_application BOOLEAN DEFAULT FALSE,
    has_received_assets BOOLEAN DEFAULT FALSE,
    has_made_first_topup BOOLEAN DEFAULT FALSE,
    current_step TEXT DEFAULT 'create_organization',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SUBSCRIPTION SYSTEM TABLES
-- ============================================================================

-- Plans table (subscription plans)
CREATE TABLE public.plans (
    plan_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    monthly_subscription_fee_cents INTEGER NOT NULL,
    ad_spend_fee_percentage DECIMAL(5,2) NOT NULL,
    max_team_members INTEGER NOT NULL, -- -1 for unlimited
    max_businesses INTEGER NOT NULL,   -- -1 for unlimited  
    max_ad_accounts INTEGER NOT NULL,  -- -1 for unlimited
    features JSONB DEFAULT '[]',
    stripe_price_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert pricing plans
INSERT INTO public.plans (plan_id, name, description, monthly_subscription_fee_cents, ad_spend_fee_percentage, max_team_members, max_businesses, max_ad_accounts, features, stripe_price_id) VALUES
('free', 'Free', 'Explore AdHub dashboard and features', 0, 0, 1, 0, 0, '["Dashboard Access", "Feature Preview"]'::jsonb, NULL),
('starter', 'Starter', 'Perfect for testing and small projects', 2900, 6.00, 2, 1, 5, '["Basic Support", "Standard Features"]'::jsonb, 'price_1RgEqyA3aCFhTOKMThZzQCkl'),
('growth', 'Growth', 'For growing businesses', 14900, 3.00, 5, 3, 21, '["Priority Support", "Advanced Analytics"]'::jsonb, 'price_1RgEqzA3aCFhTOKMnDvGYIzC'),
('scale', 'Scale', 'For scaling teams', 49900, 1.50, 15, 10, 70, '["Dedicated Support", "Custom Integrations"]'::jsonb, 'price_1RgEr0A3aCFhTOKMt4Ayx24U'),
('enterprise', 'Enterprise', 'For large organizations', 149900, 1.00, -1, -1, -1, '["Account Manager", "API Access"]'::jsonb, 'price_1RgEr0A3aCFhTOKMSHTidcpm');

-- Subscriptions tracking table
CREATE TABLE public.subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    plan_id TEXT NOT NULL,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topup requests table
CREATE TABLE public.topup_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    requested_by UUID NOT NULL,
    ad_account_id TEXT NOT NULL,
    ad_account_name TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    request_type TEXT DEFAULT 'topup' CHECK (request_type IN ('topup', 'balance_reset')),
    transfer_destination_type TEXT DEFAULT 'ad_account' CHECK (transfer_destination_type IN ('wallet', 'ad_account')),
    transfer_destination_id TEXT,
    metadata JSONB DEFAULT '{}',
    processed_by UUID,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Fee tracking fields
    fee_amount_cents INTEGER DEFAULT 0,
    total_deducted_cents INTEGER DEFAULT 0,
    plan_fee_percentage DECIMAL(5,2) DEFAULT 0
);

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key constraints
ALTER TABLE public.organizations ADD CONSTRAINT organizations_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(plan_id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE SET NULL;
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE CASCADE;
ALTER TABLE public.wallets ADD CONSTRAINT wallets_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(wallet_id) ON DELETE CASCADE;
ALTER TABLE public.application ADD CONSTRAINT application_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE CASCADE;
ALTER TABLE public.asset_binding ADD CONSTRAINT asset_binding_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON DELETE CASCADE;
ALTER TABLE public.asset_binding ADD CONSTRAINT asset_binding_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE CASCADE;
ALTER TABLE public.application_fulfillment ADD CONSTRAINT application_fulfillment_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.application(application_id) ON DELETE CASCADE;
ALTER TABLE public.application_fulfillment ADD CONSTRAINT application_fulfillment_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON DELETE CASCADE;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE CASCADE;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(plan_id);
ALTER TABLE public.topup_requests ADD CONSTRAINT topup_requests_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE CASCADE;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_plan_id ON public.organizations(plan_id);
CREATE INDEX IF NOT EXISTS idx_asset_binding_asset_id ON public.asset_binding(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_binding_organization_id ON public.asset_binding(organization_id);
CREATE INDEX IF NOT EXISTS idx_application_fulfillment_application_id ON public.application_fulfillment(application_id);
CREATE INDEX IF NOT EXISTS idx_application_fulfillment_asset_id ON public.application_fulfillment(asset_id);
CREATE INDEX IF NOT EXISTS idx_topup_requests_organization_id ON public.topup_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_topup_requests_status ON public.topup_requests(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON public.subscriptions(organization_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handle new user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
BEGIN
  -- Extract user name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Create organization for the new user
  INSERT INTO public.organizations (name, owner_id, plan_id)
  VALUES (user_name || '''s Organization', NEW.id, 'free')
  RETURNING organization_id INTO new_org_id;

  -- Create wallet for the organization
  INSERT INTO public.wallets (organization_id, balance_cents)
  VALUES (new_org_id, 0);

  -- Add user as owner in organization_members
  INSERT INTO public.organization_members (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');

  -- Create profile with organization_id set using semantic ID
  INSERT INTO public.profiles (profile_id, name, email, organization_id, role)
  VALUES (
    NEW.id,
    user_name,
    NEW.email,
    new_org_id,
    'client'
  );

  -- Create onboarding state
  INSERT INTO public.onboarding_states (user_id, has_verified_email)
  VALUES (NEW.id, NEW.email_confirmed_at IS NOT NULL);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reserved balance trigger functions
CREATE OR REPLACE FUNCTION public.reserve_balance_on_topup_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Reserve the requested amount when a topup request is created
    IF NEW.status = 'pending' THEN
        UPDATE public.wallets 
        SET reserved_balance_cents = reserved_balance_cents + NEW.amount_cents,
            updated_at = NOW()
        WHERE organization_id = NEW.organization_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.release_balance_on_topup_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Release reserved balance when request is completed, failed, or cancelled
    IF OLD.status = 'pending' AND NEW.status IN ('completed', 'failed', 'cancelled') THEN
        UPDATE public.wallets 
        SET reserved_balance_cents = reserved_balance_cents - OLD.amount_cents,
            updated_at = NOW()
        WHERE organization_id = OLD.organization_id;
    END IF;
    
    -- If request is being processed, keep the reservation
    -- If request goes from processing back to pending, restore reservation
    IF OLD.status = 'processing' AND NEW.status = 'pending' THEN
        UPDATE public.wallets 
        SET reserved_balance_cents = reserved_balance_cents + OLD.amount_cents,
            updated_at = NOW()
        WHERE organization_id = OLD.organization_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated at triggers
CREATE TRIGGER set_updated_at_organizations BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_wallets BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_transactions BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_application BEFORE UPDATE ON public.application FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_asset BEFORE UPDATE ON public.asset FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_asset_binding BEFORE UPDATE ON public.asset_binding FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_topup_requests BEFORE UPDATE ON public.topup_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_subscriptions BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- New user trigger
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Reserved balance triggers
CREATE TRIGGER reserve_balance_on_insert AFTER INSERT ON public.topup_requests FOR EACH ROW EXECUTE FUNCTION public.reserve_balance_on_topup_request();
CREATE TRIGGER release_balance_on_update AFTER UPDATE ON public.topup_requests FOR EACH ROW EXECUTE FUNCTION public.release_balance_on_topup_status_change();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_binding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_fulfillment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_states ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
    FOR SELECT USING (
        owner_id = auth.uid() 
        OR organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update organizations they own" ON public.organizations
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can create organizations" ON public.organizations
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins can view all organizations" ON public.organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

CREATE POLICY "Admins can update all organizations" ON public.organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- Plans policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view plans" ON public.plans
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage plans" ON public.plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- Topup requests policies
CREATE POLICY "Users can view own organization topup requests" ON public.topup_requests
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create topup requests" ON public.topup_requests
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
        AND requested_by = auth.uid()
    );

CREATE POLICY "Admins can manage all topup requests" ON public.topup_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- Wallets policies
CREATE POLICY "Users can view their organization's wallet" ON public.wallets
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Applications policies
CREATE POLICY "Users can view their organization's applications" ON public.application
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create applications for their organization" ON public.application
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all applications" ON public.application
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- Assets policies (admin only)
CREATE POLICY "Admins can manage all assets" ON public.asset
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- Asset bindings policies
CREATE POLICY "Users can view their organization's asset bindings" ON public.asset_binding
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all asset bindings" ON public.asset_binding
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- Service role can manage all data
CREATE POLICY "Service role can manage all data" ON public.organizations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all profiles" ON public.profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all wallets" ON public.wallets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all transactions" ON public.transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all applications" ON public.application FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all assets" ON public.asset FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all asset bindings" ON public.asset_binding FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all topup requests" ON public.topup_requests FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS 'AdHub comprehensive schema with semantic IDs and subscription system'; 
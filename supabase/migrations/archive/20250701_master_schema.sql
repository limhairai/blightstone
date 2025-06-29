-- ============================================================================
-- ADHUB MASTER DATABASE SCHEMA
-- Generated: 2025-07-01
-- This file represents the single source of truth for the database schema,
-- incorporating all refactoring and fixes.
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Organizations table (main entity for multi-tenancy)
CREATE TABLE IF NOT EXISTS public.organizations (
    organization_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT, -- No FK here as plans table might not exist in all environments
    avatar_url TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_subscription_status TEXT,
    team_id UUID, -- No FK here as teams table might not exist
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(organization_id) ON DELETE SET NULL,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'client',
    is_superuser BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Manager Applications table
CREATE TABLE IF NOT EXISTS public.bm_applications (
    application_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    website_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'fulfilled', 'rejected')),
    request_type VARCHAR(50) DEFAULT 'new-bm',
    target_bm_id UUID REFERENCES public.dolphin_assets(asset_id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID REFERENCES auth.users(id),
    rejected_at TIMESTAMP WITH TIME ZONE,
    fulfilled_by UUID REFERENCES auth.users(id),
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Managers table (the evolution of the old 'businesses' table)
CREATE TABLE IF NOT EXISTS public.business_managers (
    bm_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.bm_applications(application_id) ON DELETE SET NULL,
    dolphin_business_manager_id TEXT, -- This is the ID from the Dolphin API
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallets table (financial management)
CREATE TABLE IF NOT EXISTS public.wallets (
    wallet_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID UNIQUE NOT NULL REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    balance_cents INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(wallet_id) ON DELETE CASCADE,
    bm_id UUID REFERENCES public.business_managers(bm_id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    status TEXT DEFAULT 'completed',
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members (team management)
CREATE TABLE IF NOT EXISTS public.organization_members (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, organization_id)
);

-- Ad accounts table
CREATE TABLE IF NOT EXISTS public.ad_accounts (
    ad_account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bm_id UUID REFERENCES public.business_managers(bm_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dolphin_account_id TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funding Requests table
CREATE TABLE IF NOT EXISTS public.funding_requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ad_account_id UUID REFERENCES public.ad_accounts(ad_account_id) ON DELETE SET NULL,
    requested_amount_cents INTEGER NOT NULL,
    approved_amount_cents INTEGER,
    notes TEXT,
    admin_notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to get admin BM applications (uses new naming)
CREATE OR REPLACE FUNCTION get_admin_bm_applications()
RETURNS TABLE (
    application_id UUID,
    organization_id UUID,
    website_url TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    organization_name TEXT
) AS $$
BEGIN
    -- Check if the calling user is a superuser. This is the correct check for platform-level admin access.
    IF (SELECT is_superuser FROM public.profiles WHERE id = auth.uid()) IS NOT TRUE THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        b.application_id,
        b.organization_id,
        b.website_url,
        b.status,
        b.created_at,
        b.updated_at,
        o.name AS organization_name
    FROM
        public.bm_applications b
    LEFT JOIN
        public.organizations o ON b.organization_id = o.organization_id
    ORDER BY
        b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_email TEXT;
  new_org_name TEXT;
BEGIN
  -- It's better to get the email from the NEW record directly.
  user_email := NEW.email;
  
  -- Create a more user-friendly default organization name.
  new_org_name := split_part(user_email, '@', 1) || '''s Team';

  -- Create a new organization for the user.
  INSERT INTO public.organizations (name, owner_id)
  VALUES (new_org_name, NEW.id)
  RETURNING organization_id INTO new_org_id;

  -- Create the user's profile, linking it to the new organization.
  INSERT INTO public.profiles(id, organization_id, email, role)
  VALUES (NEW.id, new_org_id, user_email, 'client');
  
  -- Add the user to the organization as a member with the 'owner' role.
  -- This was the critical missing step that caused auth failures.
  INSERT INTO public.organization_members(user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');
  
  -- Inject the organization_id into the user's app_metadata for easy access on the client.
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('organization_id', new_org_id)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_bm_applications_organization_id ON public.bm_applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_bm_applications_status ON public.bm_applications(status);
CREATE INDEX IF NOT EXISTS idx_business_managers_organization_id ON public.business_managers(organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_organization_id ON public.transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_applications_request_type ON public.bm_applications(request_type);
CREATE INDEX IF NOT EXISTS idx_applications_target_bm_id ON public.bm_applications(target_bm_id);

-- ============================================================================
-- DOLPHIN INTEGRATION TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dolphin_assets (
    asset_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_type TEXT NOT NULL CHECK (asset_type IN ('business_manager', 'ad_account', 'profile')),
    dolphin_asset_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    asset_metadata JSONB,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(asset_type, dolphin_asset_id)
);

CREATE TABLE IF NOT EXISTS public.client_asset_bindings (
    binding_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES public.dolphin_assets(asset_id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    bm_id UUID REFERENCES public.business_managers(bm_id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active',
    bound_at TIMESTAMPTZ DEFAULT NOW(),
    bound_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dolphin_assets_asset_type ON public.dolphin_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_dolphin_assets_dolphin_asset_id ON public.dolphin_assets(dolphin_asset_id);
CREATE INDEX IF NOT EXISTS idx_client_asset_bindings_asset_id ON public.client_asset_bindings(asset_id);
CREATE INDEX IF NOT EXISTS idx_client_asset_bindings_organization_id ON public.client_asset_bindings(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_asset_bindings_bm_id ON public.client_asset_bindings(bm_id);

CREATE OR REPLACE FUNCTION public.fulfill_application_and_bind_assets(
    p_application_id UUID,
    p_organization_id UUID,
    p_admin_user_id UUID,
    p_dolphin_bm_asset_id UUID
)
RETURNS JSONB AS $$
DECLARE
    new_bm_id UUID;
    v_dolphin_bm_id_text TEXT;
    ad_account_asset RECORD;
BEGIN
    -- Step 1: Create the local Business Manager record for the client
    -- First, get the dolphin_asset_id (text version) for the main BM asset
    SELECT da.dolphin_asset_id INTO v_dolphin_bm_id_text
    FROM public.dolphin_assets da
    WHERE da.asset_id = p_dolphin_bm_asset_id;

    INSERT INTO public.business_managers (organization_id, application_id, dolphin_business_manager_id, status)
    VALUES (p_organization_id, p_application_id, v_dolphin_bm_id_text, 'active')
    RETURNING bm_id INTO new_bm_id;

    -- Step 2: Bind the main Business Manager asset to the organization
    INSERT INTO public.client_asset_bindings (asset_id, organization_id, bm_id, bound_by, status)
    VALUES (p_dolphin_bm_asset_id, p_organization_id, new_bm_id, p_admin_user_id, 'active');

    -- Step 3: Find, bind, and create records for all associated ad accounts
    FOR ad_account_asset IN
        SELECT *
        FROM public.dolphin_assets da
        WHERE da.asset_type = 'ad_account'
          AND da.asset_metadata->>'business_manager_id' = v_dolphin_bm_id_text
          -- Ensure we only grab unbound ad accounts
          AND NOT EXISTS (
              SELECT 1 FROM public.client_asset_bindings cab
              WHERE cab.asset_id = da.asset_id
          )
    LOOP
        -- Bind the ad account asset
        INSERT INTO public.client_asset_bindings (asset_id, organization_id, bm_id, bound_by, status)
        VALUES (ad_account_asset.asset_id, p_organization_id, new_bm_id, p_admin_user_id, 'active');

        -- Create the local ad_account record
        INSERT INTO public.ad_accounts (bm_id, name, dolphin_account_id, status)
        VALUES (new_bm_id, ad_account_asset.name, ad_account_asset.dolphin_asset_id, 'active');
    END LOOP;

    -- Step 4: Update the original application status to 'fulfilled'
    UPDATE public.bm_applications
    SET status = 'fulfilled'
    WHERE application_id = p_application_id;

    -- Return success
    RETURN jsonb_build_object('success', true, 'new_bm_id', new_bm_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get client business managers with their real names
CREATE OR REPLACE FUNCTION public.get_client_business_managers(p_organization_id UUID)
RETURNS TABLE (
    bm_id UUID,
    organization_id UUID,
    application_id UUID,
    dolphin_business_manager_id TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    name TEXT,
    ad_account_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bm.bm_id,
        bm.organization_id,
        bm.application_id,
        bm.dolphin_business_manager_id,
        bm.status,
        bm.created_at,
        bm.updated_at,
        -- Join with dolphin_assets to get the real name
        da.name,
        -- Count associated ad accounts from active bindings, not the ad_accounts table
        (SELECT COUNT(*) 
         FROM public.client_asset_bindings cab
         JOIN public.dolphin_assets da_sub ON cab.asset_id = da_sub.asset_id
         WHERE cab.bm_id = bm.bm_id 
         AND cab.status = 'active'
         AND da_sub.asset_type = 'ad_account') as ad_account_count
    FROM
        public.business_managers bm
    LEFT JOIN
        public.dolphin_assets da ON bm.dolphin_business_manager_id = da.dolphin_asset_id AND da.asset_type = 'business_manager'
    WHERE
        bm.organization_id = p_organization_id
        -- Only show BMs that have active bindings (are actually bound to the organization)
        AND EXISTS (
            SELECT 1 FROM public.client_asset_bindings cab_bm
            WHERE cab_bm.bm_id = bm.bm_id 
            AND cab_bm.organization_id = p_organization_id
            AND cab_bm.status = 'active'
        )
    ORDER BY
        bm.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Add asset_assignments table for tracking assignments
CREATE TABLE IF NOT EXISTS public.asset_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    dolphin_asset_id UUID NOT NULL REFERENCES public.dolphin_assets(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    application_id UUID REFERENCES public.bm_applications(application_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, dolphin_asset_id)
);

-- Add indexes for asset_assignments
CREATE INDEX IF NOT EXISTS idx_asset_assignments_org_id ON public.asset_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_asset_id ON public.asset_assignments(dolphin_asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_assigned_by ON public.asset_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_application_id ON public.asset_assignments(application_id);

-- Add RLS policies for asset_assignments
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all asset assignments" ON public.asset_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.is_superuser = true
    )
);

CREATE POLICY "Organizations can view their asset assignments" ON public.asset_assignments
FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid()
    )
);

COMMIT; 
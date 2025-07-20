-- Complete schema with all essential tables and fixed applications system
-- This migration creates all necessary tables and fixes the ambiguous column reference issue

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 1: Create essential tables first (organizations, profiles, etc.)

-- Organizations table
CREATE TABLE public.organizations (
    organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL,
    plan_id TEXT,
    avatar_url TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_subscription_status TEXT,
    team_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY,
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

-- Funding Requests table
CREATE TABLE public.funding_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,
    requested_amount_cents INTEGER NOT NULL,
    approved_amount_cents INTEGER,
    notes TEXT,
    admin_notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create clean application management tables

-- Applications table - client requests for assets
CREATE TABLE public.application (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    request_type TEXT NOT NULL CHECK (request_type IN ('new_business_manager', 'additional_accounts')),
    target_bm_dolphin_id TEXT NULL, -- For additional_accounts requests, which BM to add accounts to
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('business_manager', 'ad_account', 'profile')),
    dolphin_id TEXT NOT NULL, -- External Dolphin system ID
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    metadata JSONB NULL, -- Store relationships, limits, team info, etc.
    last_synced_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure unique dolphin_id per type
    UNIQUE(type, dolphin_id)
);

-- Asset bindings table - which assets are bound to which organizations
CREATE TABLE public.asset_binding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    bound_by UUID NOT NULL,
    bound_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create partial unique index to ensure one active binding per asset
CREATE UNIQUE INDEX idx_asset_binding_active_unique 
ON public.asset_binding(asset_id) 
WHERE status = 'active';

-- Application fulfillment tracking - which assets were assigned to which applications
CREATE TABLE public.application_fulfillment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    asset_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(application_id, asset_id)
);

-- Step 3: Add foreign key constraints

-- Organizations foreign keys
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Profiles foreign keys
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE SET NULL;

-- Organization members foreign keys
ALTER TABLE public.organization_members 
ADD CONSTRAINT organization_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.organization_members 
ADD CONSTRAINT organization_members_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE CASCADE;

-- Wallets foreign keys
ALTER TABLE public.wallets 
ADD CONSTRAINT wallets_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE CASCADE;

-- Transactions foreign keys
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE CASCADE;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_wallet_id_fkey 
FOREIGN KEY (wallet_id) REFERENCES public.wallets(wallet_id) ON DELETE CASCADE;

-- Funding requests foreign keys
ALTER TABLE public.funding_requests 
ADD CONSTRAINT funding_requests_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE CASCADE;

ALTER TABLE public.funding_requests 
ADD CONSTRAINT funding_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Application foreign keys
ALTER TABLE public.application 
ADD CONSTRAINT application_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE CASCADE;

ALTER TABLE public.application 
ADD CONSTRAINT application_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES public.profiles(id);

ALTER TABLE public.application 
ADD CONSTRAINT application_rejected_by_fkey 
FOREIGN KEY (rejected_by) REFERENCES public.profiles(id);

ALTER TABLE public.application 
ADD CONSTRAINT application_fulfilled_by_fkey 
FOREIGN KEY (fulfilled_by) REFERENCES public.profiles(id);

-- Asset binding foreign keys
ALTER TABLE public.asset_binding 
ADD CONSTRAINT asset_binding_asset_id_fkey 
FOREIGN KEY (asset_id) REFERENCES public.asset(id) ON DELETE CASCADE;

ALTER TABLE public.asset_binding 
ADD CONSTRAINT asset_binding_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE CASCADE;

ALTER TABLE public.asset_binding 
ADD CONSTRAINT asset_binding_bound_by_fkey 
FOREIGN KEY (bound_by) REFERENCES public.profiles(id);

-- Application fulfillment foreign keys
ALTER TABLE public.application_fulfillment 
ADD CONSTRAINT application_fulfillment_application_id_fkey 
FOREIGN KEY (application_id) REFERENCES public.application(id) ON DELETE CASCADE;

ALTER TABLE public.application_fulfillment 
ADD CONSTRAINT application_fulfillment_asset_id_fkey 
FOREIGN KEY (asset_id) REFERENCES public.asset(id) ON DELETE CASCADE;

-- Step 4: Create indexes for performance
CREATE INDEX idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_organization_id ON public.organization_members(organization_id);
CREATE INDEX idx_wallets_organization_id ON public.wallets(organization_id);
CREATE INDEX idx_transactions_organization_id ON public.transactions(organization_id);
CREATE INDEX idx_funding_requests_organization_id ON public.funding_requests(organization_id);

CREATE INDEX idx_application_organization_id ON public.application(organization_id);
CREATE INDEX idx_application_status ON public.application(status);
CREATE INDEX idx_application_request_type ON public.application(request_type);
CREATE INDEX idx_application_created_at ON public.application(created_at DESC);

CREATE INDEX idx_asset_type ON public.asset(type);
CREATE INDEX idx_asset_dolphin_id ON public.asset(dolphin_id);
CREATE INDEX idx_asset_status ON public.asset(status);
CREATE INDEX idx_asset_metadata_gin ON public.asset USING GIN(metadata);

CREATE INDEX idx_asset_binding_organization_id ON public.asset_binding(organization_id);
CREATE INDEX idx_asset_binding_asset_id ON public.asset_binding(asset_id);
CREATE INDEX idx_asset_binding_status ON public.asset_binding(status);

CREATE INDEX idx_application_fulfillment_application_id ON public.application_fulfillment(application_id);
CREATE INDEX idx_application_fulfillment_asset_id ON public.application_fulfillment(asset_id);

-- Step 5: Create utility functions

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Step 6: Create fixed functions with proper table aliases to resolve ambiguous column reference

-- Get all applications for admin dashboard - FIXED VERSION
CREATE OR REPLACE FUNCTION public.get_applications()
RETURNS TABLE(
    id UUID,
    organization_id UUID,
    organization_name TEXT,
    request_type TEXT,
    target_bm_dolphin_id TEXT,
    website_url TEXT,
    status TEXT,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    rejected_by UUID,
    rejected_at TIMESTAMPTZ,
    fulfilled_by UUID,
    fulfilled_at TIMESTAMPTZ,
    client_notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the calling user is a superuser - FIX: Use table alias to avoid ambiguous column reference
    IF (SELECT p.is_superuser FROM public.profiles p WHERE p.id = auth.uid()) IS NOT TRUE THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        a.id,
        a.organization_id,
        o.name AS organization_name,
        a.request_type,
        a.target_bm_dolphin_id,
        a.website_url,
        a.status,
        a.approved_by,
        a.approved_at,
        a.rejected_by,
        a.rejected_at,
        a.fulfilled_by,
        a.fulfilled_at,
        a.client_notes,
        a.admin_notes,
        a.created_at,
        a.updated_at
    FROM
        public.application a
    LEFT JOIN
        public.organizations o ON a.organization_id = o.organization_id
    ORDER BY
        a.created_at DESC;
END;
$$;

-- Get organization's bound assets (client view)
CREATE OR REPLACE FUNCTION public.get_organization_assets(
    p_organization_id UUID, 
    p_asset_type TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    type TEXT,
    dolphin_id TEXT,
    name TEXT,
    status TEXT,
    metadata JSONB,
    bound_at TIMESTAMPTZ,
    binding_id UUID,
    last_synced_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify user has access to this organization
    IF NOT EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.user_id = auth.uid() AND om.organization_id = p_organization_id
    ) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        a.id,
        a.type,
        a.dolphin_id,
        a.name,
        a.status,
        a.metadata,
        ab.bound_at,
        ab.id as binding_id,
        a.last_synced_at
    FROM
        public.asset_binding ab
    JOIN
        public.asset a ON ab.asset_id = a.id
    WHERE
        ab.organization_id = p_organization_id
        AND ab.status = 'active'
        AND (p_asset_type IS NULL OR a.type = p_asset_type)
    ORDER BY
        ab.bound_at DESC;
END;
$$;

-- Get available assets for admin assignment
CREATE OR REPLACE FUNCTION public.get_available_assets(
    p_asset_type TEXT DEFAULT NULL,
    p_unbound_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    id UUID,
    type TEXT,
    dolphin_id TEXT,
    name TEXT,
    status TEXT,
    metadata JSONB,
    last_synced_at TIMESTAMPTZ,
    is_bound BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the calling user is a superuser - FIX: Use table alias to avoid ambiguous column reference
    IF (SELECT p.is_superuser FROM public.profiles p WHERE p.id = auth.uid()) IS NOT TRUE THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        a.id,
        a.type,
        a.dolphin_id,
        a.name,
        a.status,
        a.metadata,
        a.last_synced_at,
        EXISTS(
            SELECT 1 FROM public.asset_binding ab 
            WHERE ab.asset_id = a.id AND ab.status = 'active'
        ) as is_bound
    FROM
        public.asset a
    WHERE
        a.status = 'active'
        AND (p_asset_type IS NULL OR a.type = p_asset_type)
        AND (
            p_unbound_only = FALSE OR 
            NOT EXISTS(
                SELECT 1 FROM public.asset_binding ab 
                WHERE ab.asset_id = a.id AND ab.status = 'active'
            )
        )
    ORDER BY
        a.name;
END;
$$;

-- Fulfill application by binding assets
CREATE OR REPLACE FUNCTION public.fulfill_application(
    p_application_id UUID,
    p_asset_ids UUID[],
    p_admin_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_application RECORD;
    v_asset_id UUID;
    v_bound_count INTEGER := 0;
    v_error_count INTEGER := 0;
BEGIN
    -- Check if user is admin - FIX: Use table alias to avoid ambiguous column reference
    IF (SELECT p.is_superuser FROM public.profiles p WHERE p.id = p_admin_user_id) IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- Get application details
    SELECT * INTO v_application
    FROM public.application
    WHERE id = p_application_id;

    IF v_application IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Application not found');
    END IF;

    IF v_application.status != 'approved' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Application must be approved first');
    END IF;

    -- Bind each asset to the organization
    FOREACH v_asset_id IN ARRAY p_asset_ids
    LOOP
        BEGIN
            -- Create asset binding
            INSERT INTO public.asset_binding (asset_id, organization_id, bound_by)
            VALUES (v_asset_id, v_application.organization_id, p_admin_user_id);
            
            -- Track fulfillment
            INSERT INTO public.application_fulfillment (application_id, asset_id)
            VALUES (p_application_id, v_asset_id);
            
            v_bound_count := v_bound_count + 1;
        EXCEPTION WHEN OTHERS THEN
            v_error_count := v_error_count + 1;
        END;
    END LOOP;

    -- Update application status to fulfilled
    UPDATE public.application 
    SET 
        status = 'fulfilled',
        fulfilled_by = p_admin_user_id,
        fulfilled_at = NOW(),
        updated_at = NOW()
    WHERE id = p_application_id;

    RETURN jsonb_build_object(
        'success', true, 
        'bound_count', v_bound_count,
        'error_count', v_error_count
    );
END;
$$;

-- Handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id UUID;
  user_email TEXT;
  new_org_name TEXT;
BEGIN
  -- Get the email from the NEW record
  user_email := NEW.email;
  
  -- Create a user-friendly default organization name
  new_org_name := split_part(user_email, '@', 1) || '''s Team';

  -- Create a new organization for the user
  INSERT INTO public.organizations (name, owner_id)
  VALUES (new_org_name, NEW.id)
  RETURNING organization_id INTO new_org_id;

  -- Create the user's profile, linking it to the new organization
  INSERT INTO public.profiles(id, organization_id, email, role)
  VALUES (NEW.id, new_org_id, user_email, 'client');
  
  -- Add the user to the organization as a member with the 'owner' role
  INSERT INTO public.organization_members(user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');
  
  -- Create a wallet for the organization
  INSERT INTO public.wallets(organization_id)
  VALUES (new_org_id);
  
  -- Inject the organization_id into the user's app_metadata for easy access on the client
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('organization_id', new_org_id)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Step 7: Create triggers

-- Update triggers for timestamp columns
CREATE TRIGGER update_application_updated_at 
    BEFORE UPDATE ON public.application
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asset_updated_at 
    BEFORE UPDATE ON public.asset
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asset_binding_updated_at 
    BEFORE UPDATE ON public.asset_binding
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user(); 
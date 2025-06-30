-- Comprehensive AdHub Database Schema
-- This migration creates the complete, clean database schema for AdHub
-- Combines all previous migrations into one comprehensive setup

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
    name TEXT, -- Application name for better UX
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
FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.application 
ADD CONSTRAINT application_rejected_by_fkey 
FOREIGN KEY (rejected_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.application 
ADD CONSTRAINT application_fulfilled_by_fkey 
FOREIGN KEY (fulfilled_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Asset binding foreign keys
ALTER TABLE public.asset_binding 
ADD CONSTRAINT asset_binding_asset_id_fkey 
FOREIGN KEY (asset_id) REFERENCES public.asset(id) ON DELETE CASCADE;

ALTER TABLE public.asset_binding 
ADD CONSTRAINT asset_binding_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE CASCADE;

ALTER TABLE public.asset_binding 
ADD CONSTRAINT asset_binding_bound_by_fkey 
FOREIGN KEY (bound_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Application fulfillment foreign keys
ALTER TABLE public.application_fulfillment 
ADD CONSTRAINT application_fulfillment_application_id_fkey 
FOREIGN KEY (application_id) REFERENCES public.application(id) ON DELETE CASCADE;

ALTER TABLE public.application_fulfillment 
ADD CONSTRAINT application_fulfillment_asset_id_fkey 
FOREIGN KEY (asset_id) REFERENCES public.asset(id) ON DELETE CASCADE;

-- Step 4: Create indexes for performance

-- Organizations indexes
CREATE INDEX idx_organizations_owner_id ON public.organizations(owner_id);

-- Profiles indexes
CREATE INDEX idx_profiles_organization_id ON public.profiles(organization_id);

-- Organization members indexes
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_organization_id ON public.organization_members(organization_id);

-- Wallets indexes
CREATE INDEX idx_wallets_organization_id ON public.wallets(organization_id);

-- Transactions indexes
CREATE INDEX idx_transactions_organization_id ON public.transactions(organization_id);

-- Funding requests indexes
CREATE INDEX idx_funding_requests_organization_id ON public.funding_requests(organization_id);

-- Application indexes
CREATE INDEX idx_application_organization_id ON public.application(organization_id);
CREATE INDEX idx_application_status ON public.application(status);
CREATE INDEX idx_application_request_type ON public.application(request_type);
CREATE INDEX idx_application_created_at ON public.application(created_at DESC);
CREATE INDEX idx_application_name ON public.application(name);

-- Asset indexes
CREATE INDEX idx_asset_type ON public.asset(type);
CREATE INDEX idx_asset_dolphin_id ON public.asset(dolphin_id);
CREATE INDEX idx_asset_status ON public.asset(status);
CREATE INDEX idx_asset_metadata_gin ON public.asset USING GIN(metadata);

-- Asset binding indexes
CREATE INDEX idx_asset_binding_organization_id ON public.asset_binding(organization_id);
CREATE INDEX idx_asset_binding_asset_id ON public.asset_binding(asset_id);
CREATE INDEX idx_asset_binding_status ON public.asset_binding(status);

-- Application fulfillment indexes
CREATE INDEX idx_application_fulfillment_application_id ON public.application_fulfillment(application_id);
CREATE INDEX idx_application_fulfillment_asset_id ON public.application_fulfillment(asset_id);

-- Step 5: Create functions and triggers

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to get applications with enriched data
CREATE OR REPLACE FUNCTION public.get_applications()
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    organization_name TEXT,
    name TEXT,
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
    updated_at TIMESTAMPTZ,
    approved_by_name TEXT,
    rejected_by_name TEXT,
    fulfilled_by_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.organization_id,
        o.name as organization_name,
        a.name,
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
        a.updated_at,
        ap.name as approved_by_name,
        rp.name as rejected_by_name,
        fp.name as fulfilled_by_name
    FROM public.application a
    LEFT JOIN public.organizations o ON a.organization_id = o.organization_id
    LEFT JOIN public.profiles ap ON a.approved_by = ap.id
    LEFT JOIN public.profiles rp ON a.rejected_by = rp.id
    LEFT JOIN public.profiles fp ON a.fulfilled_by = fp.id
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get organization assets with binding info
CREATE OR REPLACE FUNCTION public.get_organization_assets(
    p_organization_id UUID,
    p_asset_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    dolphin_id TEXT,
    name TEXT,
    status TEXT,
    metadata JSONB,
    last_synced_at TIMESTAMPTZ,
    binding_id UUID,
    bound_at TIMESTAMPTZ,
    bound_by UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.type,
        a.dolphin_id,
        a.name,
        a.status,
        a.metadata,
        a.last_synced_at,
        ab.id as binding_id,
        ab.bound_at,
        ab.bound_by
    FROM public.asset a
    INNER JOIN public.asset_binding ab ON a.id = ab.asset_id
    WHERE ab.organization_id = p_organization_id
      AND ab.status = 'active'
      AND (p_asset_type IS NULL OR a.type = p_asset_type)
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get available (unbound) assets
CREATE OR REPLACE FUNCTION public.get_available_assets(
    p_asset_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    dolphin_id TEXT,
    name TEXT,
    status TEXT,
    metadata JSONB,
    last_synced_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.type,
        a.dolphin_id,
        a.name,
        a.status,
        a.metadata,
        a.last_synced_at
    FROM public.asset a
    WHERE NOT EXISTS (
        SELECT 1 FROM public.asset_binding ab 
        WHERE ab.asset_id = a.id AND ab.status = 'active'
    )
    AND a.status = 'active'
    AND (p_asset_type IS NULL OR a.type = p_asset_type)
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to fulfill an application by binding assets
CREATE OR REPLACE FUNCTION public.fulfill_application(
    p_application_id UUID,
    p_asset_ids UUID[],
    p_admin_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    app_record public.application%ROWTYPE;
    asset_id UUID;
    binding_id UUID;
    result JSON;
BEGIN
    -- Get application details
    SELECT * INTO app_record FROM public.application WHERE id = p_application_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Application not found');
    END IF;
    
    IF app_record.status != 'processing' THEN
        RETURN json_build_object('success', false, 'error', 'Application must be in processing status');
    END IF;
    
    -- Bind each asset to the organization
    FOREACH asset_id IN ARRAY p_asset_ids
    LOOP
        INSERT INTO public.asset_binding (asset_id, organization_id, bound_by)
        VALUES (asset_id, app_record.organization_id, p_admin_user_id)
        RETURNING id INTO binding_id;
        
        -- Track fulfillment
        INSERT INTO public.application_fulfillment (application_id, asset_id)
        VALUES (p_application_id, asset_id);
    END LOOP;
    
    -- Update application status
    UPDATE public.application 
    SET status = 'fulfilled',
        fulfilled_by = p_admin_user_id,
        fulfilled_at = NOW(),
        updated_at = NOW()
    WHERE id = p_application_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Application fulfilled successfully',
        'assets_bound', array_length(p_asset_ids, 1)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create triggers

-- Updated at triggers
CREATE TRIGGER update_application_updated_at 
    BEFORE UPDATE ON public.application
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asset_updated_at 
    BEFORE UPDATE ON public.asset
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asset_binding_updated_at 
    BEFORE UPDATE ON public.asset_binding
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User registration trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 7: Add comments for documentation
COMMENT ON SCHEMA public IS 'AdHub comprehensive schema - clean, unified asset management system';
COMMENT ON TABLE public.asset IS 'All Facebook assets (Business Managers, Ad Accounts, Profiles) synced from Dolphin';
COMMENT ON TABLE public.asset_binding IS 'Which assets are bound to which organizations';
COMMENT ON TABLE public.application IS 'Client requests for new assets or additional accounts';
COMMENT ON TABLE public.application_fulfillment IS 'Tracks which assets were assigned to fulfill which applications'; 
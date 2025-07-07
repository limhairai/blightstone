-- Migration: Implement Semantic ID Naming Convention
-- This migration replaces generic 'id' fields with semantic names to improve code clarity
-- and prevent ID confusion bugs throughout the application.

-- =====================================================
-- PHASE 1: ADD NEW SEMANTIC ID COLUMNS
-- =====================================================

-- Add semantic primary key columns to tables that currently use generic 'id'
ALTER TABLE public.application ADD COLUMN application_id UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.application_fulfillment ADD COLUMN fulfillment_id UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.asset ADD COLUMN asset_id UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.asset_binding ADD COLUMN binding_id UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.profiles ADD COLUMN profile_id UUID DEFAULT gen_random_uuid() NOT NULL;

-- Update new columns with existing ID values
UPDATE public.application SET application_id = id;
UPDATE public.application_fulfillment SET fulfillment_id = id;
UPDATE public.asset SET asset_id = id;
UPDATE public.asset_binding SET binding_id = id;
UPDATE public.profiles SET profile_id = id;

-- =====================================================
-- PHASE 2: UPDATE FOREIGN KEY REFERENCES
-- =====================================================

-- Update application_fulfillment table to use semantic foreign keys
ALTER TABLE public.application_fulfillment 
ADD COLUMN application_ref_id UUID,
ADD COLUMN asset_ref_id UUID;

-- Copy existing foreign key values
UPDATE public.application_fulfillment af 
SET application_ref_id = a.application_id
FROM public.application a 
WHERE af.application_id = a.id;

UPDATE public.application_fulfillment af 
SET asset_ref_id = ast.asset_id
FROM public.asset ast 
WHERE af.asset_id = ast.id;

-- Update asset_binding table to use semantic foreign keys
ALTER TABLE public.asset_binding 
ADD COLUMN asset_ref_id UUID;

UPDATE public.asset_binding ab 
SET asset_ref_id = ast.asset_id
FROM public.asset ast 
WHERE ab.asset_id = ast.id;

-- =====================================================
-- PHASE 3: DROP FOREIGN KEY CONSTRAINTS FIRST
-- =====================================================

-- Drop existing foreign key constraints BEFORE dropping primary keys
ALTER TABLE public.application_fulfillment DROP CONSTRAINT IF EXISTS application_fulfillment_application_id_fkey;
ALTER TABLE public.application_fulfillment DROP CONSTRAINT IF EXISTS application_fulfillment_asset_id_fkey;
ALTER TABLE public.asset_binding DROP CONSTRAINT IF EXISTS asset_binding_asset_id_fkey;

-- Drop existing unique constraints that reference old IDs
ALTER TABLE public.application_fulfillment DROP CONSTRAINT IF EXISTS application_fulfillment_application_id_asset_id_key;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_application_fulfillment_application_id;
DROP INDEX IF EXISTS idx_application_fulfillment_asset_id;

-- =====================================================
-- PHASE 4: DROP OLD PRIMARY KEY CONSTRAINTS
-- =====================================================

-- Now we can safely drop primary key constraints
ALTER TABLE public.application DROP CONSTRAINT application_pkey;
ALTER TABLE public.application_fulfillment DROP CONSTRAINT application_fulfillment_pkey;
ALTER TABLE public.asset DROP CONSTRAINT asset_pkey;
ALTER TABLE public.asset_binding DROP CONSTRAINT asset_binding_pkey;
ALTER TABLE public.profiles DROP CONSTRAINT profiles_pkey;

-- =====================================================
-- PHASE 5: CREATE NEW SEMANTIC CONSTRAINTS
-- =====================================================

-- Add new primary key constraints with semantic names
ALTER TABLE public.application ADD CONSTRAINT application_pkey PRIMARY KEY (application_id);
ALTER TABLE public.application_fulfillment ADD CONSTRAINT application_fulfillment_pkey PRIMARY KEY (fulfillment_id);
ALTER TABLE public.asset ADD CONSTRAINT asset_pkey PRIMARY KEY (asset_id);
ALTER TABLE public.asset_binding ADD CONSTRAINT asset_binding_pkey PRIMARY KEY (binding_id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (profile_id);

-- Add new foreign key constraints with semantic names
ALTER TABLE public.application_fulfillment 
ADD CONSTRAINT application_fulfillment_application_id_fkey 
FOREIGN KEY (application_ref_id) REFERENCES public.application(application_id);

ALTER TABLE public.application_fulfillment 
ADD CONSTRAINT application_fulfillment_asset_id_fkey 
FOREIGN KEY (asset_ref_id) REFERENCES public.asset(asset_id);

ALTER TABLE public.asset_binding 
ADD CONSTRAINT asset_binding_asset_id_fkey 
FOREIGN KEY (asset_ref_id) REFERENCES public.asset(asset_id);

-- Add new unique constraints
ALTER TABLE public.application_fulfillment 
ADD CONSTRAINT application_fulfillment_application_asset_unique 
UNIQUE (application_ref_id, asset_ref_id);

-- Recreate unique constraint for asset with new primary key
ALTER TABLE public.asset 
ADD CONSTRAINT asset_type_dolphin_id_unique 
UNIQUE (type, dolphin_id);

-- =====================================================
-- PHASE 6: CREATE NEW SEMANTIC INDEXES
-- =====================================================

-- Create indexes with semantic names
CREATE INDEX IF NOT EXISTS idx_application_fulfillment_application_ref_id ON public.application_fulfillment(application_ref_id);
CREATE INDEX IF NOT EXISTS idx_application_fulfillment_asset_ref_id ON public.application_fulfillment(asset_ref_id);
CREATE INDEX IF NOT EXISTS idx_asset_binding_asset_ref_id ON public.asset_binding(asset_ref_id);
CREATE INDEX IF NOT EXISTS idx_asset_binding_organization_id ON public.asset_binding(organization_id);

-- =====================================================
-- PHASE 7: UPDATE STORED FUNCTIONS
-- =====================================================

-- Drop existing functions first to avoid return type conflicts
DROP FUNCTION IF EXISTS public.get_applications();
DROP FUNCTION IF EXISTS public.get_available_assets(text, boolean);
DROP FUNCTION IF EXISTS public.get_organization_assets(uuid, text);
DROP FUNCTION IF EXISTS public.fulfill_application(uuid, uuid[], uuid);

-- Update get_applications function to use semantic IDs
CREATE OR REPLACE FUNCTION public.get_applications()
RETURNS TABLE(
    application_id uuid,
    organization_id uuid,
    organization_name text,
    request_type text,
    target_bm_dolphin_id text,
    website_url text,
    status text,
    approved_by uuid,
    approved_at timestamp with time zone,
    rejected_by uuid,
    rejected_at timestamp with time zone,
    fulfilled_by uuid,
    fulfilled_at timestamp with time zone,
    client_notes text,
    admin_notes text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the calling user is a superuser
    IF (SELECT p.is_superuser FROM public.profiles p WHERE p.profile_id = auth.uid()) IS NOT TRUE THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        a.application_id,
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

-- Update get_available_assets function to use semantic IDs
CREATE OR REPLACE FUNCTION public.get_available_assets(
    p_asset_type text DEFAULT NULL,
    p_unbound_only boolean DEFAULT false
)
RETURNS TABLE(
    asset_id uuid,
    type text,
    dolphin_id text,
    name text,
    status text,
    metadata jsonb,
    last_synced_at timestamp with time zone,
    is_bound boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the calling user is a superuser
    IF (SELECT p.is_superuser FROM public.profiles p WHERE p.profile_id = auth.uid()) IS NOT TRUE THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        a.asset_id,
        a.type,
        a.dolphin_id,
        a.name,
        a.status,
        a.metadata,
        a.last_synced_at,
        EXISTS(
            SELECT 1 FROM public.asset_binding ab 
            WHERE ab.asset_ref_id = a.asset_id AND ab.status = 'active'
        ) as is_bound
    FROM
        public.asset a
    WHERE
        a.status = 'active'
        AND (p_asset_type IS NULL OR a.type = p_asset_type)
        AND (NOT p_unbound_only OR NOT EXISTS(
            SELECT 1 FROM public.asset_binding ab 
            WHERE ab.asset_ref_id = a.asset_id AND ab.status = 'active'
        ))
    ORDER BY
        a.created_at DESC;
END;
$$;

-- Update get_organization_assets function to use semantic IDs
CREATE OR REPLACE FUNCTION public.get_organization_assets(
    p_organization_id uuid,
    p_asset_type text DEFAULT NULL
)
RETURNS TABLE(
    asset_id uuid,
    type text,
    dolphin_id text,
    name text,
    status text,
    metadata jsonb,
    bound_at timestamp with time zone,
    binding_id uuid,
    last_synced_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.asset_id,
        a.type,
        a.dolphin_id,
        a.name,
        a.status,
        a.metadata,
        ab.bound_at,
        ab.binding_id,
        a.last_synced_at
    FROM
        public.asset a
    INNER JOIN
        public.asset_binding ab ON a.asset_id = ab.asset_ref_id
    WHERE
        ab.organization_id = p_organization_id
        AND ab.status = 'active'
        AND (p_asset_type IS NULL OR a.type = p_asset_type)
    ORDER BY
        ab.bound_at DESC;
END;
$$;

-- Update fulfill_application function to use semantic IDs
CREATE OR REPLACE FUNCTION public.fulfill_application(
    p_application_id uuid,
    p_asset_ids uuid[],
    p_admin_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_application RECORD;
    v_asset_id UUID;
    v_bound_count INTEGER := 0;
    v_error_count INTEGER := 0;
BEGIN
    -- Check if user is admin
    IF (SELECT p.is_superuser FROM public.profiles p WHERE p.profile_id = p_admin_user_id) IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- Get application details
    SELECT * INTO v_application
    FROM public.application
    WHERE application_id = p_application_id;

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
            INSERT INTO public.asset_binding (asset_ref_id, organization_id, bound_by)
            VALUES (v_asset_id, v_application.organization_id, p_admin_user_id);
            
            -- Track fulfillment
            INSERT INTO public.application_fulfillment (application_ref_id, asset_ref_id)
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
    WHERE application_id = p_application_id;

    RETURN jsonb_build_object(
        'success', true, 
        'bound_count', v_bound_count,
        'error_count', v_error_count
    );
END;
$$;

-- =====================================================
-- PHASE 8: UPDATE RLS POLICIES
-- =====================================================

-- Update RLS policies that reference profiles.id to use profile_id
-- Note: Only updating policies for tables that exist at this point
DROP POLICY IF EXISTS "Admins can manage all onboarding states" ON public.onboarding_states;

-- Recreate policies with semantic IDs for existing tables
CREATE POLICY "Admins can manage all onboarding states" ON public.onboarding_states
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.profile_id = auth.uid() AND p.is_superuser = true
        )
    );

-- =====================================================
-- PHASE 9: DROP OLD COLUMNS
-- =====================================================

-- Drop old generic ID columns (these will be replaced by semantic ones)
ALTER TABLE public.application DROP COLUMN id;
ALTER TABLE public.application_fulfillment DROP COLUMN id;
ALTER TABLE public.asset DROP COLUMN id;
ALTER TABLE public.asset_binding DROP COLUMN id;
ALTER TABLE public.profiles DROP COLUMN id;

-- Drop old foreign key columns in junction tables
ALTER TABLE public.application_fulfillment DROP COLUMN application_id;
ALTER TABLE public.application_fulfillment DROP COLUMN asset_id;
ALTER TABLE public.asset_binding DROP COLUMN asset_id;

-- Rename new foreign key columns to standard names
ALTER TABLE public.application_fulfillment RENAME COLUMN application_ref_id TO application_id;
ALTER TABLE public.application_fulfillment RENAME COLUMN asset_ref_id TO asset_id;
ALTER TABLE public.asset_binding RENAME COLUMN asset_ref_id TO asset_id;

-- =====================================================
-- PHASE 10: UPDATE TRIGGERS
-- =====================================================

-- Update triggers to use semantic IDs
DROP TRIGGER IF EXISTS set_updated_at_application ON public.application;
DROP TRIGGER IF EXISTS set_updated_at_asset ON public.asset;
DROP TRIGGER IF EXISTS set_updated_at_asset_binding ON public.asset_binding;
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;

CREATE TRIGGER set_updated_at_application
    BEFORE UPDATE ON public.application
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_asset
    BEFORE UPDATE ON public.asset
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_asset_binding
    BEFORE UPDATE ON public.asset_binding
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Add comment documenting the migration
COMMENT ON TABLE public.application IS 'Applications table - uses semantic ID (application_id) for clarity';
COMMENT ON TABLE public.asset IS 'Assets table - uses semantic ID (asset_id) for clarity';
COMMENT ON TABLE public.asset_binding IS 'Asset bindings table - uses semantic ID (binding_id) for clarity';
COMMENT ON TABLE public.profiles IS 'Profiles table - uses semantic ID (profile_id) for clarity';
COMMENT ON TABLE public.application_fulfillment IS 'Application fulfillment table - uses semantic ID (fulfillment_id) for clarity';

-- Update handle_new_user function to use semantic IDs
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
  INSERT INTO public.organizations (name, owner_id)
  VALUES (user_name || '''s Organization', NEW.id)
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
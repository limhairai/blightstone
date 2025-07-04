-- Fix semantic ID functions that are using incorrect column names
-- This fixes the "column ab.asset_ref_id does not exist" errors
-- Also update plans table to use semantic ID (plan_id instead of id)

-- First, update plans table to use semantic ID
ALTER TABLE public.plans RENAME COLUMN id TO plan_id;

-- Update foreign key references to plans table
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_plan_id_fkey;
ALTER TABLE public.organizations ADD CONSTRAINT organizations_plan_id_fkey 
    FOREIGN KEY (plan_id) REFERENCES public.plans(plan_id);

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id_fkey;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_id_fkey 
    FOREIGN KEY (plan_id) REFERENCES public.plans(plan_id);

-- Fix get_available_assets function
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
            WHERE ab.asset_id = a.asset_id AND ab.status = 'active'
        ) as is_bound
    FROM
        public.asset a
    WHERE
        a.status = 'active'
        AND (p_asset_type IS NULL OR a.type = p_asset_type)
        AND (NOT p_unbound_only OR NOT EXISTS(
            SELECT 1 FROM public.asset_binding ab 
            WHERE ab.asset_id = a.asset_id AND ab.status = 'active'
        ))
    ORDER BY
        a.created_at DESC;
END;
$$;

-- Fix get_organization_assets function
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
        public.asset_binding ab ON a.asset_id = ab.asset_id
    WHERE
        ab.organization_id = p_organization_id
        AND ab.status = 'active'
        AND (p_asset_type IS NULL OR a.type = p_asset_type)
    ORDER BY
        ab.bound_at DESC;
END;
$$;

-- Fix fulfill_application function
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
    WHERE application_id = p_application_id;

    RETURN jsonb_build_object(
        'success', true, 
        'bound_count', v_bound_count,
        'error_count', v_error_count
    );
END;
$$;

-- Fix handle_new_user function to use semantic IDs
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
  INSERT INTO public.profiles(profile_id, organization_id, email, role)
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
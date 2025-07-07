-- Drop and recreate functions to fix column references after semantic ID migration
-- This addresses the "column id does not exist" errors by updating function signatures

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_applications();
DROP FUNCTION IF EXISTS public.fulfill_application(UUID, UUID[], UUID);
DROP FUNCTION IF EXISTS public.get_available_assets(TEXT);
DROP FUNCTION IF EXISTS public.get_organization_assets(UUID, TEXT);

-- Recreate get_applications function with semantic IDs
CREATE OR REPLACE FUNCTION public.get_applications()
RETURNS TABLE(
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
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.application_id as id,
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
    LEFT JOIN public.profiles ap ON a.approved_by = ap.profile_id
    LEFT JOIN public.profiles rp ON a.rejected_by = rp.profile_id
    LEFT JOIN public.profiles fp ON a.fulfilled_by = fp.profile_id
    ORDER BY a.created_at DESC;
END;
$$;

-- Recreate fulfill_application function with semantic IDs
CREATE OR REPLACE FUNCTION public.fulfill_application(
    p_application_id UUID,
    p_asset_ids UUID[],
    p_admin_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    app_record public.application%ROWTYPE;
    asset_id UUID;
    binding_id UUID;
    result JSON;
BEGIN
    -- Get application details using semantic ID
    SELECT * INTO app_record FROM public.application WHERE application_id = p_application_id;
    
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
        RETURNING binding_id INTO binding_id;
        
        -- Track fulfillment using semantic IDs
        INSERT INTO public.application_fulfillment (application_ref_id, asset_ref_id)
        VALUES (p_application_id, asset_id);
    END LOOP;
    
    -- Update application status using semantic ID
    UPDATE public.application 
    SET status = 'fulfilled',
        fulfilled_by = p_admin_user_id,
        fulfilled_at = NOW(),
        updated_at = NOW()
    WHERE application_id = p_application_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Application fulfilled successfully',
        'assets_bound', array_length(p_asset_ids, 1)
    );
END;
$$;

-- Recreate get_available_assets function with semantic IDs
CREATE OR REPLACE FUNCTION public.get_available_assets(
    p_asset_type TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    type TEXT,
    dolphin_id TEXT,
    name TEXT,
    status TEXT,
    metadata JSONB,
    last_synced_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.asset_id as id,
        a.type,
        a.dolphin_id,
        a.name,
        a.status,
        a.metadata,
        a.last_synced_at
    FROM public.asset a
    WHERE NOT EXISTS (
        SELECT 1 FROM public.asset_binding ab 
        WHERE ab.asset_id = a.asset_id AND ab.status = 'active'
    )
    AND a.status = 'active'
    AND (p_asset_type IS NULL OR a.type = p_asset_type)
    ORDER BY a.created_at DESC;
END;
$$;

-- Recreate get_organization_assets function with semantic IDs
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
    last_synced_at TIMESTAMPTZ,
    binding_id UUID,
    bound_at TIMESTAMPTZ,
    bound_by UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.asset_id as id,
        a.type,
        a.dolphin_id,
        a.name,
        a.status,
        a.metadata,
        a.last_synced_at,
        ab.binding_id,
        ab.bound_at,
        ab.bound_by
    FROM public.asset a
    INNER JOIN public.asset_binding ab ON a.asset_id = ab.asset_id
    WHERE ab.organization_id = p_organization_id
    AND ab.status = 'active'
    AND (p_asset_type IS NULL OR a.type = p_asset_type)
    ORDER BY ab.bound_at DESC;
END;
$$;

-- Add comments
COMMENT ON FUNCTION public.get_applications() IS 'Returns all applications with semantic ID compatibility';
COMMENT ON FUNCTION public.fulfill_application(UUID, UUID[], UUID) IS 'Fulfills application using semantic IDs';
COMMENT ON FUNCTION public.get_available_assets(TEXT) IS 'Returns available assets using semantic IDs';
COMMENT ON FUNCTION public.get_organization_assets(UUID, TEXT) IS 'Returns organization assets using semantic IDs'; 
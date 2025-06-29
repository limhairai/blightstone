-- ============================================================================
-- BINDING SYSTEM CONSOLIDATION MIGRATION
-- This migration consolidates the dual binding system to use only the direct
-- dolphin_assets approach, eliminating local record duplication.
-- ============================================================================

-- Update the fulfillment function to remove local record creation
CREATE OR REPLACE FUNCTION public.fulfill_application_and_bind_assets(
    p_application_id UUID,
    p_organization_id UUID,
    p_admin_user_id UUID,
    p_dolphin_bm_asset_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_dolphin_bm_id_text TEXT;
    ad_account_asset RECORD;
    bound_assets_count INTEGER := 0;
BEGIN
    -- Step 1: Get the dolphin_asset_id (text version) for the main BM asset
    SELECT da.dolphin_asset_id INTO v_dolphin_bm_id_text
    FROM public.dolphin_assets da
    WHERE da.asset_id = p_dolphin_bm_asset_id;

    IF v_dolphin_bm_id_text IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Business Manager asset not found');
    END IF;

    -- Step 2: Bind the main Business Manager asset to the organization
    INSERT INTO public.client_asset_bindings (asset_id, organization_id, bound_by, status)
    VALUES (p_dolphin_bm_asset_id, p_organization_id, p_admin_user_id, 'active');
    
    bound_assets_count := bound_assets_count + 1;

    -- Step 3: Find and bind all associated ad accounts
    FOR ad_account_asset IN
        SELECT *
        FROM public.dolphin_assets da
        WHERE da.asset_type = 'ad_account'
          AND da.asset_metadata->>'business_manager_id' = v_dolphin_bm_id_text
          -- Ensure we only grab unbound ad accounts
          AND NOT EXISTS (
              SELECT 1 FROM public.client_asset_bindings cab
              WHERE cab.asset_id = da.asset_id
              AND cab.status = 'active'
          )
    LOOP
        -- Bind the ad account asset (no local record creation)
        INSERT INTO public.client_asset_bindings (asset_id, organization_id, bound_by, status)
        VALUES (ad_account_asset.asset_id, p_organization_id, p_admin_user_id, 'active');
        
        bound_assets_count := bound_assets_count + 1;
    END LOOP;

    -- Step 4: Update the original application status to 'fulfilled'
    UPDATE public.bm_applications
    SET status = 'fulfilled'
    WHERE application_id = p_application_id;

    -- Return success with binding details
    RETURN jsonb_build_object(
        'success', true, 
        'assets_bound', bound_assets_count,
        'business_manager_id', v_dolphin_bm_id_text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new function to get client business managers using only dolphin_assets
CREATE OR REPLACE FUNCTION public.get_client_business_managers_consolidated(p_organization_id UUID)
RETURNS TABLE (
    asset_id UUID,
    dolphin_asset_id TEXT,
    name TEXT,
    status TEXT,
    bound_at TIMESTAMPTZ,
    ad_account_count BIGINT,
    binding_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        da.asset_id,
        da.dolphin_asset_id,
        da.name,
        da.status,
        cab.bound_at,
        -- Count associated ad accounts from bindings
        (SELECT COUNT(*) 
         FROM public.client_asset_bindings cab_sub
         JOIN public.dolphin_assets da_sub ON cab_sub.asset_id = da_sub.asset_id
         WHERE cab_sub.organization_id = p_organization_id
         AND cab_sub.status = 'active'
         AND da_sub.asset_type = 'ad_account'
         AND da_sub.asset_metadata->>'business_manager_id' = da.dolphin_asset_id) as ad_account_count,
        cab.binding_id
    FROM
        public.client_asset_bindings cab
    JOIN
        public.dolphin_assets da ON cab.asset_id = da.asset_id
    WHERE
        cab.organization_id = p_organization_id
        AND cab.status = 'active'
        AND da.asset_type = 'business_manager'
    ORDER BY
        cab.bound_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new function to get client ad accounts using only dolphin_assets
CREATE OR REPLACE FUNCTION public.get_client_ad_accounts_consolidated(
    p_organization_id UUID,
    p_business_manager_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    asset_id UUID,
    dolphin_asset_id TEXT,
    name TEXT,
    status TEXT,
    bound_at TIMESTAMPTZ,
    asset_metadata JSONB,
    binding_id UUID,
    business_manager_id TEXT,
    business_manager_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        da.asset_id,
        da.dolphin_asset_id,
        da.name,
        da.status,
        cab.bound_at,
        da.asset_metadata,
        cab.binding_id,
        da.asset_metadata->>'business_manager_id' as business_manager_id,
        bm_da.name as business_manager_name
    FROM
        public.client_asset_bindings cab
    JOIN
        public.dolphin_assets da ON cab.asset_id = da.asset_id
    LEFT JOIN
        public.dolphin_assets bm_da ON bm_da.dolphin_asset_id = da.asset_metadata->>'business_manager_id'
        AND bm_da.asset_type = 'business_manager'
    WHERE
        cab.organization_id = p_organization_id
        AND cab.status = 'active'
        AND da.asset_type = 'ad_account'
        AND (p_business_manager_id IS NULL OR da.asset_metadata->>'business_manager_id' = p_business_manager_id)
    ORDER BY
        cab.bound_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove the bm_id column dependency from client_asset_bindings
-- Note: We'll keep the column for now to avoid breaking existing data,
-- but new bindings won't use it
ALTER TABLE public.client_asset_bindings 
ALTER COLUMN bm_id DROP NOT NULL; 
-- Fix column references in database functions
-- The functions are using old column names (a.id) instead of semantic IDs (a.asset_id)

-- Fix get_user_organizations function
CREATE OR REPLACE FUNCTION public.get_user_organizations(
    p_user_id UUID
)
RETURNS TABLE(
    organization_id UUID,
    name TEXT,
    created_at TIMESTAMPTZ,
    owner_id UUID,
    balance_cents INTEGER,
    reserved_balance_cents INTEGER,
    business_manager_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH user_orgs AS (
        -- Get organizations user owns or is member of
        SELECT DISTINCT o.organization_id, o.name, o.created_at, o.owner_id
        FROM public.organizations o
        LEFT JOIN public.organization_members om ON o.organization_id = om.organization_id
        WHERE o.owner_id = p_user_id 
           OR om.user_id = p_user_id
    ),
    org_wallets AS (
        -- Get wallet balances
        SELECT 
            w.organization_id,
            COALESCE(w.balance_cents, 0) as balance_cents,
            COALESCE(w.reserved_balance_cents, 0) as reserved_balance_cents
        FROM public.wallets w
        WHERE w.organization_id IN (SELECT uo.organization_id FROM user_orgs uo)
    ),
    bm_counts AS (
        -- Get business manager counts - FIXED: use semantic IDs
        SELECT 
            ab.organization_id,
            COUNT(*)::INTEGER as business_manager_count
        FROM public.asset_binding ab
        INNER JOIN public.asset a ON ab.asset_id = a.asset_id  -- FIXED: use asset_id instead of id
        WHERE ab.organization_id IN (SELECT uo.organization_id FROM user_orgs uo)
        AND ab.status = 'active'
        AND a.type = 'business_manager'
        AND a.status = 'active'
        GROUP BY ab.organization_id
    )
    SELECT 
        uo.organization_id,
        uo.name,
        uo.created_at,
        uo.owner_id,
        COALESCE(ow.balance_cents, 0) as balance_cents,
        COALESCE(ow.reserved_balance_cents, 0) as reserved_balance_cents,
        COALESCE(bc.business_manager_count, 0) as business_manager_count
    FROM user_orgs uo
    LEFT JOIN org_wallets ow ON uo.organization_id = ow.organization_id
    LEFT JOIN bm_counts bc ON uo.organization_id = bc.organization_id
    ORDER BY uo.created_at DESC;
END;
$$;

-- Fix get_business_manager_counts function
CREATE OR REPLACE FUNCTION public.get_business_manager_counts(
    p_organization_ids UUID[]
)
RETURNS TABLE(
    organization_id UUID,
    business_manager_count INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ab.organization_id,
        COUNT(*)::INTEGER as business_manager_count
    FROM public.asset_binding ab
    INNER JOIN public.asset a ON ab.asset_id = a.asset_id  -- FIXED: use asset_id instead of id
    WHERE ab.organization_id = ANY(p_organization_ids)
    AND ab.status = 'active'
    AND a.type = 'business_manager'
    AND a.status = 'active'
    GROUP BY ab.organization_id;
END;
$$;

-- Fix get_organization_assets_optimized function
CREATE OR REPLACE FUNCTION public.get_organization_assets_optimized(
    p_organization_id UUID,
    p_asset_type TEXT DEFAULT NULL
)
RETURNS TABLE(
    asset_id UUID,
    type TEXT,
    dolphin_id TEXT,
    name TEXT,
    status TEXT,
    metadata JSONB,
    binding_id UUID,
    bound_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.asset_id,  -- FIXED: use asset_id instead of id
        a.type,
        a.dolphin_id,
        a.name,
        a.status,
        a.metadata,
        ab.binding_id,  -- FIXED: use binding_id instead of id
        ab.bound_at,
        a.last_synced_at
    FROM public.asset a
    INNER JOIN public.asset_binding ab ON a.asset_id = ab.asset_id  -- FIXED: use semantic IDs
    WHERE ab.organization_id = p_organization_id
    AND ab.status = 'active'
    AND (p_asset_type IS NULL OR a.type = p_asset_type)
    AND a.status = 'active'
    ORDER BY a.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_organizations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_manager_counts(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_assets_optimized(UUID, TEXT) TO authenticated; 
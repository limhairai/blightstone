-- Performance Optimizations Migration
-- Adds indexes and optimizations to improve API response times

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_organizations_owner_user_lookup 
ON public.organizations(owner_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_user_org_lookup 
ON public.organization_members(user_id, organization_id);

-- Add index for profiles table primary key (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_profile_id 
ON public.profiles(profile_id);

-- Add composite index for asset binding queries
CREATE INDEX IF NOT EXISTS idx_asset_binding_org_type_status 
ON public.asset_binding(organization_id, status) 
WHERE status = 'active';

-- Add index for asset type and status queries
CREATE INDEX IF NOT EXISTS idx_asset_type_status 
ON public.asset(type, status) 
WHERE status = 'active';

-- Add partial index for active business managers
CREATE INDEX IF NOT EXISTS idx_asset_active_business_managers 
ON public.asset(type) 
WHERE type = 'business_manager' AND status = 'active';

-- Add reserved balance column to wallets if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wallets' 
                   AND column_name = 'reserved_balance_cents') THEN
        ALTER TABLE public.wallets 
        ADD COLUMN reserved_balance_cents INTEGER DEFAULT 0;
    END IF;
END $$;

-- Optimize the get_organization_assets function for better performance
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
        a.id as asset_id,
        a.type,
        a.dolphin_id,
        a.name,
        a.status,
        a.metadata,
        ab.id as binding_id,
        ab.bound_at,
        a.last_synced_at
    FROM public.asset a
    INNER JOIN public.asset_binding ab ON a.id = ab.asset_id
    WHERE ab.organization_id = p_organization_id
    AND ab.status = 'active'
    AND (p_asset_type IS NULL OR a.type = p_asset_type)
    AND a.status = 'active'
    ORDER BY a.created_at DESC;
END;
$$;

-- Create a faster business manager count function
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
    INNER JOIN public.asset a ON ab.asset_id = a.id
    WHERE ab.organization_id = ANY(p_organization_ids)
    AND ab.status = 'active'
    AND a.type = 'business_manager'
    AND a.status = 'active'
    GROUP BY ab.organization_id;
END;
$$;

-- Add function to get user organizations efficiently
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
        -- Get business manager counts
        SELECT 
            ab.organization_id,
            COUNT(*)::INTEGER as business_manager_count
        FROM public.asset_binding ab
        INNER JOIN public.asset a ON ab.asset_id = a.id
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

-- Add function comments for documentation
COMMENT ON FUNCTION public.get_organization_assets_optimized IS 'Optimized function to get organization assets with better performance';
COMMENT ON FUNCTION public.get_business_manager_counts IS 'Efficiently get business manager counts for multiple organizations';
COMMENT ON FUNCTION public.get_user_organizations IS 'Get all organizations for a user with balances and counts in one query';

-- Update table statistics to help query planner
ANALYZE public.organizations;
ANALYZE public.profiles; 
ANALYZE public.organization_members;
ANALYZE public.asset;
ANALYZE public.asset_binding;
ANALYZE public.wallets; 
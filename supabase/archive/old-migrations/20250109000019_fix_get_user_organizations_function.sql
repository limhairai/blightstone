-- Fix get_user_organizations function
-- This ensures the function is created properly

-- Drop the function if it exists and recreate it
DROP FUNCTION IF EXISTS public.get_user_organizations(UUID);

-- Create the function to get user organizations efficiently
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

-- Add function comment
COMMENT ON FUNCTION public.get_user_organizations IS 'Get all organizations for a user with balances and counts in one query';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_organizations(UUID) TO authenticated; 
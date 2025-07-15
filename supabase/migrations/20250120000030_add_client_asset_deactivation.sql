-- Add client-controlled deactivation to asset bindings
-- This allows clients to deactivate their own assets to free up pool slots

-- Add is_active column to asset_binding table
ALTER TABLE public.asset_binding 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Add index for performance on common queries
CREATE INDEX idx_asset_binding_active_status 
ON public.asset_binding(organization_id, status, is_active);

-- Update the check_plan_limits function to only count active assets
CREATE OR REPLACE FUNCTION public.check_plan_limits(org_id UUID, limit_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    org_record RECORD;
    plan_record RECORD;
    current_count INTEGER;
    pending_count INTEGER;
    total_count INTEGER;
BEGIN
    -- Get organization data
    SELECT * INTO org_record
    FROM organizations
    WHERE organization_id = org_id;
    
    IF org_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get plan data using semantic ID
    SELECT * INTO plan_record
    FROM plans
    WHERE plan_id = org_record.plan_id;
    
    IF plan_record IS NULL THEN
        -- If no plan found, default to free plan limits
        CASE limit_type
            WHEN 'businesses' THEN
                RETURN FALSE; -- Free plan allows 0 business managers
            WHEN 'ad_accounts' THEN
                RETURN FALSE; -- Free plan allows 0 ad accounts
            WHEN 'promotion_urls' THEN
                RETURN FALSE; -- Free plan allows 0 promotion URLs
            WHEN 'team_members' THEN
                SELECT COUNT(*) INTO current_count 
                FROM organization_members 
                WHERE organization_id = org_id;
                RETURN current_count < 1; -- Free plan allows 1 team member
            ELSE
                RETURN FALSE;
        END CASE;
    END IF;
    
    -- Check specific limit type
    CASE limit_type
        WHEN 'team_members' THEN
            SELECT COUNT(*) INTO current_count 
            FROM organization_members 
            WHERE organization_id = org_id;
            
            RETURN (plan_record.max_team_members = -1 OR current_count < plan_record.max_team_members);
            
        WHEN 'businesses' THEN
            -- Count active business managers (bound AND client-activated)
            SELECT COUNT(*) INTO current_count 
            FROM asset_binding ab
            JOIN asset a ON ab.asset_id = a.asset_id
            WHERE ab.organization_id = org_id 
            AND a.type = 'business_manager'
            AND ab.status = 'active'
            AND ab.is_active = true;  -- Only count client-activated assets
            
            -- Count pending business manager applications
            SELECT COUNT(*) INTO pending_count
            FROM application
            WHERE organization_id = org_id
            AND request_type = 'new_business_manager'
            AND status IN ('pending', 'processing');
            
            total_count := current_count + pending_count;
            RETURN (plan_record.max_businesses = -1 OR total_count < plan_record.max_businesses);
            
        WHEN 'ad_accounts' THEN
            -- Count active ad accounts (bound AND client-activated)
            SELECT COUNT(*) INTO current_count 
            FROM asset_binding ab
            JOIN asset a ON ab.asset_id = a.asset_id
            WHERE ab.organization_id = org_id 
            AND a.type = 'ad_account'
            AND ab.status = 'active'
            AND ab.is_active = true;  -- Only count client-activated assets
            
            -- Count pending ad account applications
            SELECT COUNT(*) INTO pending_count
            FROM application
            WHERE organization_id = org_id
            AND request_type = 'additional_accounts'
            AND status IN ('pending', 'processing');
            
            total_count := current_count + pending_count;
            RETURN (plan_record.max_ad_accounts = -1 OR total_count < plan_record.max_ad_accounts);
            
        WHEN 'promotion_urls' THEN
            -- Count active promotion URLs (if we add this feature)
            SELECT COUNT(*) INTO current_count 
            FROM asset_binding ab
            JOIN asset a ON ab.asset_id = a.asset_id
            WHERE ab.organization_id = org_id 
            AND a.type = 'promotion_url'
            AND ab.status = 'active'
            AND ab.is_active = true;
            
            RETURN (plan_record.max_promotion_urls = -1 OR current_count < plan_record.max_promotion_urls);
            
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to explain the new field
COMMENT ON COLUMN public.asset_binding.is_active IS 'Client-controlled activation status. When false, asset is deactivated by client and does not count toward plan limits.';

-- Create function to toggle asset activation status
CREATE OR REPLACE FUNCTION public.toggle_asset_activation(
    p_asset_id UUID,
    p_organization_id UUID,
    p_is_active BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
    binding_exists BOOLEAN;
BEGIN
    -- Check if the binding exists and belongs to the organization
    SELECT EXISTS(
        SELECT 1 FROM asset_binding 
        WHERE asset_id = p_asset_id 
        AND organization_id = p_organization_id 
        AND status = 'active'
    ) INTO binding_exists;
    
    IF NOT binding_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Update the activation status
    UPDATE asset_binding 
    SET is_active = p_is_active,
        updated_at = NOW()
    WHERE asset_id = p_asset_id 
    AND organization_id = p_organization_id 
    AND status = 'active';
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.toggle_asset_activation(UUID, UUID, BOOLEAN) IS 'Toggle asset activation status for client-controlled deactivation. Returns true if successful.';

-- Update get_organization_assets function to include is_active field
-- Drop the existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS public.get_organization_assets(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.get_organization_assets(
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
    bound_at TIMESTAMPTZ,
    binding_id UUID,
    last_synced_at TIMESTAMPTZ,
    is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Simplified version - service role bypasses RLS anyway
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
        a.last_synced_at,
        ab.is_active
    FROM
        public.asset_binding ab
    JOIN
        public.asset a ON ab.asset_id = a.asset_id
    WHERE
        ab.organization_id = p_organization_id
        AND ab.status = 'active'
        AND (p_asset_type IS NULL OR a.type = p_asset_type)
    ORDER BY
        ab.bound_at DESC;
END;
$$; 
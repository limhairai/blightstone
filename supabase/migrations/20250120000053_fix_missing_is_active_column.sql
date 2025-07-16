-- Fix missing is_active column in asset_binding table
-- This column is referenced by check_plan_limits function but doesn't exist

-- Add is_active column if it doesn't exist
ALTER TABLE public.asset_binding 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add index for performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_asset_binding_active_status 
ON public.asset_binding(organization_id, status, is_active);

-- Update the check_plan_limits function to handle cases where is_active might not exist
-- This is a safety measure for backwards compatibility
CREATE OR REPLACE FUNCTION public.check_plan_limits(org_id UUID, limit_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    org_record RECORD;
    plan_record RECORD;
    current_count INTEGER;
    pending_count INTEGER;
    total_count INTEGER;
    has_is_active_column BOOLEAN;
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
            WHEN 'pixels' THEN
                RETURN FALSE; -- Free plan allows 0 pixels
            WHEN 'domains' THEN
                RETURN FALSE; -- Free plan allows 0 domains
            WHEN 'team_members' THEN
                SELECT COUNT(*) INTO current_count 
                FROM organization_members 
                WHERE organization_id = org_id;
                RETURN current_count < 1; -- Free plan allows 1 team member
            ELSE
                RETURN FALSE;
        END CASE;
    END IF;
    
    -- Check if is_active column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'asset_binding' 
        AND column_name = 'is_active'
    ) INTO has_is_active_column;
    
    -- Check specific limit type
    CASE limit_type
        WHEN 'businesses' THEN
            -- Count active business managers
            IF has_is_active_column THEN
                SELECT COUNT(*) INTO current_count 
                FROM asset_binding ab
                JOIN asset a ON ab.asset_id = a.asset_id
                WHERE ab.organization_id = org_id 
                AND a.type = 'business_manager'
                AND ab.status = 'active'
                AND ab.is_active = true;
            ELSE
                SELECT COUNT(*) INTO current_count 
                FROM asset_binding ab
                JOIN asset a ON ab.asset_id = a.asset_id
                WHERE ab.organization_id = org_id 
                AND a.type = 'business_manager'
                AND ab.status = 'active';
            END IF;
            
            -- Count pending business manager applications
            SELECT COUNT(*) INTO pending_count
            FROM application
            WHERE organization_id = org_id
            AND request_type = 'new_business_manager'
            AND status IN ('pending', 'processing');
            
            total_count := current_count + pending_count;
            RETURN (plan_record.max_businesses = -1 OR total_count < plan_record.max_businesses);
            
        WHEN 'ad_accounts' THEN
            -- Count active ad accounts
            IF has_is_active_column THEN
                SELECT COUNT(*) INTO current_count 
                FROM asset_binding ab
                JOIN asset a ON ab.asset_id = a.asset_id
                WHERE ab.organization_id = org_id 
                AND a.type = 'ad_account'
                AND ab.status = 'active'
                AND ab.is_active = true;
            ELSE
                SELECT COUNT(*) INTO current_count 
                FROM asset_binding ab
                JOIN asset a ON ab.asset_id = a.asset_id
                WHERE ab.organization_id = org_id 
                AND a.type = 'ad_account'
                AND ab.status = 'active';
            END IF;
            
            -- Count pending ad account applications
            SELECT COUNT(*) INTO pending_count
            FROM application
            WHERE organization_id = org_id
            AND request_type = 'additional_accounts'
            AND status IN ('pending', 'processing');
            
            total_count := current_count + pending_count;
            RETURN (plan_record.max_ad_accounts = -1 OR total_count < plan_record.max_ad_accounts);
            
        WHEN 'pixels' THEN
            -- Count active pixels
            IF has_is_active_column THEN
                SELECT COUNT(*) INTO current_count 
                FROM asset_binding ab
                JOIN asset a ON ab.asset_id = a.asset_id
                WHERE ab.organization_id = org_id 
                AND a.type = 'pixel'
                AND ab.status = 'active'
                AND ab.is_active = true;
            ELSE
                SELECT COUNT(*) INTO current_count 
                FROM asset_binding ab
                JOIN asset a ON ab.asset_id = a.asset_id
                WHERE ab.organization_id = org_id 
                AND a.type = 'pixel'
                AND ab.status = 'active';
            END IF;
            
            -- Count pending pixel applications
            SELECT COUNT(*) INTO pending_count
            FROM application
            WHERE organization_id = org_id
            AND request_type = 'pixel_connection'
            AND status IN ('pending', 'processing');
            
            total_count := current_count + pending_count;
            RETURN (plan_record.max_pixels = -1 OR total_count < plan_record.max_pixels);
            
        WHEN 'team_members' THEN
            SELECT COUNT(*) INTO current_count 
            FROM organization_members 
            WHERE organization_id = org_id;
            
            RETURN (plan_record.max_team_members = -1 OR current_count < plan_record.max_team_members);
            
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function again
DO $$
DECLARE
    org_id UUID;
    can_add_bm BOOLEAN;
    current_bm_count INTEGER;
    pending_bm_count INTEGER;
BEGIN
    -- Get the first organization
    SELECT organization_id INTO org_id FROM organizations LIMIT 1;
    
    IF org_id IS NOT NULL THEN
        -- Test the function
        SELECT check_plan_limits(org_id, 'businesses') INTO can_add_bm;
        
        -- Count current business managers
        SELECT COUNT(*) INTO current_bm_count
        FROM asset_binding ab
        JOIN asset a ON ab.asset_id = a.asset_id
        WHERE ab.organization_id = org_id 
        AND a.type = 'business_manager'
        AND ab.status = 'active';
        
        -- Count pending applications
        SELECT COUNT(*) INTO pending_bm_count
        FROM application
        WHERE organization_id = org_id
        AND request_type = 'new_business_manager'
        AND status IN ('pending', 'processing');
        
        RAISE NOTICE 'Fixed test org (%): Current BM: %, Pending BM: %, Can add BM: %', 
            org_id, current_bm_count, pending_bm_count, can_add_bm;
    END IF;
END $$; 
-- Fix missing ad_accounts case in check_plan_limits function
-- The function was missing the WHEN 'ad_accounts' case, causing it to always return FALSE

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
    
    -- Check specific limit type
    CASE limit_type
        WHEN 'businesses' THEN
            -- Count active business managers (bound AND client-activated)
            SELECT COUNT(*) INTO current_count 
            FROM asset_binding ab
            JOIN asset a ON ab.asset_id = a.asset_id
            WHERE ab.organization_id = org_id 
            AND a.type = 'business_manager'
            AND ab.status = 'active'
            AND ab.is_active = true;
            
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
            AND ab.is_active = true;
            
            -- Count pending ad account applications
            SELECT COUNT(*) INTO pending_count
            FROM application
            WHERE organization_id = org_id
            AND request_type = 'additional_accounts'
            AND status IN ('pending', 'processing');
            
            total_count := current_count + pending_count;
            RETURN (plan_record.max_ad_accounts = -1 OR total_count < plan_record.max_ad_accounts);
            
        WHEN 'pixels' THEN
            -- Count active pixels (bound AND client-activated)
            SELECT COUNT(*) INTO current_count 
            FROM asset_binding ab
            JOIN asset a ON ab.asset_id = a.asset_id
            WHERE ab.organization_id = org_id 
            AND a.type = 'pixel'
            AND ab.status = 'active'
            AND ab.is_active = true;
            
            -- Count pending pixel applications
            SELECT COUNT(*) INTO pending_count
            FROM application
            WHERE organization_id = org_id
            AND request_type = 'pixel_connection'
            AND status IN ('pending', 'processing');
            
            total_count := current_count + pending_count;
            RETURN (plan_record.max_pixels = -1 OR total_count < plan_record.max_pixels);
            
        WHEN 'domains' THEN
            -- Domains are handled per-BM, not organization-wide
            -- This is a fallback for organization-level domain checking
            SELECT COUNT(*) INTO current_count 
            FROM bm_domains
            WHERE organization_id = org_id 
            AND is_active = true;
            
            -- For now, return true as domain limits are enforced per-BM
            RETURN TRUE;
            
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

-- Test the function with debug output
DO $$
DECLARE
    test_org_id UUID;
    can_add_bm BOOLEAN;
    can_add_accounts BOOLEAN;
    org_plan TEXT;
BEGIN
    -- Get a test organization
    SELECT organization_id, plan_id INTO test_org_id, org_plan
    FROM organizations 
    WHERE plan_id != 'free'
    LIMIT 1;
    
    IF test_org_id IS NOT NULL THEN
        -- Test business manager limits
        SELECT check_plan_limits(test_org_id, 'businesses') INTO can_add_bm;
        
        -- Test ad account limits  
        SELECT check_plan_limits(test_org_id, 'ad_accounts') INTO can_add_accounts;
        
        RAISE NOTICE 'Test org (%) on % plan: Can add BM: %, Can add accounts: %', 
            test_org_id, org_plan, can_add_bm, can_add_accounts;
    ELSE
        RAISE NOTICE 'No test organization found';
    END IF;
END $$; 
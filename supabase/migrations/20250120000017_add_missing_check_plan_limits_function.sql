-- Add missing check_plan_limits function
-- This function is called by the frontend applications endpoint to verify plan limits

CREATE OR REPLACE FUNCTION public.check_plan_limits(org_id UUID, limit_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    org_record RECORD;
    plan_record RECORD;
    current_count INTEGER;
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
            SELECT COUNT(*) INTO current_count 
            FROM asset_binding ab
            JOIN asset a ON ab.asset_id = a.asset_id
            WHERE ab.organization_id = org_id 
            AND a.type = 'business_manager'
            AND ab.status = 'active';
            
            RETURN (plan_record.max_businesses = -1 OR current_count < plan_record.max_businesses);
            
        WHEN 'ad_accounts' THEN
            SELECT COUNT(*) INTO current_count 
            FROM asset_binding ab
            JOIN asset a ON ab.asset_id = a.asset_id
            WHERE ab.organization_id = org_id 
            AND a.type = 'ad_account'
            AND ab.status = 'active';
            
            RETURN (plan_record.max_ad_accounts = -1 OR current_count < plan_record.max_ad_accounts);
            
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_plan_limits(UUID, TEXT) IS 'Checks if organization can perform action based on plan limits. Uses semantic IDs for assets and plans.'; 
-- Debug migration to understand why check_plan_limits is failing
-- This will help us understand what's happening with the function

-- First, let's see what organizations exist
DO $$
DECLARE
    org_record RECORD;
BEGIN
    RAISE NOTICE 'Organizations in database:';
    FOR org_record IN 
        SELECT organization_id, name, plan_id 
        FROM organizations 
        LIMIT 5
    LOOP
        RAISE NOTICE 'Org: % (%) - Plan: %', org_record.name, org_record.organization_id, org_record.plan_id;
    END LOOP;
END $$;

-- Test check_plan_limits function with detailed debugging
CREATE OR REPLACE FUNCTION public.debug_check_plan_limits(org_id UUID, limit_type TEXT)
RETURNS JSONB AS $$
DECLARE
    org_record RECORD;
    plan_record RECORD;
    current_count INTEGER;
    pending_count INTEGER;
    total_count INTEGER;
    result BOOLEAN;
    debug_info JSONB;
BEGIN
    -- Get organization data
    SELECT * INTO org_record
    FROM organizations
    WHERE organization_id = org_id;
    
    IF org_record IS NULL THEN
        RETURN jsonb_build_object(
            'result', false,
            'error', 'Organization not found',
            'org_id', org_id
        );
    END IF;
    
    -- Get plan data using semantic ID
    SELECT * INTO plan_record
    FROM plans
    WHERE plan_id = org_record.plan_id;
    
    IF plan_record IS NULL THEN
        RETURN jsonb_build_object(
            'result', false,
            'error', 'Plan not found',
            'org_id', org_id,
            'plan_id', org_record.plan_id
        );
    END IF;
    
    -- Check specific limit type
    CASE limit_type
        WHEN 'businesses' THEN
            -- Count active business managers
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
            result := (plan_record.max_businesses = -1 OR total_count < plan_record.max_businesses);
            
            RETURN jsonb_build_object(
                'result', result,
                'limit_type', limit_type,
                'org_id', org_id,
                'plan_id', org_record.plan_id,
                'max_businesses', plan_record.max_businesses,
                'current_count', current_count,
                'pending_count', pending_count,
                'total_count', total_count,
                'calculation', format('%s = -1 OR %s < %s', plan_record.max_businesses, total_count, plan_record.max_businesses)
            );
            
        ELSE
            RETURN jsonb_build_object(
                'result', false,
                'error', 'Unsupported limit type',
                'limit_type', limit_type
            );
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function if there are any organizations
DO $$
DECLARE
    test_org_id UUID;
    debug_result JSONB;
BEGIN
    -- Get first organization
    SELECT organization_id INTO test_org_id
    FROM organizations 
    LIMIT 1;
    
    IF test_org_id IS NOT NULL THEN
        -- Test business manager limits with debug info
        SELECT debug_check_plan_limits(test_org_id, 'businesses') INTO debug_result;
        RAISE NOTICE 'Debug result: %', debug_result;
    ELSE
        RAISE NOTICE 'No organizations found in database';
    END IF;
END $$; 
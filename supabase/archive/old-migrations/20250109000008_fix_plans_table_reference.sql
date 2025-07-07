-- Fix the check_organization_subscription_status function to use plan_id instead of id
-- This fixes the "column id does not exist" error in topup request creation

CREATE OR REPLACE FUNCTION public.check_organization_subscription_status(org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    org_record RECORD;
    plan_record RECORD;
BEGIN
    -- Get organization data
    SELECT * INTO org_record
    FROM organizations
    WHERE organization_id = org_id;
    
    -- If no organization found, return frozen
    IF org_record IS NULL THEN
        RETURN 'frozen';
    END IF;
    
    -- If no plan_id, assign free plan and return free status
    IF org_record.plan_id IS NULL THEN
        -- Auto-assign free plan for new users
        UPDATE organizations 
        SET plan_id = 'free', updated_at = NOW()
        WHERE organization_id = org_id;
        
        RETURN 'free';
    END IF;
    
    -- Check if plan exists - FIX: Use plan_id instead of id
    SELECT * INTO plan_record
    FROM plans
    WHERE plan_id = org_record.plan_id;
    
    -- If plan doesn't exist, freeze the organization
    IF plan_record IS NULL THEN
        RETURN 'frozen';
    END IF;
    
    -- If on free plan, return free status
    IF org_record.plan_id = 'free' THEN
        RETURN 'free';
    END IF;
    
    -- Return current subscription status or active if none set
    RETURN COALESCE(org_record.subscription_status, 'active');
END;
$$;

COMMENT ON FUNCTION public.check_organization_subscription_status(org_id UUID) IS 'Returns subscription status: active, free, frozen, etc. - Fixed to use plan_id'; 
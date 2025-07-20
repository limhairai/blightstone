-- Add pixel limits to plans table
-- This enables pixel limiting based on subscription plan

ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS max_pixels INTEGER DEFAULT 0;

-- Update existing plans with pixel limits
UPDATE public.plans SET max_pixels = 0 WHERE plan_id = 'free';        -- No pixels for free plan
UPDATE public.plans SET max_pixels = 3 WHERE plan_id = 'starter';     -- 3 pixels for starter
UPDATE public.plans SET max_pixels = 10 WHERE plan_id = 'growth';     -- 10 pixels for growth
UPDATE public.plans SET max_pixels = 25 WHERE plan_id = 'scale';      -- 25 pixels for scale
UPDATE public.plans SET max_pixels = -1 WHERE plan_id = 'enterprise'; -- Unlimited pixels for enterprise

-- Update check_plan_limits function to include pixel limits
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
            WHEN 'pixels' THEN
                RETURN FALSE; -- Free plan allows 0 pixels
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
            
        WHEN 'pixels' THEN
            -- Count active pixels (bound AND client-activated)
            SELECT COUNT(*) INTO current_count 
            FROM asset_binding ab
            JOIN asset a ON ab.asset_id = a.asset_id
            WHERE ab.organization_id = org_id 
            AND a.type = 'pixel'
            AND ab.status = 'active'
            AND ab.is_active = true;  -- Only count client-activated assets
            
            -- Count pending pixel applications
            SELECT COUNT(*) INTO pending_count
            FROM application
            WHERE organization_id = org_id
            AND request_type = 'pixel_connection'
            AND status IN ('pending', 'processing');
            
            total_count := current_count + pending_count;
            RETURN (plan_record.max_pixels = -1 OR total_count < plan_record.max_pixels);
            
        WHEN 'promotion_urls' THEN
            -- Count active promotion URLs
            SELECT COUNT(*) INTO current_count 
            FROM promotion_urls 
            WHERE organization_id = org_id 
            AND is_active = true;
            
            RETURN (plan_record.max_promotion_urls = -1 OR current_count < plan_record.max_promotion_urls);
            
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the updates
DO $$
DECLARE
    plan_record RECORD;
BEGIN
    RAISE NOTICE 'Pixel limits by plan:';
    FOR plan_record IN 
        SELECT plan_id, name, max_pixels 
        FROM plans 
        WHERE plan_id IN ('free', 'starter', 'growth', 'scale', 'enterprise')
        ORDER BY monthly_subscription_fee_cents
    LOOP
        RAISE NOTICE '% (%): % pixels', plan_record.name, plan_record.plan_id, 
            CASE WHEN plan_record.max_pixels = -1 THEN 'unlimited' ELSE plan_record.max_pixels::TEXT END;
    END LOOP;
END $$; 
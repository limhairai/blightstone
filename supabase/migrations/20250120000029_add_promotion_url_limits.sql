-- Add promotion URL limits to plans table
-- This enables promotion URL limiting based on subscription plan
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS max_promotion_urls INTEGER DEFAULT 1;

-- Update existing plans with promotion URL limits
UPDATE public.plans SET max_promotion_urls = 1 WHERE plan_id = 'starter';   -- 1 promotion URL
UPDATE public.plans SET max_promotion_urls = 3 WHERE plan_id = 'growth';    -- 3 promotion URLs
UPDATE public.plans SET max_promotion_urls = 10 WHERE plan_id = 'scale';    -- 10 promotion URLs
UPDATE public.plans SET max_promotion_urls = -1 WHERE plan_id = 'enterprise'; -- Unlimited
UPDATE public.plans SET max_promotion_urls = 0 WHERE plan_id = 'free';      -- No promotion URLs

-- Create promotion_urls table to track unique promotion URLs per organization
CREATE TABLE IF NOT EXISTS public.promotion_urls (
    url_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique URLs per organization
    UNIQUE(organization_id, url)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_promotion_urls_organization_id ON public.promotion_urls(organization_id);
CREATE INDEX IF NOT EXISTS idx_promotion_urls_active ON public.promotion_urls(is_active);

-- Add RLS for promotion_urls table
ALTER TABLE public.promotion_urls ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view promotion URLs from their own organization
CREATE POLICY "Users can view their organization's promotion URLs"
    ON public.promotion_urls
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Users can manage promotion URLs for their own organization
CREATE POLICY "Users can manage their organization's promotion URLs"
    ON public.promotion_urls
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Admins can manage all promotion URLs
CREATE POLICY "Admins can manage all promotion URLs"
    ON public.promotion_urls
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- Update check_plan_limits function to include promotion URL limits
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
            -- Count active business managers
            SELECT COUNT(*) INTO current_count 
            FROM asset_binding ab
            JOIN asset a ON ab.asset_id = a.asset_id
            WHERE ab.organization_id = org_id 
            AND a.type = 'business_manager'
            AND ab.status = 'active';
            
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
            SELECT COUNT(*) INTO current_count 
            FROM asset_binding ab
            JOIN asset a ON ab.asset_id = a.asset_id
            WHERE ab.organization_id = org_id 
            AND a.type = 'ad_account'
            AND ab.status = 'active';
            
            -- Count pending ad account applications
            SELECT COUNT(*) INTO pending_count
            FROM application
            WHERE organization_id = org_id
            AND request_type = 'additional_accounts'
            AND status IN ('pending', 'processing');
            
            total_count := current_count + pending_count;
            RETURN (plan_record.max_ad_accounts = -1 OR total_count < plan_record.max_ad_accounts);
            
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

-- Create function to get promotion URL limit for an organization
CREATE OR REPLACE FUNCTION public.get_promotion_url_limit(org_id UUID)
RETURNS INTEGER AS $$
DECLARE
    org_record RECORD;
    plan_record RECORD;
BEGIN
    -- Get organization data
    SELECT * INTO org_record
    FROM organizations
    WHERE organization_id = org_id;
    
    IF org_record IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Get plan data
    SELECT * INTO plan_record
    FROM plans
    WHERE plan_id = org_record.plan_id;
    
    IF plan_record IS NULL THEN
        RETURN 0; -- Free plan default
    END IF;
    
    RETURN COALESCE(plan_record.max_promotion_urls, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotion_urls TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_promotion_url_limit(UUID) TO authenticated;

-- Verify the changes
DO $$
DECLARE
    starter_limit INTEGER;
    growth_limit INTEGER;
    scale_limit INTEGER;
BEGIN
    SELECT max_promotion_urls INTO starter_limit FROM plans WHERE plan_id = 'starter';
    SELECT max_promotion_urls INTO growth_limit FROM plans WHERE plan_id = 'growth';
    SELECT max_promotion_urls INTO scale_limit FROM plans WHERE plan_id = 'scale';
    
    IF starter_limit != 1 THEN
        RAISE EXCEPTION 'Starter plan should have 1 promotion URL limit, found %', starter_limit;
    END IF;
    
    IF growth_limit != 3 THEN
        RAISE EXCEPTION 'Growth plan should have 3 promotion URL limit, found %', growth_limit;
    END IF;
    
    IF scale_limit != 10 THEN
        RAISE EXCEPTION 'Scale plan should have 10 promotion URL limit, found %', scale_limit;
    END IF;
    
    RAISE NOTICE 'Successfully added promotion URL limits: Starter=1, Growth=3, Scale=10';
END $$; 
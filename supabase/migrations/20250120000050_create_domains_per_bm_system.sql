-- Replace organization-level promotion_urls with domains per BM system
-- This migration implements the proper domain tracking per Business Manager
-- as required by the pricing config (domainsPerBm limits)

-- First, let's create the new domains table for BM-specific domains
CREATE TABLE IF NOT EXISTS public.bm_domains (
    domain_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    bm_asset_id UUID NOT NULL REFERENCES public.asset(asset_id) ON DELETE CASCADE,
    domain_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique domain per BM
    UNIQUE(bm_asset_id, domain_url)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bm_domains_organization_id ON public.bm_domains(organization_id);
CREATE INDEX IF NOT EXISTS idx_bm_domains_bm_asset_id ON public.bm_domains(bm_asset_id);
CREATE INDEX IF NOT EXISTS idx_bm_domains_active ON public.bm_domains(is_active);
CREATE INDEX IF NOT EXISTS idx_bm_domains_org_bm ON public.bm_domains(organization_id, bm_asset_id);

-- Create trigger function to ensure bm_asset_id references a business manager
CREATE OR REPLACE FUNCTION public.validate_bm_asset_type()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the referenced asset is actually a business manager
    IF NOT EXISTS (
        SELECT 1 FROM public.asset 
        WHERE asset_id = NEW.bm_asset_id 
        AND type = 'business_manager'
    ) THEN
        RAISE EXCEPTION 'Referenced asset must be a business manager';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate business manager asset type
CREATE TRIGGER validate_bm_asset_type_trigger
    BEFORE INSERT OR UPDATE ON public.bm_domains
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_bm_asset_type();

-- Add RLS for the new table
ALTER TABLE public.bm_domains ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view domains from their own organization
CREATE POLICY "Users can view their organization's BM domains"
    ON public.bm_domains
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Users can manage domains for their own organization
CREATE POLICY "Users can manage their organization's BM domains"
    ON public.bm_domains
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Admins can manage all domains
CREATE POLICY "Admins can manage all BM domains"
    ON public.bm_domains
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- Create function to get domain count for a specific BM
CREATE OR REPLACE FUNCTION public.get_bm_domain_count(p_bm_asset_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.bm_domains
        WHERE bm_asset_id = p_bm_asset_id
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get domain limit for an organization's plan
CREATE OR REPLACE FUNCTION public.get_domains_per_bm_limit(p_organization_id UUID)
RETURNS INTEGER AS $$
DECLARE
    org_record RECORD;
    plan_limit INTEGER;
BEGIN
    -- Get organization data
    SELECT * INTO org_record
    FROM public.organizations
    WHERE organization_id = p_organization_id;
    
    IF org_record IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Get limit from pricing config based on plan
    -- These limits match the pricing config
    CASE org_record.plan_id
        WHEN 'starter' THEN plan_limit := 2;
        WHEN 'growth' THEN plan_limit := 3;
        WHEN 'scale' THEN plan_limit := 5;
        WHEN 'enterprise' THEN plan_limit := -1; -- Unlimited
        ELSE plan_limit := 0; -- Free plan
    END CASE;
    
    RETURN plan_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if a BM can add more domains
CREATE OR REPLACE FUNCTION public.can_add_domain_to_bm(
    p_bm_asset_id UUID,
    p_organization_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    limit_per_bm INTEGER;
BEGIN
    -- Get current domain count for this BM
    SELECT get_bm_domain_count(p_bm_asset_id) INTO current_count;
    
    -- Get the limit per BM for this organization's plan
    SELECT get_domains_per_bm_limit(p_organization_id) INTO limit_per_bm;
    
    -- -1 means unlimited
    IF limit_per_bm = -1 THEN
        RETURN TRUE;
    END IF;
    
    -- Check if under limit
    RETURN current_count < limit_per_bm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to migrate data from old promotion_urls to new bm_domains
-- This will be used to migrate existing data if needed
CREATE OR REPLACE FUNCTION public.migrate_promotion_urls_to_bm_domains()
RETURNS VOID AS $$
DECLARE
    promo_record RECORD;
    first_bm_id UUID;
BEGIN
    -- For each organization's promotion URLs, assign them to their first BM
    FOR promo_record IN 
        SELECT DISTINCT organization_id 
        FROM public.promotion_urls 
        WHERE is_active = true
    LOOP
        -- Get the first BM for this organization
        SELECT a.asset_id INTO first_bm_id
        FROM public.asset a
        JOIN public.asset_binding ab ON a.asset_id = ab.asset_id
        WHERE ab.organization_id = promo_record.organization_id
        AND a.type = 'business_manager'
        AND ab.status = 'active'
        AND ab.is_active = true
        ORDER BY ab.bound_at
        LIMIT 1;
        
        -- If organization has a BM, migrate their URLs
        IF first_bm_id IS NOT NULL THEN
            INSERT INTO public.bm_domains (organization_id, bm_asset_id, domain_url, is_active)
            SELECT 
                organization_id,
                first_bm_id,
                url,
                is_active
            FROM public.promotion_urls
            WHERE organization_id = promo_record.organization_id
            AND is_active = true
            ON CONFLICT (bm_asset_id, domain_url) DO NOTHING;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration completed: promotion_urls -> bm_domains';
END;
$$ LANGUAGE plpgsql;

-- Update the check_plan_limits function to use the new domain system
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
            
            RETURN (plan_record.max_pixels = -1 OR current_count < plan_record.max_pixels);
            
        WHEN 'domains' THEN
            -- This is a general check - for specific BM domain limits, use can_add_domain_to_bm
            SELECT COUNT(*) INTO current_count 
            FROM bm_domains 
            WHERE organization_id = org_id 
            AND is_active = true;
            
            -- For general domain check, we'll use a reasonable total limit
            -- This is mainly for admin purposes
            RETURN current_count < 100; -- Reasonable total limit
            
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

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bm_domains TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_bm_domain_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_domains_per_bm_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_add_domain_to_bm(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.migrate_promotion_urls_to_bm_domains() TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.bm_domains IS 'Domains tracked per Business Manager, replacing organization-level promotion_urls';
COMMENT ON COLUMN public.bm_domains.bm_asset_id IS 'Reference to the Business Manager asset this domain belongs to';
COMMENT ON COLUMN public.bm_domains.domain_url IS 'The domain/URL associated with this Business Manager';
COMMENT ON FUNCTION public.get_bm_domain_count(UUID) IS 'Returns the count of active domains for a specific Business Manager';
COMMENT ON FUNCTION public.get_domains_per_bm_limit(UUID) IS 'Returns the domain limit per BM based on organization plan';
COMMENT ON FUNCTION public.can_add_domain_to_bm(UUID, UUID) IS 'Checks if a Business Manager can add more domains based on plan limits';

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE 'Created bm_domains system to replace organization-level promotion_urls';
    RAISE NOTICE 'Domain limits per BM: Starter=2, Growth=3, Scale=5, Enterprise=unlimited';
    RAISE NOTICE 'Use migrate_promotion_urls_to_bm_domains() to migrate existing data if needed';
END $$; 
-- Add Pages system for Facebook Pages management
-- Pages are required for ad account applications and have limits per plan

-- Facebook Pages table
CREATE TABLE public.pages (
    page_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    facebook_page_id TEXT NOT NULL, -- Facebook's Page ID
    page_name TEXT NOT NULL,
    page_url TEXT,
    category TEXT,
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'pending')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- Metadata from Facebook API
    followers_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    
    -- Tracking
    added_by UUID REFERENCES auth.users(id),
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique Facebook page per organization
    UNIQUE(organization_id, facebook_page_id)
);

-- Application Pages - which pages are requested in each application
CREATE TABLE public.application_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.application(application_id) ON DELETE CASCADE,
    page_id UUID NOT NULL REFERENCES public.pages(page_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure no duplicate pages per application
    UNIQUE(application_id, page_id)
);

-- Business Manager Pages - which pages are linked to which BMs (after approval)
CREATE TABLE public.bm_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_manager_id UUID NOT NULL, -- References asset_id where type = 'business_manager'
    page_id UUID NOT NULL REFERENCES public.pages(page_id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique page per BM
    UNIQUE(business_manager_id, page_id)
);

-- Add indexes for performance
CREATE INDEX idx_pages_organization_id ON public.pages(organization_id);
CREATE INDEX idx_pages_facebook_page_id ON public.pages(facebook_page_id);
CREATE INDEX idx_pages_status ON public.pages(status);
CREATE INDEX idx_application_pages_application_id ON public.application_pages(application_id);
CREATE INDEX idx_application_pages_page_id ON public.application_pages(page_id);
CREATE INDEX idx_bm_pages_business_manager_id ON public.bm_pages(business_manager_id);
CREATE INDEX idx_bm_pages_page_id ON public.bm_pages(page_id);

-- RLS Policies for Pages
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bm_pages ENABLE ROW LEVEL SECURITY;

-- Pages policies - users can only see their organization's pages
CREATE POLICY "Users can view their organization's pages" ON public.pages
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE profile_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their organization's pages" ON public.pages
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE profile_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Application pages policies
CREATE POLICY "Users can view application pages for their applications" ON public.application_pages
    FOR SELECT USING (
        application_id IN (
            SELECT application_id FROM public.application 
            WHERE organization_id IN (
                SELECT organization_id FROM public.profiles WHERE profile_id = auth.uid()
                UNION
                SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage application pages for their applications" ON public.application_pages
    FOR ALL USING (
        application_id IN (
            SELECT application_id FROM public.application 
            WHERE organization_id IN (
                SELECT organization_id FROM public.profiles WHERE profile_id = auth.uid()
                UNION
                SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
        )
    );

-- BM pages policies
CREATE POLICY "Users can view BM pages for their organization" ON public.bm_pages
    FOR SELECT USING (
        business_manager_id IN (
            SELECT ab.asset_id 
            FROM public.asset_binding ab 
            JOIN public.asset a ON ab.asset_id = a.asset_id 
            WHERE a.type = 'business_manager' 
            AND ab.organization_id IN (
                SELECT organization_id FROM public.profiles WHERE profile_id = auth.uid()
                UNION
                SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
            )
        )
    );

-- Admin policies for all tables
CREATE POLICY "Admins can view all pages" ON public.pages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profile_id = auth.uid() AND is_superuser = true)
    );

CREATE POLICY "Admins can manage all pages" ON public.pages
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profile_id = auth.uid() AND is_superuser = true)
    );

CREATE POLICY "Admins can view all application pages" ON public.application_pages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profile_id = auth.uid() AND is_superuser = true)
    );

CREATE POLICY "Admins can manage all application pages" ON public.application_pages
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profile_id = auth.uid() AND is_superuser = true)
    );

CREATE POLICY "Admins can view all BM pages" ON public.bm_pages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profile_id = auth.uid() AND is_superuser = true)
    );

CREATE POLICY "Admins can manage all BM pages" ON public.bm_pages
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profile_id = auth.uid() AND is_superuser = true)
    );

-- Function to get page count for an organization
CREATE OR REPLACE FUNCTION get_organization_page_count(org_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.pages
        WHERE organization_id = org_id AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get BM page count
CREATE OR REPLACE FUNCTION get_bm_page_count(bm_asset_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.bm_pages
        WHERE business_manager_id = bm_asset_id AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if organization can add more pages based on plan limits
CREATE OR REPLACE FUNCTION can_add_pages(org_id UUID, requested_count INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    plan_limit INTEGER;
    org_plan TEXT;
BEGIN
    -- Get current page count
    current_count := get_organization_page_count(org_id);
    
    -- Get organization's plan
    SELECT plan_id INTO org_plan
    FROM public.organizations
    WHERE organization_id = org_id;
    
    -- Set limits based on plan
    CASE org_plan
        WHEN 'starter' THEN plan_limit := 3;
        WHEN 'growth' THEN plan_limit := 5;
        WHEN 'scale' THEN plan_limit := 10;
        ELSE plan_limit := 1; -- Free plan
    END CASE;
    
    -- Check if adding requested pages would exceed limit
    RETURN (current_count + requested_count) <= plan_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.pages IS 'Facebook Pages that organizations can use with their ad accounts';
COMMENT ON TABLE public.application_pages IS 'Pages requested in each application for BM/ad account access';
COMMENT ON TABLE public.bm_pages IS 'Pages linked to business managers after approval';
COMMENT ON FUNCTION get_organization_page_count(UUID) IS 'Returns active page count for an organization';
COMMENT ON FUNCTION get_bm_page_count(UUID) IS 'Returns active page count for a business manager';
COMMENT ON FUNCTION can_add_pages(UUID, INTEGER) IS 'Checks if organization can add more pages based on plan limits';
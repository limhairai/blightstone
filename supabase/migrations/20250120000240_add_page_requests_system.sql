-- Add page requests system similar to pixel requests
-- This allows clients to request custom Facebook pages to be created

-- Create page_requests table
CREATE TABLE IF NOT EXISTS public.page_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    
    -- Page details
    page_name TEXT NOT NULL,
    page_category TEXT,
    page_description TEXT,
    business_manager_id TEXT, -- Which BM this page should be associated with
    
    -- Request status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Admin who processed the request
    processed_by UUID REFERENCES auth.users(id)
);

-- Add indexes
CREATE INDEX idx_page_requests_organization ON public.page_requests(organization_id);
CREATE INDEX idx_page_requests_status ON public.page_requests(status);
CREATE INDEX idx_page_requests_created_at ON public.page_requests(created_at DESC);

-- Add RLS policies
ALTER TABLE public.page_requests ENABLE ROW LEVEL SECURITY;

-- Clients can view their own page requests
CREATE POLICY "Users can view their organization page requests" ON public.page_requests
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles 
            WHERE profile_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Clients can create page requests for their organization
CREATE POLICY "Users can create page requests for their organization" ON public.page_requests
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.profiles 
            WHERE profile_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Clients can update their own pending requests
CREATE POLICY "Users can update their own pending page requests" ON public.page_requests
    FOR UPDATE USING (
        status = 'pending' AND
        organization_id IN (
            SELECT organization_id FROM public.profiles 
            WHERE profile_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_page_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_page_requests_updated_at
    BEFORE UPDATE ON public.page_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_page_requests_updated_at();

-- Add comments
COMMENT ON TABLE public.page_requests IS 'Client requests for custom Facebook pages to be created';
COMMENT ON COLUMN public.page_requests.page_name IS 'Name of the Facebook page to be created';
COMMENT ON COLUMN public.page_requests.page_category IS 'Category for the Facebook page (e.g., Business, Brand, etc.)';
COMMENT ON COLUMN public.page_requests.business_manager_id IS 'ID of the Business Manager this page should be associated with';
COMMENT ON COLUMN public.page_requests.status IS 'Request status: pending, approved, rejected, completed';
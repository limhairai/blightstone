-- Create pixel connection requests system
-- This allows clients to request pixel connections and admins to track/manage them

-- Create pixel_requests table
CREATE TABLE public.pixel_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    pixel_id TEXT NOT NULL,
    pixel_name TEXT,
    business_manager_id TEXT NOT NULL, -- The BM ID they want to connect to
    business_manager_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    notes TEXT, -- Client notes about the request
    admin_notes TEXT, -- Admin notes for internal tracking
    requested_by UUID NOT NULL REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
    processed_by UUID REFERENCES public.profiles(profile_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Add indexes for performance
CREATE INDEX idx_pixel_requests_organization_id ON public.pixel_requests(organization_id);
CREATE INDEX idx_pixel_requests_status ON public.pixel_requests(status);
CREATE INDEX idx_pixel_requests_pixel_id ON public.pixel_requests(pixel_id);
CREATE INDEX idx_pixel_requests_business_manager_id ON public.pixel_requests(business_manager_id);
CREATE INDEX idx_pixel_requests_created_at ON public.pixel_requests(created_at);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at_pixel_requests 
    BEFORE UPDATE ON public.pixel_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get pixel requests with metadata
CREATE OR REPLACE FUNCTION public.get_pixel_requests_with_metadata(
    p_organization_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    request_id UUID,
    organization_id UUID,
    organization_name TEXT,
    pixel_id TEXT,
    pixel_name TEXT,
    business_manager_id TEXT,
    business_manager_name TEXT,
    status TEXT,
    notes TEXT,
    admin_notes TEXT,
    requested_by UUID,
    requested_by_name TEXT,
    requested_by_email TEXT,
    processed_by UUID,
    processed_by_name TEXT,
    processed_by_email TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.request_id,
        pr.organization_id,
        o.name as organization_name,
        pr.pixel_id,
        pr.pixel_name,
        pr.business_manager_id,
        pr.business_manager_name,
        pr.status,
        pr.notes,
        pr.admin_notes,
        pr.requested_by,
        requester.name as requested_by_name,
        requester.email as requested_by_email,
        pr.processed_by,
        processor.name as processed_by_name,
        processor.email as processed_by_email,
        pr.created_at,
        pr.updated_at,
        pr.processed_at
    FROM public.pixel_requests pr
    LEFT JOIN public.organizations o ON pr.organization_id = o.organization_id
    LEFT JOIN public.profiles requester ON pr.requested_by = requester.profile_id
    LEFT JOIN public.profiles processor ON pr.processed_by = processor.profile_id
    WHERE 
        (p_organization_id IS NULL OR pr.organization_id = p_organization_id)
        AND (p_status IS NULL OR pr.status = p_status)
    ORDER BY pr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update pixel request status
CREATE OR REPLACE FUNCTION public.update_pixel_request_status(
    p_request_id UUID,
    p_status TEXT,
    p_admin_notes TEXT DEFAULT NULL,
    p_processed_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated_rows INTEGER;
BEGIN
    -- Validate status
    IF p_status NOT IN ('pending', 'processing', 'completed', 'rejected') THEN
        RAISE EXCEPTION 'Invalid status: %', p_status;
    END IF;

    -- Update the request
    UPDATE public.pixel_requests 
    SET 
        status = p_status,
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        processed_by = COALESCE(p_processed_by, processed_by),
        processed_at = CASE 
            WHEN p_status IN ('completed', 'rejected') THEN NOW()
            ELSE processed_at
        END,
        updated_at = NOW()
    WHERE request_id = p_request_id;

    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
    
    RETURN v_updated_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if pixel request already exists
CREATE OR REPLACE FUNCTION public.check_pixel_request_exists(
    p_organization_id UUID,
    p_pixel_id TEXT,
    p_business_manager_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Check for existing pending/processing requests for same pixel+BM combination
    SELECT COUNT(*)
    INTO v_count
    FROM public.pixel_requests
    WHERE organization_id = p_organization_id
        AND pixel_id = p_pixel_id
        AND business_manager_id = p_business_manager_id
        AND status IN ('pending', 'processing');
    
    RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) policies
ALTER TABLE public.pixel_requests ENABLE ROW LEVEL SECURITY;

-- Users can only see their own organization's requests
CREATE POLICY "Users can view own organization pixel requests" ON public.pixel_requests
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE profile_id = auth.uid()
        )
    );

-- Users can only create requests for their own organization
CREATE POLICY "Users can create pixel requests for own organization" ON public.pixel_requests
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE profile_id = auth.uid()
        )
        AND requested_by = auth.uid()
    );

-- Users can only update their own requests (limited fields)
CREATE POLICY "Users can update own pixel requests" ON public.pixel_requests
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE profile_id = auth.uid()
        )
        AND requested_by = auth.uid()
    );

-- Admin policies (service role can manage all)
CREATE POLICY "Service role can manage all pixel requests" ON public.pixel_requests
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.pixel_requests TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pixel_requests_with_metadata TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_pixel_request_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_pixel_request_exists TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.pixel_requests IS 'Stores pixel connection requests from clients to admins';
COMMENT ON FUNCTION public.get_pixel_requests_with_metadata IS 'Retrieves pixel requests with user and organization metadata';
COMMENT ON FUNCTION public.update_pixel_request_status IS 'Updates pixel request status with admin processing info';
COMMENT ON FUNCTION public.check_pixel_request_exists IS 'Checks if a pixel request already exists to prevent duplicates';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully created pixel requests system:';
    RAISE NOTICE '- pixel_requests table with proper indexes and RLS';
    RAISE NOTICE '- Helper functions for request management';
    RAISE NOTICE '- Security policies for multi-tenant access';
END $$; 
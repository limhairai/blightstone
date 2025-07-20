-- Integrate pixels into existing asset system
-- Remove separate pixel_requests table and use the existing asset + application workflow

-- Drop the pixel_requests table and related objects
DROP TABLE IF EXISTS public.pixel_requests CASCADE;
DROP FUNCTION IF EXISTS public.get_pixel_requests_with_metadata(UUID, TEXT);

-- Add 'pixel' as a supported asset type
ALTER TABLE public.asset 
DROP CONSTRAINT IF EXISTS asset_type_check,
ADD CONSTRAINT asset_type_check CHECK (type IN ('business_manager', 'ad_account', 'profile', 'pixel'));

-- Add 'pixel_connection' as a supported application request type
ALTER TABLE public.application 
DROP CONSTRAINT IF EXISTS application_request_type_check,
ADD CONSTRAINT application_request_type_check CHECK (request_type IN ('new_business_manager', 'additional_accounts', 'pixel_connection'));

-- Add pixel-specific fields to application table
ALTER TABLE public.application 
ADD COLUMN IF NOT EXISTS pixel_id TEXT,
ADD COLUMN IF NOT EXISTS pixel_name TEXT;

-- Create function to get pixels with their status (active assets vs pending applications)
CREATE OR REPLACE FUNCTION public.get_organization_pixels(
    p_organization_id UUID
)
RETURNS TABLE(
    id UUID,
    type TEXT, -- 'asset' or 'application'
    pixel_id TEXT,
    pixel_name TEXT,
    business_manager_id TEXT,
    business_manager_name TEXT,
    status TEXT, -- 'active' for assets, 'pending'/'processing'/'rejected' for applications
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    -- Get active pixel assets
    SELECT 
        a.asset_id as id,
        'asset'::TEXT as type,
        a.dolphin_id as pixel_id,
        a.name as pixel_name,
        a.metadata->>'business_manager_id' as business_manager_id,
        a.metadata->>'business_manager_name' as business_manager_name,
        a.status,
        ab.is_active,
        a.created_at,
        a.updated_at
    FROM public.asset a
    JOIN public.asset_binding ab ON a.asset_id = ab.asset_id
    WHERE ab.organization_id = p_organization_id
      AND a.type = 'pixel'
      AND ab.status = 'active'
    
    UNION ALL
    
    -- Get pending pixel applications
    SELECT 
        app.application_id as id,
        'application'::TEXT as type,
        app.pixel_id,
        app.pixel_name,
        app.target_bm_dolphin_id as business_manager_id,
        NULL::TEXT as business_manager_name, -- Will be populated from BM data
        app.status,
        NULL::BOOLEAN as is_active,
        app.created_at,
        app.updated_at
    FROM public.application app
    WHERE app.organization_id = p_organization_id
      AND app.request_type = 'pixel_connection'
      AND app.status IN ('pending', 'processing')
    
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to submit pixel connection request
CREATE OR REPLACE FUNCTION public.submit_pixel_connection_request(
    p_organization_id UUID,
    p_pixel_id TEXT,
    p_pixel_name TEXT,
    p_business_manager_id TEXT,
    p_requested_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_application_id UUID;
BEGIN
    -- Create application record
    INSERT INTO public.application (
        organization_id,
        request_type,
        pixel_id,
        pixel_name,
        target_bm_dolphin_id,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_organization_id,
        'pixel_connection',
        p_pixel_id,
        p_pixel_name,
        p_business_manager_id,
        'pending',
        NOW(),
        NOW()
    ) RETURNING application_id INTO v_application_id;
    
    RETURN v_application_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to fulfill pixel connection request (admin use)
CREATE OR REPLACE FUNCTION public.fulfill_pixel_connection_request(
    p_application_id UUID,
    p_admin_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_app_record RECORD;
    v_asset_id UUID;
BEGIN
    -- Get application details
    SELECT * INTO v_app_record
    FROM public.application
    WHERE application_id = p_application_id
      AND request_type = 'pixel_connection'
      AND status = 'processing';
    
    IF v_app_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Create or update pixel asset
    INSERT INTO public.asset (
        type,
        dolphin_id,
        name,
        status,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        'pixel',
        v_app_record.pixel_id,
        v_app_record.pixel_name,
        'active',
        jsonb_build_object(
            'business_manager_id', v_app_record.target_bm_dolphin_id,
            'connected_at', NOW()
        ),
        NOW(),
        NOW()
    ) 
    ON CONFLICT (type, dolphin_id) 
    DO UPDATE SET 
        name = EXCLUDED.name,
        status = EXCLUDED.status,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    RETURNING asset_id INTO v_asset_id;
    
    -- Create asset binding
    INSERT INTO public.asset_binding (
        asset_id,
        organization_id,
        status,
        is_active,
        bound_by,
        bound_at,
        created_at,
        updated_at
    ) VALUES (
        v_asset_id,
        v_app_record.organization_id,
        'active',
        TRUE,
        p_admin_user_id,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (asset_id, organization_id) 
    DO UPDATE SET 
        status = EXCLUDED.status,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
    
    -- Create fulfillment record
    INSERT INTO public.application_fulfillment (
        application_id,
        asset_id,
        created_at
    ) VALUES (
        p_application_id,
        v_asset_id,
        NOW()
    ) ON CONFLICT (application_id, asset_id) DO NOTHING;
    
    -- Mark application as fulfilled
    UPDATE public.application
    SET 
        status = 'fulfilled',
        fulfilled_by = p_admin_user_id,
        fulfilled_at = NOW(),
        updated_at = NOW()
    WHERE application_id = p_application_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for pixel assets
CREATE POLICY "Users can view their organization's pixel assets"
    ON public.asset FOR SELECT
    USING (
        type = 'pixel' AND
        asset_id IN (
            SELECT ab.asset_id 
            FROM public.asset_binding ab
            JOIN public.profiles p ON p.organization_id = ab.organization_id
            WHERE p.profile_id = auth.uid()
        )
    );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_type_pixel ON public.asset(type) WHERE type = 'pixel';
CREATE INDEX IF NOT EXISTS idx_application_pixel_requests ON public.application(organization_id, request_type) WHERE request_type = 'pixel_connection';
CREATE INDEX IF NOT EXISTS idx_application_pixel_id ON public.application(pixel_id) WHERE pixel_id IS NOT NULL; 
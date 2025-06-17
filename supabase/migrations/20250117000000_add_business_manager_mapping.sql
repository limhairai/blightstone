-- ============================================================================
-- BUSINESS MANAGER MAPPING MIGRATION
-- Add fields to support 1:1 Business ↔ Facebook Business Manager mapping
-- ============================================================================

-- Add Business Manager mapping fields to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS facebook_business_manager_id TEXT,
ADD COLUMN IF NOT EXISTS facebook_business_manager_name TEXT,
ADD COLUMN IF NOT EXISTS facebook_business_manager_assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS facebook_business_manager_assigned_by UUID REFERENCES auth.users(id);

-- Add index for faster BM lookups
CREATE INDEX IF NOT EXISTS idx_businesses_facebook_bm_id 
ON public.businesses(facebook_business_manager_id) 
WHERE facebook_business_manager_id IS NOT NULL;

-- Add unique constraint to ensure 1:1 mapping (one BM per business)
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_facebook_bm_unique 
ON public.businesses(facebook_business_manager_id) 
WHERE facebook_business_manager_id IS NOT NULL;

-- Update existing businesses to use business_id as BM ID if they have one
-- This is for backward compatibility with existing data
UPDATE public.businesses 
SET facebook_business_manager_id = business_id,
    facebook_business_manager_assigned_at = created_at
WHERE business_id IS NOT NULL 
AND facebook_business_manager_id IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.businesses.facebook_business_manager_id IS 'Facebook Business Manager ID - 1:1 mapping with businesses';
COMMENT ON COLUMN public.businesses.facebook_business_manager_name IS 'Facebook Business Manager display name';
COMMENT ON COLUMN public.businesses.facebook_business_manager_assigned_at IS 'When the BM was assigned to this business';
COMMENT ON COLUMN public.businesses.facebook_business_manager_assigned_by IS 'Admin user who assigned the BM';

-- Add RLS policy for BM management (admins can manage, users can view)
CREATE POLICY "Admins can manage business manager assignments" ON public.businesses 
FOR UPDATE USING (
    -- Allow if user is superuser/admin
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_superuser = true)
    OR 
    -- Allow if user is owner/admin of the organization
    EXISTS (
        SELECT 1 FROM public.organization_members om 
        WHERE om.organization_id = public.businesses.organization_id 
        AND om.user_id = auth.uid() 
        AND om.role IN ('owner', 'admin')
    )
); 
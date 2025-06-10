-- Fix RLS policy conflicts after projects to businesses migration
-- This migration ensures clean, optimized policies for the businesses table

BEGIN;

-- ============================================================================
-- CLEAN UP AND OPTIMIZE BUSINESSES TABLE POLICIES
-- ============================================================================

-- At this point in the migration sequence, the projects table has been renamed to businesses
-- We need to ensure the businesses table has clean, optimized policies

-- Drop any existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can read businesses of organizations they are a member of" ON public.businesses;
DROP POLICY IF EXISTS "Org owners/admins can create businesses for their organization" ON public.businesses;
DROP POLICY IF EXISTS "Org owners/admins can update businesses in their organization" ON public.businesses;
DROP POLICY IF EXISTS "Org owners/admins can delete businesses in their organization" ON public.businesses;

-- Create optimized policies for businesses table with performance improvements
CREATE POLICY "Users can read businesses of organizations they are a member of"
ON public.businesses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = public.businesses.organization_id
    AND om.user_id = (select auth.uid())
  )
);

CREATE POLICY "Org owners/admins can create businesses for their organization"
ON public.businesses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = public.businesses.organization_id
    AND om.user_id = (select auth.uid())
    AND om.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Org owners/admins can update businesses in their organization"
ON public.businesses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = public.businesses.organization_id
    AND om.user_id = (select auth.uid())
    AND om.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Org owners/admins can delete businesses in their organization"
ON public.businesses FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = public.businesses.organization_id
    AND om.user_id = (select auth.uid())
    AND om.role IN ('owner', 'admin')
  )
);

-- ============================================================================
-- CLEAN UP AND OPTIMIZE BUSINESS_DOMAINS TABLE POLICIES
-- ============================================================================

-- Drop any existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Business domains access control" ON public.business_domains;

-- Create optimized policy for business_domains table
CREATE POLICY "Business domains access control"
ON public.business_domains FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.businesses b ON b.organization_id = om.organization_id
    WHERE b.id = public.business_domains.business_id
    AND om.user_id = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.businesses b ON b.organization_id = om.organization_id
    WHERE b.id = public.business_domains.business_id
    AND om.user_id = (select auth.uid())
    AND om.role IN ('owner', 'admin')
  )
);

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "Users can read businesses of organizations they are a member of" ON public.businesses 
IS 'Allows organization members to view businesses within their organization. Uses optimized auth.uid() pattern.';

COMMENT ON POLICY "Business domains access control" ON public.business_domains 
IS 'Controls access to business domains based on organization membership and role. Uses optimized auth.uid() pattern.';

COMMIT; 
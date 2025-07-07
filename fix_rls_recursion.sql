-- ============================================================================
-- FIX ORGANIZATION MEMBERS RLS INFINITE RECURSION
-- Run this in your Supabase SQL Editor to fix the circular dependency
-- ============================================================================

-- Drop the problematic organization_members policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners can view all memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Users can create memberships for their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can manage all memberships" ON public.organization_members;

-- Create a SECURITY DEFINER function to get user's organizations without RLS
CREATE OR REPLACE FUNCTION public.get_user_organizations(p_user_id UUID)
RETURNS TABLE(organization_id UUID)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- Use SECURITY DEFINER to bypass RLS when getting user's organizations
  SELECT om.organization_id 
  FROM public.organization_members om 
  WHERE om.user_id = p_user_id
  UNION
  SELECT o.organization_id 
  FROM public.organizations o 
  WHERE o.owner_id = p_user_id;
$$;

-- Recreate organization_members policies without circular dependencies
CREATE POLICY "Users can view their own memberships" ON public.organization_members
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organization owners can view all memberships" ON public.organization_members
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create memberships for their organizations" ON public.organization_members
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
        )
    );

-- Update applications policies to use the new function
DROP POLICY IF EXISTS "Users can view their organization's applications" ON public.application;
DROP POLICY IF EXISTS "Users can create applications for their organization" ON public.application;

CREATE POLICY "Users can view their organization's applications" ON public.application
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.get_user_organizations(auth.uid())
        )
    );

CREATE POLICY "Users can create applications for their organization" ON public.application
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.get_user_organizations(auth.uid())
        )
    );

-- Add admin policies back using the existing is_admin function
CREATE POLICY "Admins can manage all memberships" ON public.organization_members
    FOR ALL USING (public.is_admin(auth.uid()));

-- Add service role policies
CREATE POLICY "Service role can manage all organization members" ON public.organization_members 
    FOR ALL USING (auth.role() = 'service_role');

-- Grant execute permissions on the helper function
GRANT EXECUTE ON FUNCTION public.get_user_organizations(UUID) TO authenticated;

-- Add comment to document the fix
COMMENT ON FUNCTION public.get_user_organizations(UUID) IS 'SECURITY DEFINER function to get user organizations without RLS recursion';

SELECT 'RLS recursion fix applied successfully!' as result; 
-- ============================================================================
-- FIX ORGANIZATION MEMBERS RLS INFINITE RECURSION
-- Fix the circular dependency in organization_members RLS policies
-- ============================================================================

-- Drop the problematic organization_members policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners can view all memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Users can create memberships for their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can manage all memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Service role can manage all organization members" ON public.organization_members;

-- Create a SECURITY DEFINER function to check organization membership without RLS
CREATE OR REPLACE FUNCTION public.check_organization_membership(
    p_user_id UUID,
    p_organization_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- Use SECURITY DEFINER to bypass RLS when checking membership
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE user_id = p_user_id AND organization_id = p_organization_id
  );
$$;

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

-- Update other tables' policies to use the new function instead of subqueries
-- This prevents the circular dependency issue

-- Update applications policies
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

-- Update topup_requests policies
DROP POLICY IF EXISTS "Users can view own organization topup requests" ON public.topup_requests;
DROP POLICY IF EXISTS "Users can create topup requests" ON public.topup_requests;

CREATE POLICY "Users can view own organization topup requests" ON public.topup_requests
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.get_user_organizations(auth.uid())
        )
    );

CREATE POLICY "Users can create topup requests" ON public.topup_requests
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.get_user_organizations(auth.uid())
        )
        AND requested_by = auth.uid()
    );

-- Update wallets policies
DROP POLICY IF EXISTS "Users can view their organization's wallet" ON public.wallets;

CREATE POLICY "Users can view their organization's wallet" ON public.wallets
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.get_user_organizations(auth.uid())
        )
    );

-- Update asset_binding policies
DROP POLICY IF EXISTS "Users can view their organization's asset bindings" ON public.asset_binding;

CREATE POLICY "Users can view their organization's asset bindings" ON public.asset_binding
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.get_user_organizations(auth.uid())
        )
    );

-- Update bank_transfer_requests policies
DROP POLICY IF EXISTS "Users can view their organization's bank transfer requests" ON public.bank_transfer_requests;
DROP POLICY IF EXISTS "Users can create bank transfer requests for their organization" ON public.bank_transfer_requests;

CREATE POLICY "Users can view their organization's bank transfer requests" ON public.bank_transfer_requests
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.get_user_organizations(auth.uid())
        )
    );

CREATE POLICY "Users can create bank transfer requests for their organization" ON public.bank_transfer_requests
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.get_user_organizations(auth.uid())
        )
        AND user_id = auth.uid()
    );

-- Grant execute permissions on the helper functions
GRANT EXECUTE ON FUNCTION public.check_organization_membership(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_organizations(UUID) TO authenticated;

-- Add admin policies back using the existing is_admin function
CREATE POLICY "Admins can manage all memberships" ON public.organization_members
    FOR ALL USING (public.is_admin(auth.uid()));

-- Add service role policies
CREATE POLICY "Service role can manage all organization members" ON public.organization_members 
    FOR ALL USING (auth.role() = 'service_role');

-- Add comments to document the fix
COMMENT ON FUNCTION public.check_organization_membership(UUID, UUID) IS 'SECURITY DEFINER function to check organization membership without RLS recursion';
COMMENT ON FUNCTION public.get_user_organizations(UUID) IS 'SECURITY DEFINER function to get user organizations without RLS recursion'; 
-- ============================================================================
-- FIX ADMIN RLS RECURSION ISSUE
-- Fix infinite recursion in profiles table RLS policies
-- ============================================================================

-- Drop the problematic admin policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can update all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can manage all memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can manage plans" ON public.plans;
DROP POLICY IF EXISTS "Admins can manage all topup requests" ON public.topup_requests;
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.application;
DROP POLICY IF EXISTS "Admins can manage all assets" ON public.asset;
DROP POLICY IF EXISTS "Admins can manage all asset bindings" ON public.asset_binding;
DROP POLICY IF EXISTS "Admins can manage all bank transfer requests" ON public.bank_transfer_requests;
DROP POLICY IF EXISTS "Admins can manage all unmatched transfers" ON public.unmatched_transfers;

-- Create a simple function to check admin status without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- Use SECURITY DEFINER to bypass RLS when checking admin status
  SELECT COALESCE(
    (SELECT is_superuser FROM public.profiles WHERE profile_id = user_id LIMIT 1),
    false
  );
$$;

-- Recreate admin policies using the function instead of subqueries
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all organizations" ON public.organizations
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all organizations" ON public.organizations
    FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all memberships" ON public.organization_members
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage plans" ON public.plans
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all topup requests" ON public.topup_requests
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all applications" ON public.application
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all assets" ON public.asset
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all asset bindings" ON public.asset_binding
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all bank transfer requests" ON public.bank_transfer_requests
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all unmatched transfers" ON public.unmatched_transfers
    FOR ALL USING (public.is_admin(auth.uid()));

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated; 
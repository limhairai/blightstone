-- Optimize RLS Policies for Performance
-- This migration fixes two main issues:
-- 1. Auth RLS Initialization Plan: Wraps auth.uid() calls with (select auth.uid())
-- 2. Multiple Permissive Policies: Consolidates overlapping policies

-- ============================================================================
-- PROFILES TABLE OPTIMIZATIONS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create optimized policies
-- Consolidated SELECT policy (combines both read policies)
CREATE POLICY "Profiles read access"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        true -- Allow all authenticated users to read all profiles
        OR (select auth.uid()) = id -- Users can always read their own profile
    );

-- Optimized UPDATE policy
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = id)
    WITH CHECK ((select auth.uid()) = id);

-- ============================================================================
-- ORGANIZATIONS TABLE OPTIMIZATIONS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read organizations they are a member of" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update their own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can delete their own organizations" ON public.organizations;

-- Create optimized policies
CREATE POLICY "Organizations read access"
    ON public.organizations FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.organizations.id 
        AND om.user_id = (select auth.uid())
    ));

CREATE POLICY "Organization owners can update their own organizations"
    ON public.organizations FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = owner_id)
    WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY "Organization owners can delete their own organizations" 
    ON public.organizations FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = owner_id);

-- ============================================================================
-- ORGANIZATION_MEMBERS TABLE OPTIMIZATIONS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Organization members can view other members of the same organization" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners/admins can add members to their organization" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners/admins can update member roles" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners/admins can remove members (except themselves if last owner)" ON public.organization_members;

-- Create optimized policies
CREATE POLICY "Organization members can view other members of the same organization"
    ON public.organization_members FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om_check
        WHERE om_check.organization_id = public.organization_members.organization_id
        AND om_check.user_id = (select auth.uid())
    ));

CREATE POLICY "Organization owners/admins can add members to their organization"
    ON public.organization_members FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.organization_members om_check
        WHERE om_check.organization_id = public.organization_members.organization_id
        AND om_check.user_id = (select auth.uid())
        AND (om_check.role = 'owner' OR om_check.role = 'admin')
    ));

CREATE POLICY "Organization owners/admins can update member roles"
    ON public.organization_members FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om_check
        WHERE om_check.organization_id = public.organization_members.organization_id
        AND om_check.user_id = (select auth.uid())
        AND (om_check.role = 'owner' OR om_check.role = 'admin')
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.organization_members om_check
        WHERE om_check.organization_id = public.organization_members.organization_id
        AND om_check.user_id = (select auth.uid())
        AND (om_check.role = 'owner' OR om_check.role = 'admin')
    ));

CREATE POLICY "Organization owners/admins can remove members (except themselves if last owner)"
    ON public.organization_members FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om_check
        WHERE om_check.organization_id = public.organization_members.organization_id
        AND om_check.user_id = (select auth.uid())
        AND (om_check.role = 'owner' OR om_check.role = 'admin')
        AND public.organization_members.user_id != (select auth.uid())
    ));

-- ============================================================================
-- PROJECTS TABLE OPTIMIZATIONS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read projects of organizations they are a member of" ON public.projects;
DROP POLICY IF EXISTS "Org owners/admins can create projects for their organization" ON public.projects;
DROP POLICY IF EXISTS "Org owners/admins can update projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Org owners/admins can delete projects in their organization" ON public.projects;

-- Create optimized policies
CREATE POLICY "Users can read projects of organizations they are a member of"
    ON public.projects FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.projects.organization_id 
        AND om.user_id = (select auth.uid())
    ));

CREATE POLICY "Org owners/admins can create projects for their organization"
    ON public.projects FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.projects.organization_id
        AND om.user_id = (select auth.uid())
        AND (om.role = 'owner' OR om.role = 'admin')
    ));

CREATE POLICY "Org owners/admins can update projects in their organization"
    ON public.projects FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.projects.organization_id
        AND om.user_id = (select auth.uid())
        AND (om.role = 'owner' OR om.role = 'admin')
    ));

CREATE POLICY "Org owners/admins can delete projects in their organization"
    ON public.projects FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.projects.organization_id
        AND om.user_id = (select auth.uid())
        AND (om.role = 'owner' OR om.role = 'admin')
    ));

-- ============================================================================
-- PROJECT_DOMAINS TABLE OPTIMIZATIONS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read domains of projects they have access to" ON public.project_domains;
DROP POLICY IF EXISTS "Org owners/admins can manage domains for their projects" ON public.project_domains;

-- Create optimized consolidated policy
-- This fixes the multiple permissive policies issue by combining read and manage access
CREATE POLICY "Project domains access control"
    ON public.project_domains FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM public.projects p
        JOIN public.organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = public.project_domains.project_id 
        AND om.user_id = (select auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1
        FROM public.projects p
        JOIN public.organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = public.project_domains.project_id
        AND om.user_id = (select auth.uid())
        AND (om.role = 'owner' OR om.role = 'admin')
    ));

-- ============================================================================
-- WALLETS TABLE OPTIMIZATIONS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Org members can view their organization's wallet" ON public.wallets;

-- Create optimized policy
CREATE POLICY "Org members can view their organization's wallet"
    ON public.wallets FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.wallets.organization_id 
        AND om.user_id = (select auth.uid())
    ));

-- ============================================================================
-- TRANSACTIONS TABLE OPTIMIZATIONS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Org members can view transactions for their organization" ON public.transactions;

-- Create optimized policy
CREATE POLICY "Org members can view transactions for their organization"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.transactions.organization_id 
        AND om.user_id = (select auth.uid())
    ));

-- ============================================================================
-- PLANS TABLE OPTIMIZATION (if it exists)
-- ============================================================================

-- The plans table policy is already optimal, but let's ensure it's consistent
DROP POLICY IF EXISTS "Plans are viewable by all authenticated users" ON public.plans;

CREATE POLICY "Plans are viewable by all authenticated users"
    ON public.plans FOR SELECT
    TO authenticated
    USING (true);

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================

-- This migration addresses the following Supabase performance warnings:
-- 1. auth_rls_initplan: All auth.uid() calls are now wrapped with (select auth.uid())
-- 2. multiple_permissive_policies: Consolidated overlapping policies where possible
-- 
-- Expected improvements:
-- - Reduced query execution time for RLS policy evaluation
-- - Better query plan optimization
-- - Reduced database load at scale
-- 
-- The (select auth.uid()) pattern ensures the auth function is evaluated once per query
-- rather than once per row, significantly improving performance for large datasets. 
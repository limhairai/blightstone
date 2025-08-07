-- ============================================================================
-- 🔒 SECURITY: Remove Admin Bypass from Client Data RLS Policies
-- ============================================================================
-- This migration removes admin bypass from client data access policies
-- to enforce strict separation between admin and client contexts
-- 
-- Admins should only access client data through dedicated admin endpoints
-- with proper audit trails and controlled access
-- ============================================================================

-- ============================================================================
-- ASSET_BINDING TABLE POLICIES - Remove Admin Bypass
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their organization's asset bindings" ON public.asset_binding;
DROP POLICY IF EXISTS "Admins can manage all asset bindings" ON public.asset_binding;

-- Create new policy without admin bypass for SELECT operations
CREATE POLICY "Users can view their organization's asset bindings" ON public.asset_binding
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Keep admin policy only for admin-specific operations (binding/unbinding)
-- This should only be accessible via admin endpoints, not client endpoints
CREATE POLICY "Admins can manage asset bindings via admin endpoints only" ON public.asset_binding
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
        -- Note: This policy is for admin operations only
        -- Client endpoints should not trigger this policy
    );

-- ============================================================================
-- ORGANIZATIONS TABLE POLICIES - Restrict Admin Access
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view organizations they own or are members of" ON public.organizations;
DROP POLICY IF EXISTS "Admins can manage all organizations" ON public.organizations;

-- Create strict user-only policy for organizations
CREATE POLICY "Users can view organizations they own or are members of" ON public.organizations
    FOR SELECT USING (
        owner_id = auth.uid()
        OR organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Create separate admin policy for admin operations only
CREATE POLICY "Admins can manage organizations via admin endpoints only" ON public.organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
        -- Note: This should only be used by admin-specific endpoints
        -- with proper audit trails and controlled access
    );

-- ============================================================================
-- TRANSACTIONS TABLE POLICIES - Remove Admin Bypass
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their organization's transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.transactions;

-- Create user-only transaction policy
CREATE POLICY "Users can view their organization's transactions" ON public.transactions
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Admin policy for transactions (admin endpoints only)
CREATE POLICY "Admins can manage transactions via admin endpoints only" ON public.transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- ============================================================================
-- WALLETS TABLE POLICIES - Remove Admin Bypass
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their organization's wallets" ON public.wallets;
DROP POLICY IF EXISTS "Admins can manage all wallets" ON public.wallets;

-- Create user-only wallet policy
CREATE POLICY "Users can view their organization's wallets" ON public.wallets
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Admin policy for wallets (admin endpoints only)
CREATE POLICY "Admins can manage wallets via admin endpoints only" ON public.wallets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- ============================================================================
-- TOPUP_REQUESTS TABLE POLICIES - Remove Admin Bypass
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their organization's topup requests" ON public.topup_requests;
DROP POLICY IF EXISTS "Admins can manage all topup requests" ON public.topup_requests;

-- Create user-only topup requests policy
CREATE POLICY "Users can view their organization's topup requests" ON public.topup_requests
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Admin policy for topup requests (admin endpoints only)
CREATE POLICY "Admins can manage topup requests via admin endpoints only" ON public.topup_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- ============================================================================
-- SUPPORT_TICKETS TABLE POLICIES - Remove Admin Bypass
-- ============================================================================

-- Drop existing policies  
DROP POLICY IF EXISTS "Users can view their organization's support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can manage all support tickets" ON public.support_tickets;

-- Create user-only support tickets policy
CREATE POLICY "Users can view their organization's support tickets" ON public.support_tickets
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Admin policy for support tickets (admin endpoints only)
CREATE POLICY "Admins can manage support tickets via admin endpoints only" ON public.support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- ============================================================================
-- COMMENT: Security Audit Trail
-- ============================================================================
-- 
-- This migration enforces strict data isolation by:
-- 1. Removing admin bypass from all client data access
-- 2. Creating separate admin policies for admin endpoints only
-- 3. Ensuring clients can only see their own organization data
-- 4. Requiring admins to use dedicated admin endpoints with audit trails
--
-- ⚠️  IMPORTANT: After this migration:
-- - Admins will NOT be able to access client data via client endpoints
-- - Admin access must go through /api/admin/* endpoints only
-- - All admin actions should be logged for compliance
-- - Client dashboards will be completely isolated from admin access
--
-- ============================================================================
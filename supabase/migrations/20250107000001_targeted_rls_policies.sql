-- Targeted Row Level Security (RLS) Policies for existing tables only
-- This migration ensures all existing tables have proper RLS policies

-- ============================================================================
-- ENABLE RLS ON EXISTING TABLES
-- ============================================================================

-- Core tables that exist
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.application ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.asset ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.asset_binding ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.application_fulfillment ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS public.funding_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ORGANIZATIONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
DROP POLICY IF EXISTS "Users can update organizations they own" ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can update all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Service role can manage all data" ON public.organizations;

CREATE POLICY "Users can view organizations they belong to" ON public.organizations
    FOR SELECT USING (
        owner_id = auth.uid() 
        OR organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update organizations they own" ON public.organizations
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can create organizations" ON public.organizations
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins can view all organizations" ON public.organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

CREATE POLICY "Admins can update all organizations" ON public.organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

CREATE POLICY "Service role can manage all data" ON public.organizations
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- ORGANIZATION_MEMBERS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view organization memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners can manage memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can manage all memberships" ON public.organization_members;

CREATE POLICY "Users can view organization memberships" ON public.organization_members
    FOR SELECT USING (
        user_id = auth.uid()
        OR organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
        )
        OR organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can manage memberships" ON public.organization_members
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own memberships" ON public.organization_members
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all memberships" ON public.organization_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

CREATE POLICY "Service role can manage all profiles" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- WALLETS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their organization's wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can update their organization's wallet" ON public.wallets;
DROP POLICY IF EXISTS "Admins can manage all wallets" ON public.wallets;
DROP POLICY IF EXISTS "Service role can manage all wallets" ON public.wallets;

CREATE POLICY "Users can view their organization's wallet" ON public.wallets
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their organization's wallet" ON public.wallets
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all wallets" ON public.wallets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

CREATE POLICY "Service role can manage all wallets" ON public.wallets
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- TRANSACTIONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their organization's transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions for their organization" ON public.transactions;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Service role can manage all transactions" ON public.transactions;

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

CREATE POLICY "Users can create transactions for their organization" ON public.transactions
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all transactions" ON public.transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

CREATE POLICY "Service role can manage all transactions" ON public.transactions
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- APPLICATION TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their organization's applications" ON public.application;
DROP POLICY IF EXISTS "Users can create applications for their organization" ON public.application;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.application;
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.application;

CREATE POLICY "Users can view their organization's applications" ON public.application
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create applications for their organization" ON public.application
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own applications" ON public.application
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
        AND status IN ('pending', 'under_review')
    );

CREATE POLICY "Admins can manage all applications" ON public.application
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- ============================================================================
-- ASSET TABLE POLICIES (Admin only)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all assets" ON public.asset;
DROP POLICY IF EXISTS "Service role can manage all assets" ON public.asset;

CREATE POLICY "Admins can manage all assets" ON public.asset
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

CREATE POLICY "Service role can manage all assets" ON public.asset
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- ASSET_BINDING TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their organization's asset bindings" ON public.asset_binding;
DROP POLICY IF EXISTS "Admins can manage all asset bindings" ON public.asset_binding;
DROP POLICY IF EXISTS "Service role can manage all asset bindings" ON public.asset_binding;

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

CREATE POLICY "Admins can manage all asset bindings" ON public.asset_binding
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

CREATE POLICY "Service role can manage all asset bindings" ON public.asset_binding
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- APPLICATION_FULFILLMENT TABLE POLICIES (Admin only)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all application fulfillments" ON public.application_fulfillment;

CREATE POLICY "Admins can manage all application fulfillments" ON public.application_fulfillment
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- ============================================================================
-- PLANS TABLE POLICIES (Read-only for all authenticated users)
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view plans" ON public.plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON public.plans;

CREATE POLICY "Authenticated users can view plans" ON public.plans
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage plans" ON public.plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- ============================================================================
-- SUBSCRIPTIONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their organization's subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their organization's subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view their organization's subscription" ON public.subscriptions
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their organization's subscription" ON public.subscriptions
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- ============================================================================
-- ADMIN_TASKS TABLE POLICIES (Admin only)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all admin tasks" ON public.admin_tasks;

CREATE POLICY "Admins can manage all admin tasks" ON public.admin_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- ============================================================================
-- FUNDING_REQUESTS TABLE POLICIES (COMMENTED OUT - TABLE DOESN'T EXIST)
-- ============================================================================

-- DROP POLICY IF EXISTS "Users can view their organization's funding requests" ON public.funding_requests;
-- DROP POLICY IF EXISTS "Users can create funding requests for their organization" ON public.funding_requests;
-- DROP POLICY IF EXISTS "Users can update their own funding requests" ON public.funding_requests;
-- DROP POLICY IF EXISTS "Admins can manage all funding requests" ON public.funding_requests;

-- CREATE POLICY "Users can view their organization's funding requests" ON public.funding_requests
--     FOR SELECT USING (
--         organization_id IN (
--             SELECT organization_id FROM public.organizations 
--             WHERE owner_id = auth.uid()
--             UNION
--             SELECT organization_id FROM public.organization_members 
--             WHERE user_id = auth.uid()
--         )
--     );

-- CREATE POLICY "Users can create funding requests for their organization" ON public.funding_requests
--     FOR INSERT WITH CHECK (
--         organization_id IN (
--             SELECT organization_id FROM public.organizations 
--             WHERE owner_id = auth.uid()
--             UNION
--             SELECT organization_id FROM public.organization_members 
--             WHERE user_id = auth.uid()
--         )
--     );

-- CREATE POLICY "Users can update their own funding requests" ON public.funding_requests
--     FOR UPDATE USING (
--         user_id = auth.uid() 
--         AND status IN ('pending')
--         AND organization_id IN (
--             SELECT organization_id FROM public.organizations 
--             WHERE owner_id = auth.uid()
--             UNION
--             SELECT organization_id FROM public.organization_members 
--             WHERE user_id = auth.uid()
--         )
--     );

-- CREATE POLICY "Admins can manage all funding requests" ON public.funding_requests
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM public.profiles 
--             WHERE profile_id = auth.uid() AND is_superuser = true
--         )
--     );

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "Users can view organizations they belong to" ON public.organizations IS 'Users can only view organizations they own or are members of';
COMMENT ON POLICY "Admins can view all organizations" ON public.organizations IS 'Superuser profiles can view all organizations for admin purposes';
COMMENT ON POLICY "Users can view their own profile" ON public.profiles IS 'Users can only view and edit their own profile data';
COMMENT ON POLICY "Admins can manage all assets" ON public.asset IS 'Only admins can manage Dolphin assets';
COMMENT ON POLICY "Service role can manage all data" ON public.organizations IS 'Service role bypasses RLS for webhooks and system operations'; 
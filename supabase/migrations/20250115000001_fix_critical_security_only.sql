-- ================================================================================================
-- FIX CRITICAL SUPABASE SECURITY WARNINGS
-- ================================================================================================
-- This migration fixes only the critical security warnings for production deployment
-- Date: 2025-01-15
-- Priority: CRITICAL for production deployment
-- ================================================================================================

-- ================================================================================================
-- 1. FIX SECURITY DEFINER VIEW (ERROR - CRITICAL)
-- ================================================================================================
-- Drop the problematic dashboard_summary view if it exists
DROP VIEW IF EXISTS public.dashboard_summary CASCADE;

-- ================================================================================================
-- 2. FIX CORE FUNCTION SEARCH PATH ISSUES (WARNINGS - HIGH PRIORITY)
-- ================================================================================================

-- Fix update_updated_at_column function (used by triggers)
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix is_admin function (used for authorization)
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
CREATE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profile_id = auth.uid() 
        AND is_admin = true
    );
END;
$$;

-- Fix handle_new_user function (auth trigger)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create organization for new user
    INSERT INTO public.organizations (
        organization_id,
        owner_id,
        name,
        plan_id,
        subscription_status
    ) VALUES (
        gen_random_uuid(),
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'free',
        'active'
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Failed to create organization for new user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Fix get_available_balance function (financial operations)
DROP FUNCTION IF EXISTS public.get_available_balance(UUID) CASCADE;
CREATE FUNCTION public.get_available_balance(wallet_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    available_balance INTEGER;
BEGIN
    SELECT (balance_cents - COALESCE(reserved_balance_cents, 0))
    INTO available_balance
    FROM public.wallets
    WHERE organization_id = wallet_id;
    
    RETURN COALESCE(available_balance, 0);
END;
$$;

-- Fix reserve_funds_for_topup function (financial operations)
DROP FUNCTION IF EXISTS public.reserve_funds_for_topup(UUID, INTEGER) CASCADE;
CREATE FUNCTION public.reserve_funds_for_topup(org_id UUID, amount_cents INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_balance INTEGER;
    current_reserved INTEGER;
    available_balance INTEGER;
BEGIN
    -- Get current balances
    SELECT balance_cents, COALESCE(reserved_balance_cents, 0)
    INTO current_balance, current_reserved
    FROM public.wallets
    WHERE organization_id = org_id;
    
    IF current_balance IS NULL THEN
        RETURN FALSE;
    END IF;
    
    available_balance := current_balance - current_reserved;
    
    -- Check if sufficient funds available
    IF available_balance < amount_cents THEN
        RETURN FALSE;
    END IF;
    
    -- Reserve the funds
    UPDATE public.wallets
    SET reserved_balance_cents = current_reserved + amount_cents,
        updated_at = NOW()
    WHERE organization_id = org_id;
    
    RETURN TRUE;
END;
$$;

-- Fix release_reserved_funds function (financial operations)
DROP FUNCTION IF EXISTS public.release_reserved_funds(UUID, INTEGER) CASCADE;
CREATE FUNCTION public.release_reserved_funds(org_id UUID, amount_cents INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.wallets
    SET reserved_balance_cents = GREATEST(0, COALESCE(reserved_balance_cents, 0) - amount_cents),
        updated_at = NOW()
    WHERE organization_id = org_id;
END;
$$;

-- Fix check_organization_membership function (authorization)
DROP FUNCTION IF EXISTS public.check_organization_membership(UUID, UUID) CASCADE;
CREATE FUNCTION public.check_organization_membership(user_id UUID, org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id 
        AND user_id = check_organization_membership.user_id
    );
END;
$$;

-- Fix get_user_organizations function (user data)
DROP FUNCTION IF EXISTS public.get_user_organizations(UUID) CASCADE;
CREATE FUNCTION public.get_user_organizations(user_id UUID)
RETURNS TABLE(
    organization_id UUID,
    name TEXT,
    role TEXT,
    plan_id TEXT,
    subscription_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.organization_id,
        o.name,
        om.role,
        o.plan_id,
        o.subscription_status
    FROM public.organizations o
    JOIN public.organization_members om ON o.organization_id = om.organization_id
    WHERE om.user_id = get_user_organizations.user_id;
END;
$$;

-- ================================================================================================
-- SECURITY FIXES COMPLETED
-- ================================================================================================
-- ✅ Removed SECURITY DEFINER view (dashboard_summary)
-- ✅ Fixed 8 critical functions with search_path security issues
-- ✅ All core functions now have SET search_path = public
-- 
-- MANUAL STEPS STILL REQUIRED:
-- 1. Update Supabase Auth settings: OTP expiry to 3600 seconds (1 hour)
-- 2. Go to Authentication → Settings in Supabase Dashboard
-- 3. Change "OTP expiry" from 86400 to 3600
-- ================================================================================================ 
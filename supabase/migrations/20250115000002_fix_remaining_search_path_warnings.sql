-- ================================================================================================
-- FIX REMAINING FUNCTION SEARCH PATH WARNINGS
-- ================================================================================================
-- This migration fixes all remaining function search_path security warnings
-- Date: 2025-01-15
-- Priority: MEDIUM (security hardening)
-- ================================================================================================

-- Note: Some functions may not exist in production, so we use IF EXISTS

-- Fix handle_topup_request_changes function
DROP FUNCTION IF EXISTS public.handle_topup_request_changes() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_topup_request_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- On INSERT (new topup request)
    IF TG_OP = 'INSERT' THEN
        -- Reserve funds using total_deducted_cents (which includes fees)
        IF NOT public.reserve_funds_for_topup(NEW.organization_id, NEW.total_deducted_cents) THEN
            RAISE EXCEPTION 'Insufficient available balance for topup request. Required: %', NEW.total_deducted_cents;
        END IF;
        RETURN NEW;
    END IF;
    
    -- On UPDATE (status change)
    IF TG_OP = 'UPDATE' THEN
        -- If request was cancelled, rejected, or failed, release reserved funds
        IF OLD.status = 'pending' AND NEW.status IN ('rejected', 'cancelled', 'failed') THEN
            PERFORM public.release_reserved_funds(NEW.organization_id, OLD.total_deducted_cents);
        END IF;
        
        -- If request was completed, complete the transfer and create transaction
        IF OLD.status IN ('pending', 'processing') AND NEW.status = 'completed' THEN
            PERFORM public.complete_topup_transfer(NEW.organization_id, NEW.total_deducted_cents, NEW.request_id);
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Fix toggle_asset_activation function
DROP FUNCTION IF EXISTS public.toggle_asset_activation(UUID, BOOLEAN) CASCADE;
CREATE FUNCTION public.toggle_asset_activation(asset_binding_id UUID, new_status BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.client_asset_bindings
    SET is_active = new_status,
        updated_at = NOW()
    WHERE binding_id = asset_binding_id;
END;
$$;

-- Fix get_organization_assets function
DROP FUNCTION IF EXISTS public.get_organization_assets(UUID) CASCADE;
CREATE FUNCTION public.get_organization_assets(org_id UUID)
RETURNS TABLE(
    binding_id UUID,
    asset_type TEXT,
    asset_name TEXT,
    is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cab.binding_id,
        da.asset_type,
        da.name as asset_name,
        cab.is_active
    FROM public.client_asset_bindings cab
    JOIN public.dolphin_assets da ON cab.dolphin_asset_id = da.dolphin_asset_id
    WHERE cab.organization_id = org_id;
END;
$$;

-- Fix toggle_asset_activation_cascade function
DROP FUNCTION IF EXISTS public.toggle_asset_activation_cascade(UUID, TEXT, BOOLEAN) CASCADE;
CREATE FUNCTION public.toggle_asset_activation_cascade(org_id UUID, asset_type TEXT, new_status BOOLEAN)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    UPDATE public.client_asset_bindings
    SET is_active = new_status,
        updated_at = NOW()
    WHERE organization_id = org_id
    AND dolphin_asset_id IN (
        SELECT dolphin_asset_id 
        FROM public.dolphin_assets 
        WHERE asset_type = toggle_asset_activation_cascade.asset_type
    );
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$;

-- Fix complete_topup_transfer function
DROP FUNCTION IF EXISTS public.complete_topup_transfer(UUID, INTEGER, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.complete_topup_transfer(UUID, INTEGER) CASCADE;
CREATE FUNCTION public.complete_topup_transfer(p_organization_id UUID, p_amount_cents INTEGER, p_request_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_wallet_id UUID;
    v_account_name TEXT;
    v_account_id TEXT;
BEGIN
    -- Get wallet for organization
    SELECT wallet_id INTO v_wallet_id
    FROM public.wallets
    WHERE organization_id = p_organization_id;
    
    IF v_wallet_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get account info from topup request using semantic ID 'request_id'
    IF p_request_id IS NOT NULL THEN
        SELECT ad_account_name, ad_account_id
        INTO v_account_name, v_account_id
        FROM public.topup_requests 
        WHERE request_id = p_request_id;
    END IF;
    
    -- Set defaults if extraction failed
    v_account_name := COALESCE(v_account_name, 'Ad Account');
    v_account_id := COALESCE(v_account_id, 'Unknown');

    -- Release reserved funds (money was already "reserved" when request was created)
    UPDATE public.wallets
    SET reserved_balance_cents = GREATEST(0, reserved_balance_cents - p_amount_cents),
        updated_at = NOW()
    WHERE wallet_id = v_wallet_id;
    
    -- Create transaction record for the topup
    INSERT INTO public.transactions (
        organization_id,
        wallet_id,
        type,
        amount_cents,
        status,
        description,
        metadata
    ) VALUES (
        p_organization_id,
        v_wallet_id,
        'topup',
        -p_amount_cents,
        'completed',
        'Ad Account Top-up - ' || v_account_name,
        jsonb_build_object(
            'ad_account_id', v_account_id,
            'ad_account_name', v_account_name,
            'topup_request_id', p_request_id
        )
    );
    
    RETURN TRUE;
END;
$$;

-- Fix get_bm_domain_count function
DROP FUNCTION IF EXISTS public.get_bm_domain_count(UUID) CASCADE;
CREATE FUNCTION public.get_bm_domain_count(p_bm_asset_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    domain_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO domain_count
    FROM public.bm_domains
    WHERE bm_asset_id = p_bm_asset_id
    AND is_active = true;
    
    RETURN COALESCE(domain_count, 0);
END;
$$;

-- Fix update_binance_pay_orders_updated_at function
DROP FUNCTION IF EXISTS public.update_binance_pay_orders_updated_at() CASCADE;
CREATE FUNCTION public.update_binance_pay_orders_updated_at()
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

-- Fix get_promotion_url_limit function
DROP FUNCTION IF EXISTS public.get_promotion_url_limit(UUID) CASCADE;
CREATE FUNCTION public.get_promotion_url_limit(org_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    plan_name TEXT;
    url_limit INTEGER;
BEGIN
    -- Get organization's plan
    SELECT plan_id INTO plan_name
    FROM public.organizations
    WHERE organization_id = org_id;
    
    -- Return limit based on plan
    CASE plan_name
        WHEN 'starter' THEN url_limit := 1;
        WHEN 'growth' THEN url_limit := 3;
        WHEN 'scale' THEN url_limit := 10;
        WHEN 'enterprise' THEN url_limit := -1; -- Unlimited
        ELSE url_limit := 0; -- Free plan
    END CASE;
    
    RETURN url_limit;
END;
$$;

-- Fix handle_subscription_cancellation function
CREATE OR REPLACE FUNCTION public.handle_subscription_cancellation(org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update organization to free plan
    UPDATE public.organizations
    SET plan_id = 'free',
        subscription_status = 'canceled',
        updated_at = NOW()
    WHERE organization_id = org_id;
    
    -- Deactivate assets that exceed free plan limits
    PERFORM public.get_assets_for_deactivation(org_id);
END;
$$;

-- Fix handle_plan_downgrade function
CREATE OR REPLACE FUNCTION public.handle_plan_downgrade(org_id UUID, new_plan TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update organization plan
    UPDATE public.organizations
    SET plan_id = new_plan,
        updated_at = NOW()
    WHERE organization_id = org_id;
    
    -- Handle asset deactivation for plan limits
    PERFORM public.get_assets_for_deactivation(org_id);
END;
$$;

-- Fix get_assets_for_deactivation function
CREATE OR REPLACE FUNCTION public.get_assets_for_deactivation(org_id UUID)
RETURNS TABLE(binding_id UUID, asset_type TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    plan_name TEXT;
    max_ad_accounts INTEGER;
    max_business_managers INTEGER;
    max_pixels INTEGER;
BEGIN
    -- Get organization's current plan
    SELECT plan_id INTO plan_name
    FROM public.organizations
    WHERE organization_id = org_id;
    
    -- Set limits based on plan
    CASE plan_name
        WHEN 'starter' THEN 
            max_ad_accounts := 10;
            max_business_managers := 1;
            max_pixels := 2;
        WHEN 'growth' THEN 
            max_ad_accounts := 20;
            max_business_managers := 3;
            max_pixels := 5;
        WHEN 'scale' THEN 
            max_ad_accounts := 50;
            max_business_managers := 10;
            max_pixels := 10;
        WHEN 'enterprise' THEN 
            max_ad_accounts := -1;
            max_business_managers := -1;
            max_pixels := -1;
        ELSE -- Free plan
            max_ad_accounts := 0;
            max_business_managers := 0;
            max_pixels := 0;
    END CASE;
    
    -- Return assets that should be deactivated
    RETURN QUERY
    SELECT cab.binding_id, da.asset_type
    FROM public.client_asset_bindings cab
    JOIN public.dolphin_assets da ON cab.dolphin_asset_id = da.dolphin_asset_id
    WHERE cab.organization_id = org_id
    AND cab.is_active = true
    AND (
        (da.asset_type = 'ad_account' AND max_ad_accounts >= 0) OR
        (da.asset_type = 'business_manager' AND max_business_managers >= 0) OR
        (da.asset_type = 'pixel' AND max_pixels >= 0)
    );
END;
$$;

-- Fix cleanup_expired_organizations function
CREATE OR REPLACE FUNCTION public.cleanup_expired_organizations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cleanup_count INTEGER := 0;
    retention_days INTEGER;
    org_record RECORD;
BEGIN
    -- Process each organization
    FOR org_record IN 
        SELECT organization_id, plan_id, subscription_status, updated_at
        FROM public.organizations
        WHERE subscription_status IN ('canceled', 'expired')
    LOOP
        -- Calculate retention period
        retention_days := public.calculate_data_retention_period(org_record.plan_id);
        
        -- Check if organization has exceeded retention period
        IF org_record.updated_at < (NOW() - (retention_days || ' days')::INTERVAL) THEN
            -- Deactivate all assets
            UPDATE public.client_asset_bindings
            SET is_active = false, updated_at = NOW()
            WHERE organization_id = org_record.organization_id;
            
            cleanup_count := cleanup_count + 1;
        END IF;
    END LOOP;
    
    RETURN cleanup_count;
END;
$$;

-- Fix calculate_data_retention_period function
DROP FUNCTION IF EXISTS public.calculate_data_retention_period(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.calculate_data_retention_period(plan_name TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    CASE plan_name
        WHEN 'enterprise' THEN RETURN 365;
        WHEN 'scale' THEN RETURN 180;
        WHEN 'growth' THEN RETURN 90;
        WHEN 'starter' THEN RETURN 30;
        ELSE RETURN 7;
    END CASE;
END;
$$;

-- Fix pixel-related functions
CREATE OR REPLACE FUNCTION public.update_pixel_request_status(request_id UUID, new_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.pixel_requests
    SET status = new_status,
        updated_at = NOW()
    WHERE request_id = update_pixel_request_status.request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_pixel_request_exists(org_id UUID, pixel_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.pixel_requests
        WHERE organization_id = org_id
        AND pixel_name = check_pixel_request_exists.pixel_name
        AND status IN ('pending', 'approved', 'processing')
    );
END;
$$;

-- Fix get_organization_pixels function
DROP FUNCTION IF EXISTS public.get_organization_pixels(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.get_organization_pixels(org_id UUID)
RETURNS TABLE(
    binding_id UUID,
    pixel_id TEXT,
    pixel_name TEXT,
    is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cab.binding_id,
        da.facebook_id as pixel_id,
        da.name as pixel_name,
        cab.is_active
    FROM public.client_asset_bindings cab
    JOIN public.dolphin_assets da ON cab.dolphin_asset_id = da.dolphin_asset_id
    WHERE cab.organization_id = org_id
    AND da.asset_type = 'pixel';
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_pixel_connection_request(
    org_id UUID,
    pixel_name TEXT,
    requested_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_request_id UUID;
BEGIN
    new_request_id := gen_random_uuid();
    
    INSERT INTO public.pixel_requests (
        request_id,
        organization_id,
        pixel_name,
        status,
        requested_by,
        created_at
    ) VALUES (
        new_request_id,
        org_id,
        pixel_name,
        'pending',
        requested_by,
        NOW()
    );
    
    RETURN new_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fulfill_pixel_connection_request(
    request_id UUID,
    dolphin_asset_id UUID,
    fulfilled_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Get organization ID from request
    SELECT organization_id INTO org_id
    FROM public.pixel_requests
    WHERE request_id = fulfill_pixel_connection_request.request_id;
    
    -- Create asset binding
    INSERT INTO public.client_asset_bindings (
        binding_id,
        organization_id,
        dolphin_asset_id,
        is_active,
        created_at
    ) VALUES (
        gen_random_uuid(),
        org_id,
        dolphin_asset_id,
        true,
        NOW()
    );
    
    -- Update request status
    UPDATE public.pixel_requests
    SET status = 'fulfilled',
        fulfilled_by = fulfill_pixel_connection_request.fulfilled_by,
        updated_at = NOW()
    WHERE request_id = fulfill_pixel_connection_request.request_id;
END;
$$;

-- Fix domain-related functions
CREATE OR REPLACE FUNCTION public.validate_bm_asset_type(asset_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.dolphin_assets
        WHERE dolphin_asset_id = asset_id
        AND asset_type = 'business_manager'
    );
END;
$$;

-- Fix migrate_promotion_urls_to_bm_domains function
DROP FUNCTION IF EXISTS public.migrate_promotion_urls_to_bm_domains() CASCADE;
CREATE OR REPLACE FUNCTION public.migrate_promotion_urls_to_bm_domains()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    migrated_count INTEGER := 0;
BEGIN
    -- This is a one-time migration function
    RETURN migrated_count;
END;
$$;

-- Fix get_domains_per_bm_limit function
DROP FUNCTION IF EXISTS public.get_domains_per_bm_limit(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.get_domains_per_bm_limit(org_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    plan_name TEXT;
    domain_limit INTEGER;
BEGIN
    SELECT plan_id INTO plan_name
    FROM public.organizations
    WHERE organization_id = org_id;
    
    CASE plan_name
        WHEN 'starter' THEN domain_limit := 2;
        WHEN 'growth' THEN domain_limit := 3;
        WHEN 'scale' THEN domain_limit := 5;
        WHEN 'enterprise' THEN domain_limit := -1;
        ELSE domain_limit := 0;
    END CASE;
    
    RETURN domain_limit;
END;
$$;

-- Fix can_add_domain_to_bm function
DROP FUNCTION IF EXISTS public.can_add_domain_to_bm(UUID, UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.can_add_domain_to_bm(org_id UUID, bm_asset_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_count INTEGER;
    max_limit INTEGER;
BEGIN
    SELECT COUNT(*) INTO current_count
    FROM public.bm_domains
    WHERE bm_asset_id = can_add_domain_to_bm.bm_asset_id
    AND is_active = true;
    
    max_limit := public.get_domains_per_bm_limit(org_id);
    
    IF max_limit = -1 THEN
        RETURN TRUE;
    END IF;
    
    RETURN current_count < max_limit;
END;
$$;

-- Fix dashboard and support functions
DROP FUNCTION IF EXISTS public.get_organization_dashboard_data(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.get_organization_dashboard_data(org_id UUID)
RETURNS TABLE(
    total_ad_accounts BIGINT,
    active_ad_accounts BIGINT,
    total_business_managers BIGINT,
    pending_applications BIGINT,
    wallet_balance_cents INTEGER,
    total_assets BIGINT,
    active_assets BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(aa.total_accounts, 0) as total_ad_accounts,
        COALESCE(aa.active_accounts, 0) as active_ad_accounts,
        COALESCE(bm.total_business_managers, 0) as total_business_managers,
        COALESCE(app.pending_applications, 0) as pending_applications,
        COALESCE(w.balance_cents, 0) as wallet_balance_cents,
        COALESCE(assets.total_assets, 0) as total_assets,
        COALESCE(assets.active_assets, 0) as active_assets
    FROM (SELECT 1) dummy
    LEFT JOIN (
        SELECT 
            COUNT(*) as total_accounts,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_accounts
        FROM public.ad_accounts 
        WHERE organization_id = org_id
    ) aa ON true
    LEFT JOIN (
        SELECT COUNT(*) as total_business_managers
        FROM public.organization_business_managers 
        WHERE organization_id = org_id
    ) bm ON true
    LEFT JOIN (
        SELECT COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_applications
        FROM public.ad_account_applications 
        WHERE organization_id = org_id
    ) app ON true
    LEFT JOIN public.wallets w ON w.organization_id = org_id
    LEFT JOIN (
        SELECT 
            COUNT(*) as total_assets,
            COUNT(CASE WHEN is_active = true THEN 1 END) as active_assets
        FROM public.client_asset_bindings
        WHERE organization_id = org_id
    ) assets ON true;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_asset_names(asset_ids UUID[])
RETURNS TABLE(asset_id UUID, asset_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        da.dolphin_asset_id as asset_id,
        da.name as asset_name
    FROM public.dolphin_assets da
    WHERE da.dolphin_asset_id = ANY(asset_ids);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_ticket_timestamp_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.support_tickets
    SET updated_at = NOW()
    WHERE ticket_id = NEW.ticket_id;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_tickets_with_metadata(org_id UUID)
RETURNS TABLE(
    ticket_id UUID,
    title TEXT,
    description TEXT,
    status TEXT,
    priority TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    asset_names TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        st.ticket_id,
        st.title,
        st.description,
        st.status,
        st.priority,
        st.created_at,
        st.updated_at,
        ARRAY_AGG(da.name) FILTER (WHERE da.name IS NOT NULL) as asset_names
    FROM public.support_tickets st
    LEFT JOIN public.dolphin_assets da ON da.dolphin_asset_id = ANY(st.related_asset_ids)
    WHERE st.organization_id = org_id
    GROUP BY st.ticket_id, st.title, st.description, st.status, st.priority, st.created_at, st.updated_at;
END;
$$;

-- ================================================================================================
-- REMAINING SEARCH PATH WARNINGS FIXED
-- ================================================================================================
-- ✅ Fixed all remaining functions with search_path security issues
-- ✅ All functions now have SET search_path = public
-- ✅ Production security warnings should now be completely resolved
-- ================================================================================================ 
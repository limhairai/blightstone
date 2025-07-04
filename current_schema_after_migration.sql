

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'AdHub comprehensive schema - clean, unified asset management system';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."check_bm_account_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_account_count INTEGER;
    bm_asset_id UUID;
    asset_type TEXT;
BEGIN
    -- Check if this is an ad account binding
    SELECT a.type INTO asset_type
    FROM asset a
    WHERE a.asset_id = NEW.asset_id;

    -- Only enforce limit for ad account bindings
    IF asset_type != 'ad_account' THEN
        RETURN NEW;
    END IF;

    -- Get the business manager asset_id from the binding
    SELECT ab.asset_id INTO bm_asset_id
    FROM asset_binding ab
    JOIN asset a ON ab.asset_id = a.asset_id
    WHERE ab.organization_id = NEW.organization_id 
    AND a.type = 'business_manager'
    AND ab.status = 'active'
    LIMIT 1;

    -- If no BM found, allow (this shouldn't happen in normal flow)
    IF bm_asset_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Count current ad accounts for this organization
    SELECT COUNT(*) INTO current_account_count
    FROM asset_binding ab
    JOIN asset a ON ab.asset_id = a.asset_id
    WHERE ab.organization_id = NEW.organization_id
    AND a.type = 'ad_account'
    AND ab.status = 'active';

    -- Check if adding this account would exceed 5 per BM
    -- Get number of active BMs for this org
    DECLARE
        active_bm_count INTEGER;
        max_allowed_accounts INTEGER;
    BEGIN
        SELECT COUNT(*) INTO active_bm_count
        FROM asset_binding ab
        JOIN asset a ON ab.asset_id = a.asset_id
        WHERE ab.organization_id = NEW.organization_id
        AND a.type = 'business_manager'
        AND ab.status = 'active';

        max_allowed_accounts := active_bm_count * 5;

        IF current_account_count >= max_allowed_accounts THEN
            RAISE EXCEPTION 'Maximum 5 ad accounts per business manager allowed. Current: % accounts, % BMs', 
                current_account_count, active_bm_count;
        END IF;
    END;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_bm_account_limit"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_bm_account_limit"() IS 'Enforces maximum 5 ad accounts per business manager using semantic IDs';



CREATE OR REPLACE FUNCTION "public"."check_organization_subscription_status"("org_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    org_record RECORD;
    plan_record RECORD;
BEGIN
    -- Get organization data
    SELECT * INTO org_record
    FROM organizations
    WHERE organization_id = org_id;
    
    -- If no organization found, return frozen
    IF org_record IS NULL THEN
        RETURN 'frozen';
    END IF;
    
    -- If no plan_id, assign free plan and return free status
    IF org_record.plan_id IS NULL THEN
        -- Auto-assign free plan for new users
        UPDATE organizations 
        SET plan_id = 'free', updated_at = NOW()
        WHERE organization_id = org_id;
        
        RETURN 'free';
    END IF;
    
    -- Check if plan exists - FIX: Use plan_id instead of id
    SELECT * INTO plan_record
    FROM plans
    WHERE plan_id = org_record.plan_id;
    
    -- If plan doesn't exist, freeze the organization
    IF plan_record IS NULL THEN
        RETURN 'frozen';
    END IF;
    
    -- If on free plan, return free status
    IF org_record.plan_id = 'free' THEN
        RETURN 'free';
    END IF;
    
    -- Return current subscription status or active if none set
    RETURN COALESCE(org_record.subscription_status, 'active');
END;
$$;


ALTER FUNCTION "public"."check_organization_subscription_status"("org_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_organization_subscription_status"("org_id" "uuid") IS 'Returns subscription status: active, free, frozen, etc. - Fixed to use plan_id';



CREATE OR REPLACE FUNCTION "public"."check_plan_limits"("org_id" "uuid", "limit_type" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    org_record RECORD;
    plan_record RECORD;
    current_count INTEGER;
BEGIN
    -- Get organization and plan data
    SELECT o.* INTO org_record
    FROM organizations o
    WHERE o.organization_id = org_id;
    
    SELECT p.* INTO plan_record
    FROM plans p
    WHERE p.plan_id = org_record.plan_id;
    
    -- Check specific limit type
    CASE limit_type
        WHEN 'team_members' THEN
            SELECT COUNT(*) INTO current_count 
            FROM organization_members 
            WHERE organization_id = org_id;
            
            RETURN (plan_record.max_team_members = -1 OR current_count < plan_record.max_team_members);
            
        WHEN 'businesses' THEN
            SELECT COUNT(*) INTO current_count 
            FROM asset_binding ab
            JOIN asset a ON ab.asset_id = a.asset_id
            WHERE ab.organization_id = org_id 
            AND a.type = 'business_manager'
            AND ab.status = 'active';
            
            RETURN (plan_record.max_businesses = -1 OR current_count < plan_record.max_businesses);
            
        WHEN 'ad_accounts' THEN
            SELECT COUNT(*) INTO current_count 
            FROM asset_binding ab
            JOIN asset a ON ab.asset_id = a.asset_id
            WHERE ab.organization_id = org_id 
            AND a.type = 'ad_account'
            AND ab.status = 'active';
            
            RETURN (plan_record.max_ad_accounts = -1 OR current_count < plan_record.max_ad_accounts);
            
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$;


ALTER FUNCTION "public"."check_plan_limits"("org_id" "uuid", "limit_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_plan_limits"("org_id" "uuid", "limit_type" "text") IS 'Checks plan limits using semantic IDs for assets and profiles';



CREATE OR REPLACE FUNCTION "public"."complete_topup_transfer"("p_organization_id" "uuid", "p_amount_cents" integer, "p_request_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    wallet_record RECORD;
    available_balance INTEGER;
BEGIN
    -- Get the wallet for this organization
    SELECT * INTO wallet_record 
    FROM wallets 
    WHERE organization_id = p_organization_id;
    
    IF wallet_record IS NULL THEN
        RAISE EXCEPTION 'No wallet found for organization %', p_organization_id;
    END IF;
    
    -- Calculate available balance (total - reserved)
    available_balance := wallet_record.balance_cents - wallet_record.reserved_balance_cents;
    
    -- Check if we have enough available balance (this should always pass since funds were reserved)
    IF wallet_record.reserved_balance_cents < p_amount_cents THEN
        RAISE EXCEPTION 'Insufficient reserved funds. Reserved: %, Required: %', 
            wallet_record.reserved_balance_cents, p_amount_cents;
    END IF;
    
    -- Update wallet: deduct from both balance and reserved balance
    UPDATE wallets 
    SET 
        balance_cents = balance_cents - p_amount_cents,
        reserved_balance_cents = reserved_balance_cents - p_amount_cents,
        updated_at = NOW()
    WHERE organization_id = p_organization_id;
    
    -- Create transaction record
    INSERT INTO transactions (
        organization_id,
        wallet_id,
        type,
        amount_cents,
        status,
        description,
        metadata,
        created_at
    ) VALUES (
        p_organization_id,
        wallet_record.wallet_id,
        'topup_deduction',
        -p_amount_cents, -- Negative for deduction
        'completed',
        CASE 
            WHEN p_request_id IS NOT NULL THEN 'Topup request completed: ' || p_request_id::text
            ELSE 'Manual topup transfer'
        END,
        CASE 
            WHEN p_request_id IS NOT NULL THEN jsonb_build_object('request_id', p_request_id)
            ELSE '{}'::jsonb
        END,
        NOW()
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to complete topup transfer: %', SQLERRM;
        RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."complete_topup_transfer"("p_organization_id" "uuid", "p_amount_cents" integer, "p_request_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."complete_topup_transfer"("p_organization_id" "uuid", "p_amount_cents" integer, "p_request_id" "uuid") IS 'Completes topup by deducting from both balance and reserved, and creates transaction record';



CREATE OR REPLACE FUNCTION "public"."fulfill_application"("p_application_id" "uuid", "p_asset_ids" "uuid"[], "p_admin_user_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    app_record public.application%ROWTYPE;
    asset_id UUID;
    binding_id UUID;
    result JSON;
BEGIN
    -- Get application details using semantic ID
    SELECT * INTO app_record FROM public.application WHERE application_id = p_application_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Application not found');
    END IF;
    
    IF app_record.status != 'processing' THEN
        RETURN json_build_object('success', false, 'error', 'Application must be in processing status');
    END IF;
    
    -- Bind each asset to the organization
    FOREACH asset_id IN ARRAY p_asset_ids
    LOOP
        INSERT INTO public.asset_binding (asset_id, organization_id, bound_by)
        VALUES (asset_id, app_record.organization_id, p_admin_user_id)
        RETURNING binding_id INTO binding_id;
        
        -- Track fulfillment using semantic IDs
        INSERT INTO public.application_fulfillment (application_ref_id, asset_ref_id)
        VALUES (p_application_id, asset_id);
    END LOOP;
    
    -- Update application status using semantic ID
    UPDATE public.application 
    SET status = 'fulfilled',
        fulfilled_by = p_admin_user_id,
        fulfilled_at = NOW(),
        updated_at = NOW()
    WHERE application_id = p_application_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Application fulfilled successfully',
        'assets_bound', array_length(p_asset_ids, 1)
    );
END;
$$;


ALTER FUNCTION "public"."fulfill_application"("p_application_id" "uuid", "p_asset_ids" "uuid"[], "p_admin_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fulfill_application"("p_application_id" "uuid", "p_asset_ids" "uuid"[], "p_admin_user_id" "uuid") IS 'Fulfills application using semantic IDs';



CREATE OR REPLACE FUNCTION "public"."get_applications"() RETURNS TABLE("id" "uuid", "organization_id" "uuid", "organization_name" "text", "name" "text", "request_type" "text", "target_bm_dolphin_id" "text", "website_url" "text", "status" "text", "approved_by" "uuid", "approved_at" timestamp with time zone, "rejected_by" "uuid", "rejected_at" timestamp with time zone, "fulfilled_by" "uuid", "fulfilled_at" timestamp with time zone, "client_notes" "text", "admin_notes" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "approved_by_name" "text", "rejected_by_name" "text", "fulfilled_by_name" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.application_id as id,
        a.organization_id,
        o.name as organization_name,
        a.name,
        a.request_type,
        a.target_bm_dolphin_id,
        a.website_url,
        a.status,
        a.approved_by,
        a.approved_at,
        a.rejected_by,
        a.rejected_at,
        a.fulfilled_by,
        a.fulfilled_at,
        a.client_notes,
        a.admin_notes,
        a.created_at,
        a.updated_at,
        ap.name as approved_by_name,
        rp.name as rejected_by_name,
        fp.name as fulfilled_by_name
    FROM public.application a
    LEFT JOIN public.organizations o ON a.organization_id = o.organization_id
    LEFT JOIN public.profiles ap ON a.approved_by = ap.profile_id
    LEFT JOIN public.profiles rp ON a.rejected_by = rp.profile_id
    LEFT JOIN public.profiles fp ON a.fulfilled_by = fp.profile_id
    ORDER BY a.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_applications"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_applications"() IS 'Returns all applications with semantic ID compatibility';



CREATE OR REPLACE FUNCTION "public"."get_available_assets"("p_asset_type" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "type" "text", "dolphin_id" "text", "name" "text", "status" "text", "metadata" "jsonb", "last_synced_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.asset_id as id,
        a.type,
        a.dolphin_id,
        a.name,
        a.status,
        a.metadata,
        a.last_synced_at
    FROM public.asset a
    WHERE NOT EXISTS (
        SELECT 1 FROM public.asset_binding ab 
        WHERE ab.asset_id = a.asset_id AND ab.status = 'active'
    )
    AND a.status = 'active'
    AND (p_asset_type IS NULL OR a.type = p_asset_type)
    ORDER BY a.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_available_assets"("p_asset_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_available_assets"("p_asset_type" "text") IS 'Returns available assets using semantic IDs';



CREATE OR REPLACE FUNCTION "public"."get_available_assets"("p_asset_type" "text" DEFAULT NULL::"text", "p_unbound_only" boolean DEFAULT false) RETURNS TABLE("asset_id" "uuid", "type" "text", "dolphin_id" "text", "name" "text", "status" "text", "metadata" "jsonb", "last_synced_at" timestamp with time zone, "is_bound" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if the calling user is a superuser
    IF (SELECT p.is_superuser FROM public.profiles p WHERE p.profile_id = auth.uid()) IS NOT TRUE THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        a.asset_id,
        a.type,
        a.dolphin_id,
        a.name,
        a.status,
        a.metadata,
        a.last_synced_at,
        EXISTS(
            SELECT 1 FROM public.asset_binding ab 
            WHERE ab.asset_id = a.asset_id AND ab.status = 'active'
        ) as is_bound
    FROM
        public.asset a
    WHERE
        a.status = 'active'
        AND (p_asset_type IS NULL OR a.type = p_asset_type)
        AND (NOT p_unbound_only OR NOT EXISTS(
            SELECT 1 FROM public.asset_binding ab 
            WHERE ab.asset_id = a.asset_id AND ab.status = 'active'
        ))
    ORDER BY
        a.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_available_assets"("p_asset_type" "text", "p_unbound_only" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_available_balance"("wallet_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE
    AS $_$
    SELECT balance_cents - reserved_balance_cents
    FROM public.wallets
    WHERE wallet_id = $1;
$_$;


ALTER FUNCTION "public"."get_available_balance"("wallet_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_available_balance"("wallet_id" "uuid") IS 'Returns available balance (total - reserved)';



CREATE OR REPLACE FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "type" "text", "dolphin_id" "text", "name" "text", "status" "text", "metadata" "jsonb", "last_synced_at" timestamp with time zone, "binding_id" "uuid", "bound_at" timestamp with time zone, "bound_by" "uuid")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.asset_id as id,
        a.type,
        a.dolphin_id,
        a.name,
        a.status,
        a.metadata,
        a.last_synced_at,
        ab.binding_id,
        ab.bound_at,
        ab.bound_by
    FROM public.asset a
    INNER JOIN public.asset_binding ab ON a.asset_id = ab.asset_id
    WHERE ab.organization_id = p_organization_id
    AND ab.status = 'active'
    AND (p_asset_type IS NULL OR a.type = p_asset_type)
    ORDER BY ab.bound_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text") IS 'Returns organization assets using semantic IDs';



CREATE OR REPLACE FUNCTION "public"."handle_funding_request_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only handle topup requests (identified by notes containing "Top-up request")
    IF NEW.notes IS NULL OR NEW.notes NOT LIKE '%Top-up request%' THEN
        RETURN NEW;
    END IF;
    
    -- On INSERT (new request)
    IF TG_OP = 'INSERT' THEN
        -- Reserve funds
        IF NOT public.reserve_funds_for_topup(NEW.organization_id, NEW.requested_amount_cents) THEN
            RAISE EXCEPTION 'Insufficient available balance for topup request';
        END IF;
        RETURN NEW;
    END IF;
    
    -- On UPDATE (status change)
    IF TG_OP = 'UPDATE' THEN
        -- If request was cancelled or rejected, release reserved funds
        IF OLD.status = 'pending' AND NEW.status IN ('rejected', 'cancelled') THEN
            PERFORM public.release_reserved_funds(NEW.organization_id, NEW.requested_amount_cents);
        END IF;
        
        -- If request was approved/completed, complete the transfer and create transaction
        IF OLD.status IN ('pending', 'processing') AND NEW.status = 'approved' THEN
            PERFORM public.complete_topup_transfer(NEW.organization_id, NEW.requested_amount_cents, NEW.request_id);
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_funding_request_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_org_id UUID;
  user_email TEXT;
  new_org_name TEXT;
BEGIN
  -- Get the email from the NEW record
  user_email := NEW.email;
  
  -- Create a user-friendly default organization name
  new_org_name := split_part(user_email, '@', 1) || '''s Team';

  -- Create a new organization for the user
  INSERT INTO public.organizations (name, owner_id)
  VALUES (new_org_name, NEW.id)
  RETURNING organization_id INTO new_org_id;

  -- Create the user's profile, linking it to the new organization
  INSERT INTO public.profiles(profile_id, organization_id, email, role)
  VALUES (NEW.id, new_org_id, user_email, 'client');
  
  -- Add the user to the organization as a member with the 'owner' role
  INSERT INTO public.organization_members(user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');
  
  -- Create a wallet for the organization
  INSERT INTO public.wallets(organization_id)
  VALUES (new_org_id);
  
  -- Inject the organization_id into the user's app_metadata for easy access on the client
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('organization_id', new_org_id)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_subscription_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update organization subscription status
    UPDATE organizations 
    SET 
        subscription_status = NEW.status,
        current_period_start = NEW.current_period_start,
        current_period_end = NEW.current_period_end,
        updated_at = NOW()
    WHERE organization_id = NEW.organization_id;
    
    -- Handle payment failures
    IF NEW.status = 'past_due' AND OLD.status != 'past_due' THEN
        -- Create admin task for payment failure
        INSERT INTO admin_tasks (type, organization_id, title, description, priority, metadata)
        VALUES (
            'payment_failed',
            NEW.organization_id,
            'Payment Failed',
            'Subscription payment failed - review account',
            'high',
            jsonb_build_object('stripe_subscription_id', NEW.stripe_subscription_id)
        );
    END IF;
    
    -- Handle account freezing after grace period
    IF NEW.status = 'unpaid' THEN
        UPDATE organizations 
        SET 
            subscription_status = 'frozen',
            frozen_at = NOW(),
            can_topup = FALSE,
            can_request_assets = FALSE
        WHERE organization_id = NEW.organization_id;
        
        -- Create admin task
        INSERT INTO admin_tasks (type, organization_id, title, description, priority)
        VALUES (
            'account_frozen',
            NEW.organization_id,
            'Account Frozen',
            'Account frozen due to payment failure',
            'high'
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_subscription_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_topup_request_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    org_record RECORD;
    wallet_record RECORD;
    amount_to_reserve INTEGER;
    amount_to_release INTEGER;
BEGIN
    -- Get organization and wallet info
    SELECT * INTO org_record FROM organizations WHERE organization_id = COALESCE(NEW.organization_id, OLD.organization_id);
    SELECT * INTO wallet_record FROM wallets WHERE organization_id = org_record.organization_id;
    
    -- Handle INSERT (new topup request)
    IF TG_OP = 'INSERT' THEN
        -- Calculate total amount to reserve (including fees)
        amount_to_reserve := NEW.total_deducted_cents;
        
        -- Reserve funds in wallet
        IF NOT reserve_funds_for_topup(NEW.organization_id, amount_to_reserve) THEN
            RAISE EXCEPTION 'Insufficient funds to reserve for topup request. Available: %, Required: %', 
                (wallet_record.balance_cents - wallet_record.reserved_balance_cents), amount_to_reserve;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE (status changes)
    IF TG_OP = 'UPDATE' THEN
        -- If status changed from pending to completed, process the transfer
        IF OLD.status = 'pending' AND NEW.status = 'completed' THEN
            -- Complete the transfer (this will release reserved funds and deduct from balance)
            IF NOT complete_topup_transfer(NEW.organization_id, NEW.total_deducted_cents, NEW.request_id) THEN
                RAISE EXCEPTION 'Failed to complete topup transfer for request %', NEW.request_id;
            END IF;
        END IF;
        
        -- If status changed from pending to failed/cancelled, release reserved funds
        IF OLD.status = 'pending' AND NEW.status IN ('failed', 'cancelled') THEN
            amount_to_release := OLD.total_deducted_cents;
            
            IF NOT release_reserved_funds(OLD.organization_id, amount_to_release) THEN
                RAISE EXCEPTION 'Failed to release reserved funds for cancelled/failed request %', OLD.request_id;
            END IF;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE (cleanup reserved funds)
    IF TG_OP = 'DELETE' THEN
        -- If deleting a pending request, release reserved funds
        IF OLD.status = 'pending' THEN
            amount_to_release := OLD.total_deducted_cents;
            
            IF NOT release_reserved_funds(OLD.organization_id, amount_to_release) THEN
                RAISE EXCEPTION 'Failed to release reserved funds for deleted request %', OLD.request_id;
            END IF;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."handle_topup_request_changes"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_topup_request_changes"() IS 'Debug version of topup request trigger function';



CREATE OR REPLACE FUNCTION "public"."release_reserved_funds"("p_organization_id" "uuid", "p_amount_cents" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_wallet_id UUID;
BEGIN
    -- Get wallet for organization
    SELECT wallet_id INTO v_wallet_id
    FROM public.wallets
    WHERE organization_id = p_organization_id;
    
    IF v_wallet_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Release the reserved funds
    UPDATE public.wallets
    SET reserved_balance_cents = GREATEST(0, reserved_balance_cents - p_amount_cents),
        updated_at = NOW()
    WHERE wallet_id = v_wallet_id;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."release_reserved_funds"("p_organization_id" "uuid", "p_amount_cents" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."release_reserved_funds"("p_organization_id" "uuid", "p_amount_cents" integer) IS 'Releases reserved funds when request is cancelled/rejected';



CREATE OR REPLACE FUNCTION "public"."reserve_funds_for_topup"("p_organization_id" "uuid", "p_amount_cents" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_wallet_id UUID;
    v_available_balance INTEGER;
BEGIN
    -- Get wallet for organization
    SELECT wallet_id INTO v_wallet_id
    FROM public.wallets
    WHERE organization_id = p_organization_id;
    
    IF v_wallet_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get current available balance
    SELECT get_available_balance(v_wallet_id) INTO v_available_balance;
    
    -- Check if sufficient funds available
    IF v_available_balance < p_amount_cents THEN
        RETURN FALSE;
    END IF;
    
    -- Reserve the funds
    UPDATE public.wallets
    SET reserved_balance_cents = reserved_balance_cents + p_amount_cents,
        updated_at = NOW()
    WHERE wallet_id = v_wallet_id;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."reserve_funds_for_topup"("p_organization_id" "uuid", "p_amount_cents" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reserve_funds_for_topup"("p_organization_id" "uuid", "p_amount_cents" integer) IS 'Reserves funds for a topup request';



CREATE OR REPLACE FUNCTION "public"."set_organization_freeze_status"("org_id" "uuid", "should_freeze" boolean, "reason" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF should_freeze THEN
        -- Freeze the organization
        UPDATE organizations 
        SET 
            subscription_status = 'frozen',
            can_topup = FALSE,
            can_request_assets = FALSE,
            frozen_at = NOW(),
            updated_at = NOW()
        WHERE organization_id = org_id;
        
        -- Create admin task for manual review
        INSERT INTO admin_tasks (type, organization_id, title, description, priority, metadata)
        VALUES (
            'organization_frozen',
            org_id,
            'Organization Frozen',
            COALESCE(reason, 'Organization frozen due to subscription issues'),
            'high',
            jsonb_build_object('freeze_reason', reason, 'frozen_at', NOW())
        );
    ELSE
        -- Unfreeze the organization
        UPDATE organizations 
        SET 
            subscription_status = 'active',
            can_topup = TRUE,
            can_request_assets = TRUE,
            frozen_at = NULL,
            updated_at = NOW()
        WHERE organization_id = org_id;
    END IF;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."set_organization_freeze_status"("org_id" "uuid", "should_freeze" boolean, "reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_organization_freeze_status"("org_id" "uuid", "should_freeze" boolean, "reason" "text") IS 'Freezes or unfreezes an organization based on subscription status';



CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_tasks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "text" NOT NULL,
    "organization_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "priority" "text" DEFAULT 'medium'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "assigned_to" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."admin_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."application" (
    "organization_id" "uuid" NOT NULL,
    "name" "text",
    "request_type" "text" NOT NULL,
    "target_bm_dolphin_id" "text",
    "website_url" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejected_by" "uuid",
    "rejected_at" timestamp with time zone,
    "fulfilled_by" "uuid",
    "fulfilled_at" timestamp with time zone,
    "client_notes" "text",
    "admin_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "application_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    CONSTRAINT "application_request_type_check" CHECK (("request_type" = ANY (ARRAY['new_business_manager'::"text", 'additional_accounts'::"text"]))),
    CONSTRAINT "application_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'processing'::"text", 'rejected'::"text", 'fulfilled'::"text"])))
);


ALTER TABLE "public"."application" OWNER TO "postgres";


COMMENT ON TABLE "public"."application" IS 'Applications table - uses semantic ID (application_id) for clarity';



CREATE TABLE IF NOT EXISTS "public"."application_fulfillment" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fulfillment_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid",
    "asset_id" "uuid"
);


ALTER TABLE "public"."application_fulfillment" OWNER TO "postgres";


COMMENT ON TABLE "public"."application_fulfillment" IS 'Application fulfillment table - uses semantic ID (fulfillment_id) for clarity';



CREATE TABLE IF NOT EXISTS "public"."asset" (
    "type" "text" NOT NULL,
    "dolphin_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "metadata" "jsonb",
    "last_synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "asset_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    CONSTRAINT "asset_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'suspended'::"text", 'restricted'::"text"]))),
    CONSTRAINT "asset_type_check" CHECK (("type" = ANY (ARRAY['business_manager'::"text", 'ad_account'::"text", 'profile'::"text"])))
);


ALTER TABLE "public"."asset" OWNER TO "postgres";


COMMENT ON TABLE "public"."asset" IS 'Assets table - uses semantic ID (asset_id) for clarity';



CREATE TABLE IF NOT EXISTS "public"."asset_binding" (
    "organization_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "bound_by" "uuid" NOT NULL,
    "bound_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "binding_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "asset_id" "uuid",
    CONSTRAINT "asset_binding_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."asset_binding" OWNER TO "postgres";


COMMENT ON TABLE "public"."asset_binding" IS 'Asset bindings table - uses semantic ID (binding_id) for clarity';



CREATE TABLE IF NOT EXISTS "public"."funding_requests" (
    "request_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "requested_amount_cents" integer NOT NULL,
    "approved_amount_cents" integer,
    "notes" "text",
    "admin_notes" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "funding_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."funding_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_states" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "has_explicitly_dismissed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."onboarding_states" OWNER TO "postgres";


COMMENT ON TABLE "public"."onboarding_states" IS 'Tracks user onboarding progress and dismissal state';



CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."organization_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "organization_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "plan_id" "text",
    "avatar_url" "text",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "stripe_subscription_status" "text",
    "team_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "subscription_status" "text" DEFAULT 'active'::"text",
    "frozen_at" timestamp with time zone,
    "can_topup" boolean DEFAULT true,
    "can_request_assets" boolean DEFAULT true,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "trial_end" timestamp with time zone
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "plan_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "monthly_subscription_fee_cents" integer NOT NULL,
    "ad_spend_fee_percentage" numeric(5,2) NOT NULL,
    "max_team_members" integer NOT NULL,
    "max_businesses" integer NOT NULL,
    "max_ad_accounts" integer NOT NULL,
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "stripe_price_id" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "organization_id" "uuid",
    "name" "text",
    "email" "text",
    "role" "text" DEFAULT 'client'::"text",
    "is_superuser" boolean DEFAULT false,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "profile_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'Profiles table - uses semantic ID (profile_id) for clarity';



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "plan_id" "text" NOT NULL,
    "stripe_subscription_id" "text",
    "stripe_customer_id" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false,
    "canceled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."topup_requests" (
    "organization_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "ad_account_id" "text" NOT NULL,
    "ad_account_name" "text" NOT NULL,
    "amount_cents" integer NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "priority" "text" DEFAULT 'normal'::"text" NOT NULL,
    "notes" "text",
    "admin_notes" "text",
    "processed_by" "uuid",
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "fee_amount_cents" integer DEFAULT 0,
    "total_deducted_cents" integer DEFAULT 0,
    "plan_fee_percentage" numeric(5,2) DEFAULT 0,
    "approved_amount_cents" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "request_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    CONSTRAINT "topup_requests_amount_cents_check" CHECK (("amount_cents" > 0)),
    CONSTRAINT "topup_requests_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "topup_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."topup_requests" OWNER TO "postgres";


COMMENT ON COLUMN "public"."topup_requests"."approved_amount_cents" IS 'Amount approved by admin (may differ from requested amount)';



COMMENT ON COLUMN "public"."topup_requests"."metadata" IS 'Additional metadata including business manager information';



CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "transaction_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "wallet_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "amount_cents" integer NOT NULL,
    "status" "text" DEFAULT 'completed'::"text",
    "description" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "wallet_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "balance_cents" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "reserved_balance_cents" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "wallets_reserved_balance_check" CHECK ((("reserved_balance_cents" >= 0) AND ("reserved_balance_cents" <= "balance_cents")))
);


ALTER TABLE "public"."wallets" OWNER TO "postgres";


COMMENT ON COLUMN "public"."wallets"."reserved_balance_cents" IS 'Amount reserved for pending topup requests';



ALTER TABLE ONLY "public"."admin_tasks"
    ADD CONSTRAINT "admin_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."application_fulfillment"
    ADD CONSTRAINT "application_fulfillment_application_asset_unique" UNIQUE ("application_id", "asset_id");



ALTER TABLE ONLY "public"."application_fulfillment"
    ADD CONSTRAINT "application_fulfillment_pkey" PRIMARY KEY ("fulfillment_id");



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_pkey" PRIMARY KEY ("application_id");



ALTER TABLE ONLY "public"."asset_binding"
    ADD CONSTRAINT "asset_binding_pkey" PRIMARY KEY ("binding_id");



ALTER TABLE ONLY "public"."asset"
    ADD CONSTRAINT "asset_pkey" PRIMARY KEY ("asset_id");



ALTER TABLE ONLY "public"."asset"
    ADD CONSTRAINT "asset_type_dolphin_id_key" UNIQUE ("type", "dolphin_id");



ALTER TABLE ONLY "public"."asset"
    ADD CONSTRAINT "asset_type_dolphin_id_unique" UNIQUE ("type", "dolphin_id");



ALTER TABLE ONLY "public"."funding_requests"
    ADD CONSTRAINT "funding_requests_pkey" PRIMARY KEY ("request_id");



ALTER TABLE ONLY "public"."onboarding_states"
    ADD CONSTRAINT "onboarding_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_states"
    ADD CONSTRAINT "onboarding_states_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("user_id", "organization_id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("organization_id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("plan_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("profile_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."topup_requests"
    ADD CONSTRAINT "topup_requests_pkey" PRIMARY KEY ("request_id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("transaction_id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_organization_id_key" UNIQUE ("organization_id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("wallet_id");



CREATE INDEX "idx_admin_tasks_organization" ON "public"."admin_tasks" USING "btree" ("organization_id");



CREATE INDEX "idx_admin_tasks_status" ON "public"."admin_tasks" USING "btree" ("status");



CREATE INDEX "idx_application_created_at" ON "public"."application" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_application_fulfillment_application_ref_id" ON "public"."application_fulfillment" USING "btree" ("application_id");



CREATE INDEX "idx_application_fulfillment_asset_ref_id" ON "public"."application_fulfillment" USING "btree" ("asset_id");



CREATE INDEX "idx_application_name" ON "public"."application" USING "btree" ("name");



CREATE INDEX "idx_application_organization_id" ON "public"."application" USING "btree" ("organization_id");



CREATE INDEX "idx_application_request_type" ON "public"."application" USING "btree" ("request_type");



CREATE INDEX "idx_application_status" ON "public"."application" USING "btree" ("status");



CREATE INDEX "idx_asset_binding_asset_ref_id" ON "public"."asset_binding" USING "btree" ("asset_id");



CREATE INDEX "idx_asset_binding_organization_id" ON "public"."asset_binding" USING "btree" ("organization_id");



CREATE INDEX "idx_asset_binding_status" ON "public"."asset_binding" USING "btree" ("status");



CREATE INDEX "idx_asset_dolphin_id" ON "public"."asset" USING "btree" ("dolphin_id");



CREATE INDEX "idx_asset_metadata_gin" ON "public"."asset" USING "gin" ("metadata");



CREATE INDEX "idx_asset_status" ON "public"."asset" USING "btree" ("status");



CREATE INDEX "idx_asset_type" ON "public"."asset" USING "btree" ("type");



CREATE INDEX "idx_funding_requests_organization_id" ON "public"."funding_requests" USING "btree" ("organization_id");



CREATE INDEX "idx_onboarding_states_user_id" ON "public"."onboarding_states" USING "btree" ("user_id");



CREATE INDEX "idx_organization_members_organization_id" ON "public"."organization_members" USING "btree" ("organization_id");



CREATE INDEX "idx_organization_members_user_id" ON "public"."organization_members" USING "btree" ("user_id");



CREATE INDEX "idx_organizations_owner_id" ON "public"."organizations" USING "btree" ("owner_id");



CREATE INDEX "idx_organizations_plan_id" ON "public"."organizations" USING "btree" ("plan_id");



CREATE INDEX "idx_organizations_subscription_status" ON "public"."organizations" USING "btree" ("subscription_status");



CREATE INDEX "idx_profiles_organization_id" ON "public"."profiles" USING "btree" ("organization_id");



CREATE INDEX "idx_subscriptions_stripe_id" ON "public"."subscriptions" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_topup_requests_created_at" ON "public"."topup_requests" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_topup_requests_metadata" ON "public"."topup_requests" USING "gin" ("metadata");



CREATE INDEX "idx_topup_requests_organization_id" ON "public"."topup_requests" USING "btree" ("organization_id");



CREATE INDEX "idx_topup_requests_request_id" ON "public"."topup_requests" USING "btree" ("request_id");



CREATE INDEX "idx_topup_requests_status" ON "public"."topup_requests" USING "btree" ("status");



CREATE INDEX "idx_transactions_organization_id" ON "public"."transactions" USING "btree" ("organization_id");



CREATE INDEX "idx_wallets_organization_id" ON "public"."wallets" USING "btree" ("organization_id");



CREATE INDEX "idx_wallets_reserved_balance" ON "public"."wallets" USING "btree" ("reserved_balance_cents");



CREATE OR REPLACE TRIGGER "enforce_bm_account_limit" BEFORE INSERT OR UPDATE ON "public"."asset_binding" FOR EACH ROW WHEN (("new"."status" = 'active'::"text")) EXECUTE FUNCTION "public"."check_bm_account_limit"();



CREATE OR REPLACE TRIGGER "set_updated_at_application" BEFORE UPDATE ON "public"."application" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_asset" BEFORE UPDATE ON "public"."asset" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_asset_binding" BEFORE UPDATE ON "public"."asset_binding" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_profiles" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "subscription_status_change" AFTER UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_subscription_change"();



CREATE OR REPLACE TRIGGER "topup_request_balance_trigger" AFTER INSERT OR UPDATE ON "public"."topup_requests" FOR EACH ROW EXECUTE FUNCTION "public"."handle_topup_request_changes"();



CREATE OR REPLACE TRIGGER "update_application_updated_at" BEFORE UPDATE ON "public"."application" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_asset_binding_updated_at" BEFORE UPDATE ON "public"."asset_binding" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_asset_updated_at" BEFORE UPDATE ON "public"."asset" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_onboarding_states_updated_at" BEFORE UPDATE ON "public"."onboarding_states" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_topup_requests_updated_at" BEFORE UPDATE ON "public"."topup_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."admin_tasks"
    ADD CONSTRAINT "admin_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."admin_tasks"
    ADD CONSTRAINT "admin_tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_fulfilled_by_fkey" FOREIGN KEY ("fulfilled_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."application_fulfillment"
    ADD CONSTRAINT "application_fulfillment_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."application"("application_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_fulfillment"
    ADD CONSTRAINT "application_fulfillment_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



COMMENT ON CONSTRAINT "application_organization_id_fkey" ON "public"."application" IS 'Foreign key relationship between application and organizations using semantic IDs';



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."asset_binding"
    ADD CONSTRAINT "asset_binding_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."asset_binding"
    ADD CONSTRAINT "asset_binding_bound_by_fkey" FOREIGN KEY ("bound_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."asset_binding"
    ADD CONSTRAINT "asset_binding_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funding_requests"
    ADD CONSTRAINT "funding_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funding_requests"
    ADD CONSTRAINT "funding_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_states"
    ADD CONSTRAINT "onboarding_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("plan_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("plan_id");



ALTER TABLE ONLY "public"."topup_requests"
    ADD CONSTRAINT "topup_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."topup_requests"
    ADD CONSTRAINT "topup_requests_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."topup_requests"
    ADD CONSTRAINT "topup_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("wallet_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all onboarding states" ON "public"."onboarding_states" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."profile_id" = "auth"."uid"()) AND ("profiles"."is_superuser" = true)))));



COMMENT ON POLICY "Admins can manage all onboarding states" ON "public"."onboarding_states" IS 'Allows superuser profiles to manage all onboarding states';



CREATE POLICY "Admins can manage all topup requests" ON "public"."topup_requests" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."profile_id" = "auth"."uid"()) AND ("profiles"."is_superuser" = true)))));



COMMENT ON POLICY "Admins can manage all topup requests" ON "public"."topup_requests" IS 'Allows superuser profiles to manage all topup requests';



CREATE POLICY "Admins can update all topup requests" ON "public"."topup_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."profile_id" = "auth"."uid"()) AND ("profiles"."is_superuser" = true)))));



CREATE POLICY "Admins can view all topup requests" ON "public"."topup_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."profile_id" = "auth"."uid"()) AND ("profiles"."is_superuser" = true)))));



CREATE POLICY "Users can create topup requests" ON "public"."topup_requests" FOR INSERT WITH CHECK ((("organization_id" IN ( SELECT "organizations"."organization_id"
   FROM "public"."organizations"
  WHERE ("organizations"."owner_id" = "auth"."uid"())
UNION
 SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))) AND ("requested_by" = "auth"."uid"())));



CREATE POLICY "Users can create topup requests for their organization" ON "public"."topup_requests" FOR INSERT WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert own onboarding state" ON "public"."onboarding_states" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own onboarding state" ON "public"."onboarding_states" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own pending topup requests" ON "public"."topup_requests" FOR UPDATE USING ((("requested_by" = "auth"."uid"()) AND ("status" = 'pending'::"text") AND ("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own onboarding state" ON "public"."onboarding_states" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own organization topup requests" ON "public"."topup_requests" FOR SELECT USING (("organization_id" IN ( SELECT "organizations"."organization_id"
   FROM "public"."organizations"
  WHERE ("organizations"."owner_id" = "auth"."uid"())
UNION
 SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their organization's topup requests" ON "public"."topup_requests" FOR SELECT USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."onboarding_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."topup_requests" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."check_bm_account_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_bm_account_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_bm_account_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_organization_subscription_status"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_organization_subscription_status"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_organization_subscription_status"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_plan_limits"("org_id" "uuid", "limit_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_plan_limits"("org_id" "uuid", "limit_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_plan_limits"("org_id" "uuid", "limit_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_topup_transfer"("p_organization_id" "uuid", "p_amount_cents" integer, "p_request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_topup_transfer"("p_organization_id" "uuid", "p_amount_cents" integer, "p_request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_topup_transfer"("p_organization_id" "uuid", "p_amount_cents" integer, "p_request_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fulfill_application"("p_application_id" "uuid", "p_asset_ids" "uuid"[], "p_admin_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fulfill_application"("p_application_id" "uuid", "p_asset_ids" "uuid"[], "p_admin_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fulfill_application"("p_application_id" "uuid", "p_asset_ids" "uuid"[], "p_admin_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_applications"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_applications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_applications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_assets"("p_asset_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_assets"("p_asset_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_assets"("p_asset_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_assets"("p_asset_type" "text", "p_unbound_only" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_assets"("p_asset_type" "text", "p_unbound_only" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_assets"("p_asset_type" "text", "p_unbound_only" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_balance"("wallet_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_balance"("wallet_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_balance"("wallet_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_funding_request_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_funding_request_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_funding_request_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_subscription_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_subscription_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_subscription_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_topup_request_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_topup_request_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_topup_request_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."release_reserved_funds"("p_organization_id" "uuid", "p_amount_cents" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."release_reserved_funds"("p_organization_id" "uuid", "p_amount_cents" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."release_reserved_funds"("p_organization_id" "uuid", "p_amount_cents" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."reserve_funds_for_topup"("p_organization_id" "uuid", "p_amount_cents" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."reserve_funds_for_topup"("p_organization_id" "uuid", "p_amount_cents" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reserve_funds_for_topup"("p_organization_id" "uuid", "p_amount_cents" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_organization_freeze_status"("org_id" "uuid", "should_freeze" boolean, "reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_organization_freeze_status"("org_id" "uuid", "should_freeze" boolean, "reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_organization_freeze_status"("org_id" "uuid", "should_freeze" boolean, "reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_tasks" TO "anon";
GRANT ALL ON TABLE "public"."admin_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."application" TO "anon";
GRANT ALL ON TABLE "public"."application" TO "authenticated";
GRANT ALL ON TABLE "public"."application" TO "service_role";



GRANT ALL ON TABLE "public"."application_fulfillment" TO "anon";
GRANT ALL ON TABLE "public"."application_fulfillment" TO "authenticated";
GRANT ALL ON TABLE "public"."application_fulfillment" TO "service_role";



GRANT ALL ON TABLE "public"."asset" TO "anon";
GRANT ALL ON TABLE "public"."asset" TO "authenticated";
GRANT ALL ON TABLE "public"."asset" TO "service_role";



GRANT ALL ON TABLE "public"."asset_binding" TO "anon";
GRANT ALL ON TABLE "public"."asset_binding" TO "authenticated";
GRANT ALL ON TABLE "public"."asset_binding" TO "service_role";



GRANT ALL ON TABLE "public"."funding_requests" TO "anon";
GRANT ALL ON TABLE "public"."funding_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."funding_requests" TO "service_role";



GRANT ALL ON TABLE "public"."onboarding_states" TO "anon";
GRANT ALL ON TABLE "public"."onboarding_states" TO "authenticated";
GRANT ALL ON TABLE "public"."onboarding_states" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."plans" TO "anon";
GRANT ALL ON TABLE "public"."plans" TO "authenticated";
GRANT ALL ON TABLE "public"."plans" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."topup_requests" TO "anon";
GRANT ALL ON TABLE "public"."topup_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."topup_requests" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."wallets" TO "anon";
GRANT ALL ON TABLE "public"."wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."wallets" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;



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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'Performance indexes added';



CREATE OR REPLACE FUNCTION "public"."calculate_data_retention_period"("plan_id" "text") RETURNS interval
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN CASE 
        WHEN plan_id = 'starter' THEN INTERVAL '7 days'
        WHEN plan_id = 'growth' THEN INTERVAL '30 days'
        WHEN plan_id = 'scale' THEN INTERVAL '90 days'
        WHEN plan_id = 'enterprise' THEN INTERVAL '180 days'
        ELSE INTERVAL '7 days' -- Default fallback
    END;
END;
$$;


ALTER FUNCTION "public"."calculate_data_retention_period"("plan_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_add_domain_to_bm"("p_bm_asset_id" "uuid", "p_organization_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_count INTEGER;
    limit_per_bm INTEGER;
BEGIN
    -- Get current domain count for this BM
    SELECT get_bm_domain_count(p_bm_asset_id) INTO current_count;
    
    -- Get the limit per BM for this organization's plan
    SELECT get_domains_per_bm_limit(p_organization_id) INTO limit_per_bm;
    
    -- -1 means unlimited
    IF limit_per_bm = -1 THEN
        RETURN TRUE;
    END IF;
    
    -- Check if under limit
    RETURN current_count < limit_per_bm;
END;
$$;


ALTER FUNCTION "public"."can_add_domain_to_bm"("p_bm_asset_id" "uuid", "p_organization_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_add_domain_to_bm"("p_bm_asset_id" "uuid", "p_organization_id" "uuid") IS 'Checks if a Business Manager can add more domains based on plan limits';



CREATE OR REPLACE FUNCTION "public"."check_organization_membership"("p_user_id" "uuid", "p_organization_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  -- Use SECURITY DEFINER to bypass RLS when checking membership
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE user_id = p_user_id AND organization_id = p_organization_id
  );
$$;


ALTER FUNCTION "public"."check_organization_membership"("p_user_id" "uuid", "p_organization_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_organization_membership"("p_user_id" "uuid", "p_organization_id" "uuid") IS 'SECURITY DEFINER function to check organization membership without RLS recursion';



CREATE OR REPLACE FUNCTION "public"."check_pixel_request_exists"("p_organization_id" "uuid", "p_pixel_id" "text", "p_business_manager_id" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Check for existing pending/processing requests for same pixel+BM combination
    SELECT COUNT(*)
    INTO v_count
    FROM public.pixel_requests
    WHERE organization_id = p_organization_id
        AND pixel_id = p_pixel_id
        AND business_manager_id = p_business_manager_id
        AND status IN ('pending', 'processing');
    
    RETURN v_count > 0;
END;
$$;


ALTER FUNCTION "public"."check_pixel_request_exists"("p_organization_id" "uuid", "p_pixel_id" "text", "p_business_manager_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_pixel_request_exists"("p_organization_id" "uuid", "p_pixel_id" "text", "p_business_manager_id" "text") IS 'Checks if a pixel request already exists to prevent duplicates';



CREATE OR REPLACE FUNCTION "public"."cleanup_expired_organizations"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_deleted_count INTEGER := 0;
    v_org_record RECORD;
BEGIN
    -- Find organizations past their retention period
    FOR v_org_record IN
        SELECT organization_id, name
        FROM public.organizations
        WHERE subscription_status = 'grace_period'
          AND data_retention_until < NOW()
    LOOP
        -- Archive historical data (transactions, tickets, etc.)
        -- This is a soft delete - we keep the org but mark it as deleted
        UPDATE public.organizations
        SET 
            subscription_status = 'deleted',
            name = 'DELETED_' || v_org_record.organization_id::TEXT,
            updated_at = NOW()
        WHERE organization_id = v_org_record.organization_id;
        
        -- Permanently deactivate all assets
        UPDATE public.asset_binding
        SET is_active = FALSE, updated_at = NOW()
        WHERE organization_id = v_org_record.organization_id;
        
        v_deleted_count := v_deleted_count + 1;
    END LOOP;
    
    RETURN v_deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_organizations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_topup_transfer"("p_organization_id" "uuid", "p_amount_cents" integer, "p_request_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_wallet_id UUID;
    v_account_name TEXT;
    v_account_id TEXT;
    v_current_balance INTEGER;
    v_current_reserved INTEGER;
BEGIN
    -- Get wallet for organization
    SELECT wallet_id, balance_cents, reserved_balance_cents 
    INTO v_wallet_id, v_current_balance, v_current_reserved
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

    -- CORRECT LOGIC: When admin completes a topup request:
    -- 1. Deduct the money from actual balance (money leaves wallet)
    -- 2. Release the reserved funds (unreserve the amount)
    UPDATE public.wallets
    SET 
        balance_cents = balance_cents - p_amount_cents,  -- Deduct from actual balance
        reserved_balance_cents = GREATEST(0, reserved_balance_cents - p_amount_cents),  -- Release reserved
        updated_at = NOW()
    WHERE wallet_id = v_wallet_id;
    
    -- Verify the wallet has enough balance (this should always pass since funds were reserved)
    IF v_current_balance < p_amount_cents THEN
        RAISE EXCEPTION 'Insufficient wallet balance. Balance: %, Required: %', v_current_balance, p_amount_cents;
    END IF;
    
    -- Create transaction record for the topup (negative = money leaving wallet)
    -- FIXED: Added missing VALUES keyword
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
        -p_amount_cents, -- Negative because money is leaving the wallet
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


ALTER FUNCTION "public"."complete_topup_transfer"("p_organization_id" "uuid", "p_amount_cents" integer, "p_request_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."complete_topup_transfer"("p_organization_id" "uuid", "p_amount_cents" integer, "p_request_id" "uuid") IS 'FIXED: Added missing VALUES keyword in INSERT statement. Deducts money from wallet balance AND releases reserved funds when admin completes topup request.';



CREATE OR REPLACE FUNCTION "public"."fulfill_pixel_connection_request"("p_application_id" "uuid", "p_admin_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_app_record RECORD;
    v_asset_id UUID;
BEGIN
    -- Get application details
    SELECT * INTO v_app_record
    FROM public.application
    WHERE application_id = p_application_id
      AND request_type = 'pixel_connection'
      AND status = 'processing';
    
    IF v_app_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Create or update pixel asset
    INSERT INTO public.asset (
        type,
        dolphin_id,
        name,
        status,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        'pixel',
        v_app_record.pixel_id,
        v_app_record.pixel_name,
        'active',
        jsonb_build_object(
            'business_manager_id', v_app_record.target_bm_dolphin_id,
            'connected_at', NOW()
        ),
        NOW(),
        NOW()
    ) 
    ON CONFLICT (type, dolphin_id) 
    DO UPDATE SET 
        name = EXCLUDED.name,
        status = EXCLUDED.status,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    RETURNING asset_id INTO v_asset_id;
    
    -- Create asset binding
    INSERT INTO public.asset_binding (
        asset_id,
        organization_id,
        status,
        is_active,
        bound_by,
        bound_at,
        created_at,
        updated_at
    ) VALUES (
        v_asset_id,
        v_app_record.organization_id,
        'active',
        TRUE,
        p_admin_user_id,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (asset_id, organization_id) 
    DO UPDATE SET 
        status = EXCLUDED.status,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
    
    -- Create fulfillment record
    INSERT INTO public.application_fulfillment (
        application_id,
        asset_id,
        created_at
    ) VALUES (
        p_application_id,
        v_asset_id,
        NOW()
    ) ON CONFLICT (application_id, asset_id) DO NOTHING;
    
    -- Mark application as fulfilled
    UPDATE public.application
    SET 
        status = 'fulfilled',
        fulfilled_by = p_admin_user_id,
        fulfilled_at = NOW(),
        updated_at = NOW()
    WHERE application_id = p_application_id;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."fulfill_pixel_connection_request"("p_application_id" "uuid", "p_admin_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_assets_for_deactivation"("p_organization_id" "uuid", "p_asset_type" "text", "p_count_to_deactivate" integer) RETURNS TABLE("asset_id" "uuid", "name" "text", "last_topup_date" timestamp with time zone, "total_topup_amount_cents" bigint, "last_activity_date" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.asset_id,
        a.name,
        ab.last_topup_date,
        ab.total_topup_amount_cents,
        ab.last_activity_date
    FROM public.asset_binding ab
    JOIN public.asset a ON ab.asset_id = a.asset_id
    WHERE ab.organization_id = p_organization_id
      AND a.type = p_asset_type
      AND ab.is_active = TRUE
    ORDER BY 
        ab.last_topup_date ASC NULLS FIRST,
        ab.total_topup_amount_cents ASC,
        ab.last_activity_date ASC
    LIMIT p_count_to_deactivate;
END;
$$;


ALTER FUNCTION "public"."get_assets_for_deactivation"("p_organization_id" "uuid", "p_asset_type" "text", "p_count_to_deactivate" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bm_domain_count"("p_bm_asset_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.bm_domains
        WHERE bm_asset_id = p_bm_asset_id
        AND is_active = true
    );
END;
$$;


ALTER FUNCTION "public"."get_bm_domain_count"("p_bm_asset_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_bm_domain_count"("p_bm_asset_id" "uuid") IS 'Returns the count of active domains for a specific Business Manager';



CREATE OR REPLACE FUNCTION "public"."get_domains_per_bm_limit"("p_organization_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    org_record RECORD;
    plan_limit INTEGER;
BEGIN
    -- Get organization data
    SELECT * INTO org_record
    FROM public.organizations
    WHERE organization_id = p_organization_id;
    
    IF org_record IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Get limit from pricing config based on plan
    -- These limits match the pricing config
    CASE org_record.plan_id
        WHEN 'starter' THEN plan_limit := 2;
        WHEN 'growth' THEN plan_limit := 3;
        WHEN 'scale' THEN plan_limit := 5;
        WHEN 'enterprise' THEN plan_limit := -1; -- Unlimited
        ELSE plan_limit := 0; -- Free plan
    END CASE;
    
    RETURN plan_limit;
END;
$$;


ALTER FUNCTION "public"."get_domains_per_bm_limit"("p_organization_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_domains_per_bm_limit"("p_organization_id" "uuid") IS 'Returns the domain limit per BM based on organization plan';



CREATE OR REPLACE FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text" DEFAULT NULL::"text") RETURNS TABLE("asset_id" "uuid", "type" "text", "dolphin_id" "text", "name" "text", "status" "text", "metadata" "jsonb", "bound_at" timestamp with time zone, "binding_id" "uuid", "last_synced_at" timestamp with time zone, "is_active" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Simplified version - service role bypasses RLS anyway
    RETURN QUERY
    SELECT
        a.asset_id,
        a.type,
        a.dolphin_id,
        a.name,
        a.status,
        a.metadata,
        ab.bound_at,
        ab.binding_id,
        a.last_synced_at,
        ab.is_active
    FROM
        public.asset_binding ab
    JOIN
        public.asset a ON ab.asset_id = a.asset_id
    WHERE
        ab.organization_id = p_organization_id
        AND ab.status = 'active'
        AND (p_asset_type IS NULL OR a.type = p_asset_type)
    ORDER BY
        ab.bound_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_organization_dashboard_data"("org_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'organization', json_build_object(
            'organization_id', o.organization_id,
            'name', o.name,
            'balance_cents', COALESCE(w.balance_cents, 0),
            'balance', COALESCE(w.balance_cents, 0) / 100.0,
            'reserved_balance_cents', COALESCE(w.reserved_balance_cents, 0),
            'subscription_status', o.subscription_status,
            'created_at', o.created_at
        ),
        'summary', json_build_object(
            'pending_applications', COALESCE(ds.pending_applications, 0),
            'open_tickets', COALESCE(ds.open_tickets, 0)
        ),
        'wallets', COALESCE(
            (SELECT json_agg(json_build_object(
                'wallet_id', w.wallet_id,
                'balance_cents', w.balance_cents,
                'balance', w.balance_cents / 100.0
            )) FROM wallets w WHERE w.organization_id = org_id),
            '[]'::json
        )
    ) INTO result
    FROM organizations o
    LEFT JOIN wallets w ON o.organization_id = w.organization_id
    LEFT JOIN dashboard_summary ds ON o.organization_id = ds.organization_id
    WHERE o.organization_id = org_id;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_organization_dashboard_data"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_organization_pixels"("p_organization_id" "uuid") RETURNS TABLE("id" "uuid", "type" "text", "pixel_id" "text", "pixel_name" "text", "business_manager_id" "text", "business_manager_name" "text", "status" "text", "is_active" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    -- Get active pixel assets
    SELECT 
        a.asset_id as id,
        'asset'::TEXT as type,
        a.dolphin_id as pixel_id,
        a.name as pixel_name,
        a.metadata->>'business_manager_id' as business_manager_id,
        a.metadata->>'business_manager_name' as business_manager_name,
        a.status,
        ab.is_active,
        a.created_at,
        a.updated_at
    FROM public.asset a
    JOIN public.asset_binding ab ON a.asset_id = ab.asset_id
    WHERE ab.organization_id = p_organization_id
      AND a.type = 'pixel'
      AND ab.status = 'active'
    
    UNION ALL
    
    -- Get pending pixel applications
    SELECT 
        app.application_id as id,
        'application'::TEXT as type,
        app.pixel_id,
        app.pixel_name,
        app.target_bm_dolphin_id as business_manager_id,
        NULL::TEXT as business_manager_name, -- Will be populated from BM data
        app.status,
        NULL::BOOLEAN as is_active,
        app.created_at,
        app.updated_at
    FROM public.application app
    WHERE app.organization_id = p_organization_id
      AND app.request_type = 'pixel_connection'
      AND app.status IN ('pending', 'processing')
    
    ORDER BY created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_organization_pixels"("p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_promotion_url_limit"("org_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    org_record RECORD;
    plan_record RECORD;
BEGIN
    -- Get organization data
    SELECT * INTO org_record
    FROM organizations
    WHERE organization_id = org_id;
    
    IF org_record IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Get plan data
    SELECT * INTO plan_record
    FROM plans
    WHERE plan_id = org_record.plan_id;
    
    IF plan_record IS NULL THEN
        RETURN 0; -- Free plan default
    END IF;
    
    RETURN COALESCE(plan_record.max_promotion_urls, 0);
END;
$$;


ALTER FUNCTION "public"."get_promotion_url_limit"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_tickets_with_metadata"("org_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("ticket_id" "uuid", "organization_id" "uuid", "created_by" "uuid", "assigned_to" "uuid", "subject" "text", "category" "text", "status" "text", "affected_asset_ids" "text"[], "affected_assets" "jsonb", "tags" "text"[], "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "ticket_number" integer, "message_count" bigint, "last_message_at" timestamp with time zone, "last_message_content" "text", "last_message_sender" "uuid", "unread_messages" bigint, "creator_name" "text", "creator_email" "text", "assignee_name" "text", "assignee_email" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.ticket_id,
        t.organization_id,
        t.created_by,
        t.assigned_to,
        t.subject,
        t.category,
        t.status,
        t.affected_asset_ids,
        public.resolve_asset_names(t.affected_asset_ids) as affected_assets,
        t.tags,
        t.created_at,
        t.updated_at,
        t.ticket_number,
        COALESCE(msg_stats.message_count, 0) as message_count,
        msg_stats.last_message_at,
        msg_stats.last_message_content,
        msg_stats.last_message_sender,
        COALESCE(msg_stats.unread_messages, 0) as unread_messages,
        creator.name as creator_name,
        creator.email as creator_email,
        assignee.name as assignee_name,
        assignee.email as assignee_email
    FROM public.support_tickets t
    LEFT JOIN public.profiles creator ON t.created_by = creator.profile_id
    LEFT JOIN public.profiles assignee ON t.assigned_to = assignee.profile_id
    LEFT JOIN (
        SELECT 
            m.ticket_id,
            COUNT(*) as message_count,
            MAX(m.created_at) as last_message_at,
            (SELECT content FROM public.support_ticket_messages sm1 WHERE sm1.ticket_id = m.ticket_id ORDER BY sm1.created_at DESC LIMIT 1) as last_message_content,
            (SELECT sender_id FROM public.support_ticket_messages sm2 WHERE sm2.ticket_id = m.ticket_id ORDER BY sm2.created_at DESC LIMIT 1) as last_message_sender,
            COUNT(CASE WHEN NOT m.read_by_customer AND m.sender_id != t.created_by THEN 1 END) as unread_messages
        FROM public.support_ticket_messages m
        JOIN public.support_tickets t ON m.ticket_id = t.ticket_id
        WHERE NOT m.is_internal
        GROUP BY m.ticket_id
    ) msg_stats ON t.ticket_id = msg_stats.ticket_id
    WHERE (org_id IS NULL OR t.organization_id = org_id)
    ORDER BY t.updated_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_tickets_with_metadata"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_organizations"("p_user_id" "uuid") RETURNS TABLE("organization_id" "uuid")
    LANGUAGE "sql" STABLE SECURITY DEFINER
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


ALTER FUNCTION "public"."get_user_organizations"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_organizations"("p_user_id" "uuid") IS 'SECURITY DEFINER function to get user organizations without RLS recursion';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_org_id UUID;
  user_email TEXT;
  user_name TEXT;
  new_org_name TEXT;
  new_wallet_id UUID;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  
  -- Extract user name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(user_email, '@', 1),
    'User'
  );
  
  -- Generate organization name in the format "Name's Organization"
  new_org_name := user_name || '''s Organization';
  
  -- Create organization
  new_org_id := gen_random_uuid();
  INSERT INTO public.organizations (organization_id, name, owner_id, plan_id)
  VALUES (new_org_id, new_org_name, NEW.id, 'free');
  
  -- Create wallet for the organization
  new_wallet_id := gen_random_uuid();
  INSERT INTO public.wallets (wallet_id, organization_id, balance_cents, reserved_balance_cents)
  VALUES (new_wallet_id, new_org_id, 0, 0);
  
  -- Create profile
  INSERT INTO public.profiles (profile_id, email, name, avatar_url, organization_id)
  VALUES (
    NEW.id,
    user_email,
    user_name,
    NEW.raw_user_meta_data->>'avatar_url',
    new_org_id
  );
  
  -- Add user as organization member (CRITICAL: This was missing!)
  INSERT INTO public.organization_members (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_plan_downgrade"("p_organization_id" "uuid", "p_new_plan_id" "text", "p_downgrade_date" timestamp with time zone DEFAULT "now"()) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_plan TEXT;
    v_current_bm_count INTEGER;
    v_current_account_count INTEGER;
    v_new_bm_limit INTEGER;
    v_new_account_limit INTEGER;
    v_bm_to_deactivate INTEGER;
    v_accounts_to_deactivate INTEGER;
    v_asset_record RECORD;
BEGIN
    -- Get current plan and counts
    SELECT plan_id INTO v_current_plan
    FROM public.organizations
    WHERE organization_id = p_organization_id;
    
    -- Get current active asset counts
    SELECT 
        COUNT(CASE WHEN a.type = 'business_manager' THEN 1 END),
        COUNT(CASE WHEN a.type = 'ad_account' THEN 1 END)
    INTO v_current_bm_count, v_current_account_count
    FROM public.asset_binding ab
    JOIN public.asset a ON ab.asset_id = a.asset_id
    WHERE ab.organization_id = p_organization_id AND ab.is_active = TRUE;
    
    -- Get new plan limits
    SELECT max_businesses, max_ad_accounts
    INTO v_new_bm_limit, v_new_account_limit
    FROM public.plans
    WHERE plan_id = p_new_plan_id;
    
    -- Calculate how many assets to deactivate
    v_bm_to_deactivate := GREATEST(0, v_current_bm_count - v_new_bm_limit);
    v_accounts_to_deactivate := GREATEST(0, v_current_account_count - v_new_account_limit);
    
    -- Update organization with new plan
    UPDATE public.organizations
    SET 
        previous_plan_id = v_current_plan,
        plan_id = p_new_plan_id,
        downgrade_scheduled_at = p_downgrade_date,
        updated_at = NOW()
    WHERE organization_id = p_organization_id;
    
    -- Deactivate excess business managers
    IF v_bm_to_deactivate > 0 THEN
        FOR v_asset_record IN
            SELECT asset_id FROM public.get_assets_for_deactivation(
                p_organization_id, 'business_manager', v_bm_to_deactivate
            )
        LOOP
            UPDATE public.asset_binding
            SET is_active = FALSE, updated_at = NOW()
            WHERE asset_id = v_asset_record.asset_id;
        END LOOP;
    END IF;
    
    -- Deactivate excess ad accounts
    IF v_accounts_to_deactivate > 0 THEN
        FOR v_asset_record IN
            SELECT asset_id FROM public.get_assets_for_deactivation(
                p_organization_id, 'ad_account', v_accounts_to_deactivate
            )
        LOOP
            UPDATE public.asset_binding
            SET is_active = FALSE, updated_at = NOW()
            WHERE asset_id = v_asset_record.asset_id;
        END LOOP;
    END IF;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."handle_plan_downgrade"("p_organization_id" "uuid", "p_new_plan_id" "text", "p_downgrade_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_subscription_cancellation"("p_organization_id" "uuid", "p_cancelled_at" timestamp with time zone DEFAULT "now"()) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_plan TEXT;
    v_retention_period INTERVAL;
BEGIN
    -- Get current plan
    SELECT plan_id INTO v_current_plan
    FROM public.organizations
    WHERE organization_id = p_organization_id;
    
    -- Calculate retention period
    v_retention_period := public.calculate_data_retention_period(v_current_plan);
    
    -- Update organization status
    UPDATE public.organizations
    SET 
        subscription_status = 'grace_period',
        subscription_cancelled_at = p_cancelled_at,
        data_retention_until = p_cancelled_at + v_retention_period,
        updated_at = NOW()
    WHERE organization_id = p_organization_id;
    
    -- Deactivate all assets immediately
    UPDATE public.asset_binding
    SET 
        is_active = FALSE,
        updated_at = NOW()
    WHERE organization_id = p_organization_id;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."handle_subscription_cancellation"("p_organization_id" "uuid", "p_cancelled_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_topup_request_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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
        -- Always use total_deducted_cents (includes fees) and pass the semantic request_id
        IF OLD.status IN ('pending', 'processing') AND NEW.status = 'completed' THEN
            PERFORM public.complete_topup_transfer(NEW.organization_id, NEW.total_deducted_cents, NEW.request_id);
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_topup_request_changes"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_topup_request_changes"() IS 'FINAL FIX: Handles topup request lifecycle using semantic ID request_id.';



CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  -- Use SECURITY DEFINER to bypass RLS when checking admin status
  SELECT COALESCE(
    (SELECT is_superuser FROM public.profiles WHERE profile_id = user_id LIMIT 1),
    false
  );
$$;


ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."migrate_promotion_urls_to_bm_domains"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    promo_record RECORD;
    first_bm_id UUID;
BEGIN
    -- For each organization's promotion URLs, assign them to their first BM
    FOR promo_record IN 
        SELECT DISTINCT organization_id 
        FROM public.promotion_urls 
        WHERE is_active = true
    LOOP
        -- Get the first BM for this organization
        SELECT a.asset_id INTO first_bm_id
        FROM public.asset a
        JOIN public.asset_binding ab ON a.asset_id = ab.asset_id
        WHERE ab.organization_id = promo_record.organization_id
        AND a.type = 'business_manager'
        AND ab.status = 'active'
        AND ab.is_active = true
        ORDER BY ab.bound_at
        LIMIT 1;
        
        -- If organization has a BM, migrate their URLs
        IF first_bm_id IS NOT NULL THEN
            INSERT INTO public.bm_domains (organization_id, bm_asset_id, domain_url, is_active)
            SELECT 
                organization_id,
                first_bm_id,
                url,
                is_active
            FROM public.promotion_urls
            WHERE organization_id = promo_record.organization_id
            AND is_active = true
            ON CONFLICT (bm_asset_id, domain_url) DO NOTHING;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration completed: promotion_urls -> bm_domains';
END;
$$;


ALTER FUNCTION "public"."migrate_promotion_urls_to_bm_domains"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_reserved_funds"("org_id" "uuid", "amount_cents" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE public.wallets
    SET reserved_balance_cents = GREATEST(0, COALESCE(reserved_balance_cents, 0) - amount_cents),
        updated_at = NOW()
    WHERE organization_id = org_id;
END;
$$;


ALTER FUNCTION "public"."release_reserved_funds"("org_id" "uuid", "amount_cents" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."release_reserved_funds"("org_id" "uuid", "amount_cents" integer) IS 'Releases reserved funds when a topup request is cancelled, rejected, or failed';



CREATE OR REPLACE FUNCTION "public"."reserve_funds_for_topup"("org_id" "uuid", "amount_cents" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."reserve_funds_for_topup"("org_id" "uuid", "amount_cents" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reserve_funds_for_topup"("org_id" "uuid", "amount_cents" integer) IS 'Reserves funds for a topup request by moving money from available balance to reserved balance';



CREATE OR REPLACE FUNCTION "public"."resolve_asset_names"("asset_ids" "text"[]) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSONB := '[]'::JSONB;
    asset_id_param TEXT;
    asset_record RECORD;
BEGIN
    -- Return empty array if no asset IDs provided
    IF asset_ids IS NULL OR array_length(asset_ids, 1) IS NULL THEN
        RETURN result;
    END IF;
    
    -- Loop through each asset ID and resolve its name
    FOREACH asset_id_param IN ARRAY asset_ids
    LOOP
        -- Try to find the asset in the asset table with proper table alias
        SELECT a.asset_id, a.name, a.type, a.dolphin_id
        INTO asset_record
        FROM public.asset a
        WHERE a.asset_id::TEXT = asset_id_param OR a.dolphin_id = asset_id_param;
        
        -- If found, add to result
        IF FOUND THEN
            result := result || jsonb_build_object(
                'id', asset_record.asset_id,
                'name', asset_record.name,
                'type', asset_record.type,
                'dolphin_id', asset_record.dolphin_id
            );
        ELSE
            -- If not found, add placeholder
            result := result || jsonb_build_object(
                'id', asset_id_param,
                'name', 'Unknown Asset',
                'type', 'unknown',
                'dolphin_id', asset_id_param
            );
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."resolve_asset_names"("asset_ids" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_pixel_connection_request"("p_organization_id" "uuid", "p_pixel_id" "text", "p_pixel_name" "text", "p_business_manager_id" "text", "p_requested_by" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_application_id UUID;
BEGIN
    -- Create application record
    INSERT INTO public.application (
        organization_id,
        request_type,
        pixel_id,
        pixel_name,
        target_bm_dolphin_id,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_organization_id,
        'pixel_connection',
        p_pixel_id,
        p_pixel_name,
        p_business_manager_id,
        'pending',
        NOW(),
        NOW()
    ) RETURNING application_id INTO v_application_id;
    
    RETURN v_application_id;
END;
$$;


ALTER FUNCTION "public"."submit_pixel_connection_request"("p_organization_id" "uuid", "p_pixel_id" "text", "p_pixel_name" "text", "p_business_manager_id" "text", "p_requested_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_asset_activation"("p_asset_id" "uuid", "p_organization_id" "uuid", "p_is_active" boolean) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    binding_exists BOOLEAN;
BEGIN
    -- Check if the binding exists and belongs to the organization
    SELECT EXISTS(
        SELECT 1 FROM asset_binding 
        WHERE asset_id = p_asset_id 
        AND organization_id = p_organization_id 
        AND status = 'active'
    ) INTO binding_exists;
    
    IF NOT binding_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Update the activation status
    UPDATE asset_binding 
    SET is_active = p_is_active,
        updated_at = NOW()
    WHERE asset_id = p_asset_id 
    AND organization_id = p_organization_id 
    AND status = 'active';
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."toggle_asset_activation"("p_asset_id" "uuid", "p_organization_id" "uuid", "p_is_active" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."toggle_asset_activation"("p_asset_id" "uuid", "p_organization_id" "uuid", "p_is_active" boolean) IS 'Toggle asset activation status for client-controlled deactivation. Returns true if successful.';



CREATE OR REPLACE FUNCTION "public"."toggle_asset_activation_cascade"("p_asset_id" "uuid", "p_organization_id" "uuid", "p_is_active" boolean) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    binding_exists BOOLEAN;
    asset_type TEXT;
    bm_dolphin_id TEXT;
BEGIN
    -- Check if the binding exists and belongs to the organization
    SELECT EXISTS(
        SELECT 1 FROM asset_binding ab
        JOIN asset a ON ab.asset_id = a.asset_id
        WHERE ab.asset_id = p_asset_id 
        AND ab.organization_id = p_organization_id 
        AND ab.status = 'active'
    ) INTO binding_exists;
    
    IF NOT binding_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Get the asset type and dolphin_id
    SELECT a.type, a.dolphin_id INTO asset_type, bm_dolphin_id
    FROM asset a
    JOIN asset_binding ab ON a.asset_id = ab.asset_id
    WHERE ab.asset_id = p_asset_id 
    AND ab.organization_id = p_organization_id 
    AND ab.status = 'active';
    
    -- Update the activation status of the main asset
    UPDATE asset_binding 
    SET is_active = p_is_active,
        updated_at = NOW()
    WHERE asset_id = p_asset_id 
    AND organization_id = p_organization_id 
    AND status = 'active';
    
    -- If this is a business manager being deactivated, also deactivate all its ad accounts
    IF asset_type = 'business_manager' AND p_is_active = FALSE THEN
        UPDATE asset_binding 
        SET is_active = FALSE,
            updated_at = NOW()
        WHERE organization_id = p_organization_id 
        AND status = 'active'
        AND asset_id IN (
            SELECT a.asset_id 
            FROM asset a
            WHERE a.type = 'ad_account'
            AND a.metadata->>'business_manager_id' = bm_dolphin_id
        );
    END IF;
    
    -- If this is a business manager being activated, we DON'T automatically activate ad accounts
    -- This gives users more control - they can choose which ad accounts to reactivate
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."toggle_asset_activation_cascade"("p_asset_id" "uuid", "p_organization_id" "uuid", "p_is_active" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."toggle_asset_activation_cascade"("p_asset_id" "uuid", "p_organization_id" "uuid", "p_is_active" boolean) IS 'Toggle asset activation status with cascading support. When deactivating a business manager, also deactivates all its ad accounts.';



CREATE OR REPLACE FUNCTION "public"."update_binance_pay_orders_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_binance_pay_orders_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_pixel_request_status"("p_request_id" "uuid", "p_status" "text", "p_admin_notes" "text" DEFAULT NULL::"text", "p_processed_by" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_updated_rows INTEGER;
BEGIN
    -- Validate status
    IF p_status NOT IN ('pending', 'processing', 'completed', 'rejected') THEN
        RAISE EXCEPTION 'Invalid status: %', p_status;
    END IF;

    -- Update the request
    UPDATE public.pixel_requests 
    SET 
        status = p_status,
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        processed_by = COALESCE(p_processed_by, processed_by),
        processed_at = CASE 
            WHEN p_status IN ('completed', 'rejected') THEN NOW()
            ELSE processed_at
        END,
        updated_at = NOW()
    WHERE request_id = p_request_id;

    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
    
    RETURN v_updated_rows > 0;
END;
$$;


ALTER FUNCTION "public"."update_pixel_request_status"("p_request_id" "uuid", "p_status" "text", "p_admin_notes" "text", "p_processed_by" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_pixel_request_status"("p_request_id" "uuid", "p_status" "text", "p_admin_notes" "text", "p_processed_by" "uuid") IS 'Updates pixel request status with admin processing info';



CREATE OR REPLACE FUNCTION "public"."update_ticket_timestamp_on_message"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update the parent ticket's updated_at field when a message is inserted
    UPDATE public.support_tickets 
    SET updated_at = NOW()
    WHERE ticket_id = NEW.ticket_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_ticket_timestamp_on_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_bm_asset_type"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check if the referenced asset is actually a business manager
    IF NOT EXISTS (
        SELECT 1 FROM public.asset 
        WHERE asset_id = NEW.bm_asset_id 
        AND type = 'business_manager'
    ) THEN
        RAISE EXCEPTION 'Referenced asset must be a business manager';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_bm_asset_type"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."application" (
    "application_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
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
    "pixel_id" "text",
    "pixel_name" "text",
    "domains" "text"[] DEFAULT '{}'::"text"[],
    CONSTRAINT "application_request_type_check" CHECK (("request_type" = ANY (ARRAY['new_business_manager'::"text", 'additional_accounts'::"text", 'pixel_connection'::"text"]))),
    CONSTRAINT "application_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'processing'::"text", 'rejected'::"text", 'fulfilled'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."application" OWNER TO "postgres";


COMMENT ON COLUMN "public"."application"."domains" IS 'Array of domains to be associated with the business manager when application is fulfilled';



CREATE TABLE IF NOT EXISTS "public"."application_fulfillment" (
    "fulfillment_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "asset_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."application_fulfillment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."asset" (
    "asset_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "dolphin_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "last_synced_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "asset_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'suspended'::"text"]))),
    CONSTRAINT "asset_type_check" CHECK (("type" = ANY (ARRAY['business_manager'::"text", 'ad_account'::"text", 'profile'::"text", 'pixel'::"text"])))
);


ALTER TABLE "public"."asset" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."asset_binding" (
    "binding_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "asset_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "bound_by" "uuid" NOT NULL,
    "bound_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "last_topup_date" timestamp with time zone,
    "total_topup_amount_cents" bigint DEFAULT 0,
    "last_activity_date" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "asset_binding_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."asset_binding" OWNER TO "postgres";


COMMENT ON COLUMN "public"."asset_binding"."is_active" IS 'Client-controlled activation status. When false, asset is deactivated by client and does not count toward plan limits.';



CREATE TABLE IF NOT EXISTS "public"."bank_transfer_requests" (
    "request_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "requested_amount" numeric(10,2) NOT NULL,
    "reference_number" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "user_notes" "text",
    "admin_notes" "text",
    "processed_by" "uuid",
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "bank_transfer_requests_requested_amount_check" CHECK ((("requested_amount" >= (50)::numeric) AND ("requested_amount" <= (50000)::numeric))),
    CONSTRAINT "bank_transfer_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."bank_transfer_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."binance_pay_orders" (
    "order_id" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "amount_usd" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "binance_order_id" "text",
    "binance_transaction_id" "text",
    "payment_url" "text",
    "qr_code" "text",
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "binance_pay_orders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."binance_pay_orders" OWNER TO "postgres";


COMMENT ON TABLE "public"."binance_pay_orders" IS 'Tracks Binance Pay cryptocurrency payment orders for wallet top-ups';



CREATE TABLE IF NOT EXISTS "public"."bm_domains" (
    "domain_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "bm_asset_id" "uuid" NOT NULL,
    "domain_url" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bm_domains" OWNER TO "postgres";


COMMENT ON TABLE "public"."bm_domains" IS 'Domains tracked per Business Manager, replacing organization-level promotion_urls';



COMMENT ON COLUMN "public"."bm_domains"."bm_asset_id" IS 'Reference to the Business Manager asset this domain belongs to';



COMMENT ON COLUMN "public"."bm_domains"."domain_url" IS 'The domain/URL associated with this Business Manager';



CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "organization_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "plan_id" "text" DEFAULT 'free'::"text",
    "avatar_url" "text",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "stripe_subscription_status" "text",
    "subscription_status" "text" DEFAULT 'active'::"text",
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "ad_spend_monthly" "text",
    "industry" "text",
    "timezone" "text",
    "how_heard_about_us" "text",
    "additional_info" "text",
    "subscription_cancelled_at" timestamp with time zone,
    "data_retention_until" timestamp with time zone,
    "previous_plan_id" "text",
    "downgrade_scheduled_at" timestamp with time zone
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."organizations"."ad_spend_monthly" IS 'Monthly advertising spend range collected during onboarding';



COMMENT ON COLUMN "public"."organizations"."industry" IS 'Industry/business type collected during onboarding';



COMMENT ON COLUMN "public"."organizations"."timezone" IS 'User timezone for scheduling business managers and support';



COMMENT ON COLUMN "public"."organizations"."how_heard_about_us" IS 'Referral source tracking - how the user discovered AdHub';



COMMENT ON COLUMN "public"."organizations"."additional_info" IS 'Additional information about current advertising setup and goals';



CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "ticket_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "assigned_to" "uuid",
    "subject" "text" NOT NULL,
    "category" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "affected_asset_ids" "text"[] DEFAULT '{}'::"text"[],
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "internal_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "ticket_number" integer NOT NULL,
    CONSTRAINT "support_tickets_category_check" CHECK (("category" = ANY (ARRAY['ad_account_issue'::"text", 'billing_question'::"text", 'feature_request'::"text", 'bug_report'::"text", 'general_inquiry'::"text"]))),
    CONSTRAINT "support_tickets_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'pending'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "wallet_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "balance_cents" integer DEFAULT 0,
    "reserved_balance_cents" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wallets" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."dashboard_summary" AS
 SELECT "o"."organization_id",
    "o"."name" AS "org_name",
    COALESCE("w"."balance_cents", 0) AS "balance_cents",
    COALESCE("w"."reserved_balance_cents", 0) AS "reserved_balance_cents",
    "o"."subscription_status",
    "count"(DISTINCT
        CASE
            WHEN ("app"."status" = 'pending'::"text") THEN "app"."application_id"
            ELSE NULL::"uuid"
        END) AS "pending_applications",
    "count"(DISTINCT
        CASE
            WHEN ("st"."status" = 'open'::"text") THEN "st"."ticket_id"
            ELSE NULL::"uuid"
        END) AS "open_tickets"
   FROM ((("public"."organizations" "o"
     LEFT JOIN "public"."wallets" "w" ON (("o"."organization_id" = "w"."organization_id")))
     LEFT JOIN "public"."application" "app" ON (("o"."organization_id" = "app"."organization_id")))
     LEFT JOIN "public"."support_tickets" "st" ON (("o"."organization_id" = "st"."organization_id")))
  GROUP BY "o"."organization_id", "o"."name", "w"."balance_cents", "w"."reserved_balance_cents", "o"."subscription_status";


ALTER TABLE "public"."dashboard_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_states" (
    "user_id" "uuid" NOT NULL,
    "has_created_organization" boolean DEFAULT false,
    "has_verified_email" boolean DEFAULT false,
    "has_completed_profile" boolean DEFAULT false,
    "has_submitted_application" boolean DEFAULT false,
    "has_received_assets" boolean DEFAULT false,
    "has_made_first_topup" boolean DEFAULT false,
    "current_step" "text" DEFAULT 'create_organization'::"text",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "has_explicitly_dismissed" boolean DEFAULT false
);


ALTER TABLE "public"."onboarding_states" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."organization_members" OWNER TO "postgres";


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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "monthly_topup_limit_cents" integer,
    "max_promotion_urls" integer DEFAULT 1,
    "max_pixels" integer DEFAULT 0
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


COMMENT ON TABLE "public"."plans" IS 'Plan definitions for Stripe integration. Plan limits are now enforced via pricing-config.ts in the application layer, not database fields.';



COMMENT ON COLUMN "public"."plans"."max_team_members" IS 'DEPRECATED: Use pricing-config.ts for plan limits';



COMMENT ON COLUMN "public"."plans"."max_businesses" IS 'DEPRECATED: Use pricing-config.ts for plan limits';



COMMENT ON COLUMN "public"."plans"."max_ad_accounts" IS 'DEPRECATED: Use pricing-config.ts for plan limits';



COMMENT ON COLUMN "public"."plans"."monthly_topup_limit_cents" IS 'DEPRECATED: Use pricing-config.ts for top-up limits. This field is no longer used for limit enforcement.';



COMMENT ON COLUMN "public"."plans"."max_promotion_urls" IS 'DEPRECATED: Use pricing-config.ts for plan limits';



COMMENT ON COLUMN "public"."plans"."max_pixels" IS 'DEPRECATED: Use pricing-config.ts for plan limits';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "profile_id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "name" "text",
    "email" "text",
    "role" "text" DEFAULT 'client'::"text",
    "is_superuser" boolean DEFAULT false,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promotion_urls" (
    "url_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."promotion_urls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "subscription_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
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


CREATE TABLE IF NOT EXISTS "public"."support_ticket_attachments" (
    "attachment_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid",
    "message_id" "uuid",
    "filename" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "file_type" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "attachment_belongs_to_ticket_or_message" CHECK (((("ticket_id" IS NOT NULL) AND ("message_id" IS NULL)) OR (("ticket_id" IS NULL) AND ("message_id" IS NOT NULL))))
);


ALTER TABLE "public"."support_ticket_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_ticket_messages" (
    "message_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_internal" boolean DEFAULT false,
    "message_type" "text" DEFAULT 'message'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "edited_at" timestamp with time zone,
    "read_by_customer" boolean DEFAULT false,
    "read_by_admin" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "support_ticket_messages_message_type_check" CHECK (("message_type" = ANY (ARRAY['message'::"text", 'status_change'::"text", 'assignment'::"text", 'note'::"text"])))
);


ALTER TABLE "public"."support_ticket_messages" OWNER TO "postgres";


COMMENT ON COLUMN "public"."support_ticket_messages"."metadata" IS 'Stores contextual information about the message, such as whether it was sent from admin panel';



ALTER TABLE "public"."support_tickets" ALTER COLUMN "ticket_number" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."support_tickets_ticket_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."topup_requests" (
    "request_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "display_id" "text" DEFAULT ('REQ-'::"text" || "upper"(SUBSTRING(("gen_random_uuid"())::"text" FROM 1 FOR 8))),
    "organization_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "ad_account_id" "text" NOT NULL,
    "ad_account_name" "text" NOT NULL,
    "amount_cents" integer NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "request_type" "text" DEFAULT 'topup'::"text",
    "transfer_destination_type" "text" DEFAULT 'ad_account'::"text",
    "transfer_destination_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "processed_by" "uuid",
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "fee_amount_cents" integer DEFAULT 0,
    "total_deducted_cents" integer DEFAULT 0,
    "plan_fee_percentage" numeric(5,2) DEFAULT 0,
    CONSTRAINT "topup_requests_amount_cents_check" CHECK (("amount_cents" > 0)),
    CONSTRAINT "topup_requests_request_type_check" CHECK (("request_type" = ANY (ARRAY['topup'::"text", 'balance_reset'::"text"]))),
    CONSTRAINT "topup_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "topup_requests_transfer_destination_type_check" CHECK (("transfer_destination_type" = ANY (ARRAY['wallet'::"text", 'ad_account'::"text"])))
);


ALTER TABLE "public"."topup_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."topup_requests" IS 'SEMANTIC ID: Uses request_id as primary key, not generic id.';



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


CREATE TABLE IF NOT EXISTS "public"."unmatched_transfers" (
    "transfer_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "sender_info" "jsonb",
    "reference_provided" "text",
    "bank_transaction_id" "text",
    "received_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'unmatched'::"text" NOT NULL,
    "matched_request_id" "uuid",
    "admin_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "unmatched_transfers_status_check" CHECK (("status" = ANY (ARRAY['unmatched'::"text", 'matched'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."unmatched_transfers" OWNER TO "postgres";


ALTER TABLE ONLY "public"."application_fulfillment"
    ADD CONSTRAINT "application_fulfillment_application_id_asset_id_key" UNIQUE ("application_id", "asset_id");



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



ALTER TABLE ONLY "public"."bank_transfer_requests"
    ADD CONSTRAINT "bank_transfer_requests_pkey" PRIMARY KEY ("request_id");



ALTER TABLE ONLY "public"."bank_transfer_requests"
    ADD CONSTRAINT "bank_transfer_requests_reference_number_key" UNIQUE ("reference_number");



ALTER TABLE ONLY "public"."binance_pay_orders"
    ADD CONSTRAINT "binance_pay_orders_pkey" PRIMARY KEY ("order_id");



ALTER TABLE ONLY "public"."bm_domains"
    ADD CONSTRAINT "bm_domains_bm_asset_id_domain_url_key" UNIQUE ("bm_asset_id", "domain_url");



ALTER TABLE ONLY "public"."bm_domains"
    ADD CONSTRAINT "bm_domains_pkey" PRIMARY KEY ("domain_id");



ALTER TABLE ONLY "public"."onboarding_states"
    ADD CONSTRAINT "onboarding_states_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("user_id", "organization_id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("organization_id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("plan_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("profile_id");



ALTER TABLE ONLY "public"."promotion_urls"
    ADD CONSTRAINT "promotion_urls_organization_id_url_key" UNIQUE ("organization_id", "url");



ALTER TABLE ONLY "public"."promotion_urls"
    ADD CONSTRAINT "promotion_urls_pkey" PRIMARY KEY ("url_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("subscription_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."support_ticket_attachments"
    ADD CONSTRAINT "support_ticket_attachments_pkey" PRIMARY KEY ("attachment_id");



ALTER TABLE ONLY "public"."support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("message_id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("ticket_id");



ALTER TABLE ONLY "public"."topup_requests"
    ADD CONSTRAINT "topup_requests_display_id_key" UNIQUE ("display_id");



ALTER TABLE ONLY "public"."topup_requests"
    ADD CONSTRAINT "topup_requests_pkey" PRIMARY KEY ("request_id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("transaction_id");



ALTER TABLE ONLY "public"."unmatched_transfers"
    ADD CONSTRAINT "unmatched_transfers_pkey" PRIMARY KEY ("transfer_id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_organization_id_key" UNIQUE ("organization_id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("wallet_id");



CREATE INDEX "idx_application_approved_by" ON "public"."application" USING "btree" ("approved_by");



CREATE INDEX "idx_application_audit_fields" ON "public"."application" USING "btree" ("approved_by", "rejected_by", "fulfilled_by") WHERE (("approved_by" IS NOT NULL) OR ("rejected_by" IS NOT NULL) OR ("fulfilled_by" IS NOT NULL));



CREATE INDEX "idx_application_created_at" ON "public"."application" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_application_fulfilled_by" ON "public"."application" USING "btree" ("fulfilled_by");



CREATE INDEX "idx_application_fulfillment_application_id" ON "public"."application_fulfillment" USING "btree" ("application_id");



CREATE INDEX "idx_application_fulfillment_asset_id" ON "public"."application_fulfillment" USING "btree" ("asset_id");



CREATE INDEX "idx_application_org_id_status" ON "public"."application" USING "btree" ("organization_id", "status", "created_at" DESC);



CREATE INDEX "idx_application_organization_id" ON "public"."application" USING "btree" ("organization_id");



CREATE INDEX "idx_application_pending" ON "public"."application" USING "btree" ("organization_id", "created_at" DESC) WHERE ("status" = ANY (ARRAY['pending'::"text", 'processing'::"text"]));



CREATE INDEX "idx_application_pixel_id" ON "public"."application" USING "btree" ("pixel_id") WHERE ("pixel_id" IS NOT NULL);



CREATE INDEX "idx_application_pixel_requests" ON "public"."application" USING "btree" ("organization_id", "request_type") WHERE ("request_type" = 'pixel_connection'::"text");



CREATE INDEX "idx_application_rejected_by" ON "public"."application" USING "btree" ("rejected_by");



CREATE INDEX "idx_application_request_type" ON "public"."application" USING "btree" ("request_type");



CREATE INDEX "idx_application_status" ON "public"."application" USING "btree" ("status");



CREATE INDEX "idx_application_status_created" ON "public"."application" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_applications_created_at" ON "public"."application" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_applications_org_status" ON "public"."application" USING "btree" ("organization_id", "status");



CREATE INDEX "idx_applications_organization_id" ON "public"."application" USING "btree" ("organization_id");



CREATE INDEX "idx_applications_request_type" ON "public"."application" USING "btree" ("request_type");



CREATE INDEX "idx_applications_status" ON "public"."application" USING "btree" ("status");



CREATE INDEX "idx_applications_status_created_at" ON "public"."application" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_asset_binding_active_ad" ON "public"."asset_binding" USING "btree" ("organization_id", "asset_id") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_asset_binding_active_bm" ON "public"."asset_binding" USING "btree" ("organization_id", "asset_id") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_asset_binding_active_status" ON "public"."asset_binding" USING "btree" ("organization_id", "status", "is_active");



CREATE INDEX "idx_asset_binding_asset_id" ON "public"."asset_binding" USING "btree" ("asset_id");



CREATE INDEX "idx_asset_binding_asset_org" ON "public"."asset_binding" USING "btree" ("asset_id", "organization_id");



CREATE INDEX "idx_asset_binding_last_topup_date" ON "public"."asset_binding" USING "btree" ("last_topup_date");



CREATE INDEX "idx_asset_binding_org_id" ON "public"."asset_binding" USING "btree" ("organization_id");



CREATE INDEX "idx_asset_binding_org_status" ON "public"."asset_binding" USING "btree" ("organization_id", "status");



CREATE INDEX "idx_asset_binding_organization_id" ON "public"."asset_binding" USING "btree" ("organization_id");



CREATE INDEX "idx_asset_binding_status_active" ON "public"."asset_binding" USING "btree" ("status", "is_active") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_asset_binding_total_topup_amount" ON "public"."asset_binding" USING "btree" ("total_topup_amount_cents");



CREATE INDEX "idx_asset_bindings_asset_id" ON "public"."asset_binding" USING "btree" ("asset_id");



CREATE INDEX "idx_asset_bindings_org_status" ON "public"."asset_binding" USING "btree" ("organization_id", "status");



CREATE INDEX "idx_asset_bindings_organization_id" ON "public"."asset_binding" USING "btree" ("organization_id");



CREATE INDEX "idx_asset_bindings_status" ON "public"."asset_binding" USING "btree" ("status");



CREATE INDEX "idx_asset_created_at" ON "public"."asset" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_asset_dolphin_id" ON "public"."asset" USING "btree" ("dolphin_id");



CREATE INDEX "idx_asset_status" ON "public"."asset" USING "btree" ("status");



CREATE INDEX "idx_asset_type" ON "public"."asset" USING "btree" ("type");



CREATE INDEX "idx_asset_type_pixel" ON "public"."asset" USING "btree" ("type") WHERE ("type" = 'pixel'::"text");



CREATE INDEX "idx_assets_dolphin_id" ON "public"."asset" USING "btree" ("dolphin_id");



CREATE INDEX "idx_assets_status" ON "public"."asset" USING "btree" ("status");



CREATE INDEX "idx_assets_type" ON "public"."asset" USING "btree" ("type");



CREATE INDEX "idx_assets_type_status" ON "public"."asset" USING "btree" ("type", "status");



CREATE INDEX "idx_bank_transfer_requests_organization_id" ON "public"."bank_transfer_requests" USING "btree" ("organization_id");



CREATE INDEX "idx_bank_transfer_requests_reference_number" ON "public"."bank_transfer_requests" USING "btree" ("reference_number");



CREATE INDEX "idx_bank_transfer_requests_status" ON "public"."bank_transfer_requests" USING "btree" ("status");



CREATE INDEX "idx_binance_pay_orders_binance_order_id" ON "public"."binance_pay_orders" USING "btree" ("binance_order_id");



CREATE INDEX "idx_binance_pay_orders_created_at" ON "public"."binance_pay_orders" USING "btree" ("created_at");



CREATE INDEX "idx_binance_pay_orders_organization_id" ON "public"."binance_pay_orders" USING "btree" ("organization_id");



CREATE INDEX "idx_binance_pay_orders_status" ON "public"."binance_pay_orders" USING "btree" ("status");



CREATE INDEX "idx_bm_domains_active" ON "public"."bm_domains" USING "btree" ("is_active");



CREATE INDEX "idx_bm_domains_bm_asset_id" ON "public"."bm_domains" USING "btree" ("bm_asset_id");



CREATE INDEX "idx_bm_domains_org_bm" ON "public"."bm_domains" USING "btree" ("organization_id", "bm_asset_id");



CREATE INDEX "idx_bm_domains_organization_id" ON "public"."bm_domains" USING "btree" ("organization_id");



CREATE INDEX "idx_organization_members_organization_id" ON "public"."organization_members" USING "btree" ("organization_id");



CREATE INDEX "idx_organization_members_role" ON "public"."organization_members" USING "btree" ("role");



CREATE INDEX "idx_organization_members_user_id" ON "public"."organization_members" USING "btree" ("user_id");



CREATE INDEX "idx_organization_members_user_org" ON "public"."organization_members" USING "btree" ("user_id", "organization_id");



CREATE INDEX "idx_organizations_created_at" ON "public"."organizations" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_organizations_data_retention_until" ON "public"."organizations" USING "btree" ("data_retention_until");



CREATE INDEX "idx_organizations_owner_id" ON "public"."organizations" USING "btree" ("owner_id");



CREATE INDEX "idx_organizations_plan_created_at" ON "public"."organizations" USING "btree" ("plan_id", "created_at" DESC);



CREATE INDEX "idx_organizations_plan_id" ON "public"."organizations" USING "btree" ("plan_id");



CREATE INDEX "idx_organizations_search" ON "public"."organizations" USING "gin" ("to_tsvector"('"english"'::"regconfig", "name"));



CREATE INDEX "idx_organizations_status_plan" ON "public"."organizations" USING "btree" ("subscription_status", "plan_id");



CREATE INDEX "idx_organizations_subscription_status" ON "public"."organizations" USING "btree" ("subscription_status");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_is_superuser" ON "public"."profiles" USING "btree" ("is_superuser") WHERE ("is_superuser" = true);



CREATE INDEX "idx_profiles_org_role" ON "public"."profiles" USING "btree" ("organization_id", "role");



CREATE INDEX "idx_profiles_organization_id" ON "public"."profiles" USING "btree" ("organization_id");



CREATE INDEX "idx_profiles_profile_id" ON "public"."profiles" USING "btree" ("profile_id");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_profiles_user_id" ON "public"."profiles" USING "btree" ("profile_id");



CREATE INDEX "idx_promotion_urls_active" ON "public"."promotion_urls" USING "btree" ("is_active");



CREATE INDEX "idx_promotion_urls_organization_id" ON "public"."promotion_urls" USING "btree" ("organization_id");



CREATE INDEX "idx_subscriptions_organization_id" ON "public"."subscriptions" USING "btree" ("organization_id");



CREATE INDEX "idx_support_ticket_attachments_message_id" ON "public"."support_ticket_attachments" USING "btree" ("message_id");



CREATE INDEX "idx_support_ticket_attachments_ticket_id" ON "public"."support_ticket_attachments" USING "btree" ("ticket_id");



CREATE INDEX "idx_support_ticket_messages_created_at" ON "public"."support_ticket_messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_support_ticket_messages_metadata" ON "public"."support_ticket_messages" USING "gin" ("metadata");



CREATE INDEX "idx_support_ticket_messages_sender_id" ON "public"."support_ticket_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_support_ticket_messages_ticket_id" ON "public"."support_ticket_messages" USING "btree" ("ticket_id");



CREATE INDEX "idx_support_tickets_assigned_to" ON "public"."support_tickets" USING "btree" ("assigned_to");



CREATE INDEX "idx_support_tickets_category" ON "public"."support_tickets" USING "btree" ("category");



CREATE INDEX "idx_support_tickets_created_at" ON "public"."support_tickets" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_support_tickets_created_by" ON "public"."support_tickets" USING "btree" ("created_by");



CREATE INDEX "idx_support_tickets_org_id_status" ON "public"."support_tickets" USING "btree" ("organization_id", "status", "created_at" DESC);



CREATE INDEX "idx_support_tickets_organization_id" ON "public"."support_tickets" USING "btree" ("organization_id");



CREATE INDEX "idx_support_tickets_status" ON "public"."support_tickets" USING "btree" ("status");



CREATE INDEX "idx_support_tickets_updated_at" ON "public"."support_tickets" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_topup_requests_ad_account_id" ON "public"."topup_requests" USING "btree" ("ad_account_id");



CREATE INDEX "idx_topup_requests_amount_cents" ON "public"."topup_requests" USING "btree" ("amount_cents");



CREATE INDEX "idx_topup_requests_created_at" ON "public"."topup_requests" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_topup_requests_org_created_at" ON "public"."topup_requests" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "idx_topup_requests_org_id_status" ON "public"."topup_requests" USING "btree" ("organization_id", "status", "created_at" DESC);



CREATE INDEX "idx_topup_requests_organization_id" ON "public"."topup_requests" USING "btree" ("organization_id");



CREATE INDEX "idx_topup_requests_status" ON "public"."topup_requests" USING "btree" ("status");



CREATE INDEX "idx_topup_requests_status_amount" ON "public"."topup_requests" USING "btree" ("status", "amount_cents");



CREATE INDEX "idx_transactions_amount" ON "public"."transactions" USING "btree" ("amount_cents");



CREATE INDEX "idx_transactions_created_at" ON "public"."transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_transactions_org_created" ON "public"."transactions" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "idx_transactions_org_created_at" ON "public"."transactions" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "idx_transactions_org_id_created" ON "public"."transactions" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "idx_transactions_org_status_type" ON "public"."transactions" USING "btree" ("organization_id", "status", "type");



CREATE INDEX "idx_transactions_organization_id" ON "public"."transactions" USING "btree" ("organization_id");



CREATE INDEX "idx_transactions_search" ON "public"."transactions" USING "gin" ("to_tsvector"('"english"'::"regconfig", COALESCE("description", ''::"text")));



CREATE INDEX "idx_transactions_status" ON "public"."transactions" USING "btree" ("status");



CREATE INDEX "idx_transactions_type" ON "public"."transactions" USING "btree" ("type");



CREATE INDEX "idx_unmatched_transfers_reference_provided" ON "public"."unmatched_transfers" USING "btree" ("reference_provided");



CREATE INDEX "idx_unmatched_transfers_status" ON "public"."unmatched_transfers" USING "btree" ("status");



CREATE INDEX "idx_wallets_balance" ON "public"."wallets" USING "btree" ("balance_cents");



CREATE INDEX "idx_wallets_balance_cents" ON "public"."wallets" USING "btree" ("balance_cents");



CREATE INDEX "idx_wallets_org_id" ON "public"."wallets" USING "btree" ("organization_id");



CREATE INDEX "idx_wallets_organization_id" ON "public"."wallets" USING "btree" ("organization_id");



CREATE OR REPLACE TRIGGER "set_updated_at_application" BEFORE UPDATE ON "public"."application" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_asset" BEFORE UPDATE ON "public"."asset" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_asset_binding" BEFORE UPDATE ON "public"."asset_binding" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_bank_transfer_requests" BEFORE UPDATE ON "public"."bank_transfer_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_organizations" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_profiles" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_subscriptions" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_topup_requests" BEFORE UPDATE ON "public"."topup_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_transactions" BEFORE UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_unmatched_transfers" BEFORE UPDATE ON "public"."unmatched_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_wallets" BEFORE UPDATE ON "public"."wallets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "topup_request_reservation_trigger" AFTER INSERT OR UPDATE ON "public"."topup_requests" FOR EACH ROW EXECUTE FUNCTION "public"."handle_topup_request_changes"();



COMMENT ON TRIGGER "topup_request_reservation_trigger" ON "public"."topup_requests" IS 'UNIFIED TRIGGER: Handles all fund reservation/release operations. Old conflicting triggers removed.';



CREATE OR REPLACE TRIGGER "update_binance_pay_orders_updated_at" BEFORE UPDATE ON "public"."binance_pay_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_binance_pay_orders_updated_at"();



CREATE OR REPLACE TRIGGER "update_ticket_on_message_insert" AFTER INSERT ON "public"."support_ticket_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_ticket_timestamp_on_message"();



CREATE OR REPLACE TRIGGER "validate_bm_asset_type_trigger" BEFORE INSERT OR UPDATE ON "public"."bm_domains" FOR EACH ROW EXECUTE FUNCTION "public"."validate_bm_asset_type"();



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("profile_id") ON DELETE SET NULL;



COMMENT ON CONSTRAINT "application_approved_by_fkey" ON "public"."application" IS 'Links to the admin who approved this application';



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_fulfilled_by_fkey" FOREIGN KEY ("fulfilled_by") REFERENCES "public"."profiles"("profile_id") ON DELETE SET NULL;



COMMENT ON CONSTRAINT "application_fulfilled_by_fkey" ON "public"."application" IS 'Links to the admin who fulfilled this application';



ALTER TABLE ONLY "public"."application_fulfillment"
    ADD CONSTRAINT "application_fulfillment_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."application"("application_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_fulfillment"
    ADD CONSTRAINT "application_fulfillment_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "public"."profiles"("profile_id") ON DELETE SET NULL;



COMMENT ON CONSTRAINT "application_rejected_by_fkey" ON "public"."application" IS 'Links to the admin who rejected this application';



ALTER TABLE ONLY "public"."asset_binding"
    ADD CONSTRAINT "asset_binding_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."asset_binding"
    ADD CONSTRAINT "asset_binding_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_transfer_requests"
    ADD CONSTRAINT "bank_transfer_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."binance_pay_orders"
    ADD CONSTRAINT "binance_pay_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."bm_domains"
    ADD CONSTRAINT "bm_domains_bm_asset_id_fkey" FOREIGN KEY ("bm_asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bm_domains"
    ADD CONSTRAINT "bm_domains_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("plan_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."promotion_urls"
    ADD CONSTRAINT "promotion_urls_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("plan_id");



ALTER TABLE ONLY "public"."support_ticket_attachments"
    ADD CONSTRAINT "support_ticket_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."support_ticket_messages"("message_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_ticket_attachments"
    ADD CONSTRAINT "support_ticket_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("ticket_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_ticket_attachments"
    ADD CONSTRAINT "support_ticket_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("ticket_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("profile_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."topup_requests"
    ADD CONSTRAINT "topup_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("wallet_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."unmatched_transfers"
    ADD CONSTRAINT "unmatched_transfers_matched_request_id_fkey" FOREIGN KEY ("matched_request_id") REFERENCES "public"."bank_transfer_requests"("request_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all BM domains" ON "public"."bm_domains" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."profile_id" = "auth"."uid"()) AND ("profiles"."is_superuser" = true)))));



CREATE POLICY "Admins can manage all applications" ON "public"."application" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage all asset bindings" ON "public"."asset_binding" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage all assets" ON "public"."asset" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage all bank transfer requests" ON "public"."bank_transfer_requests" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage all memberships" ON "public"."organization_members" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage all promotion URLs" ON "public"."promotion_urls" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."profile_id" = "auth"."uid"()) AND ("profiles"."is_superuser" = true)))));



CREATE POLICY "Admins can manage all topup requests" ON "public"."topup_requests" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage all unmatched transfers" ON "public"."unmatched_transfers" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage plans" ON "public"."plans" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can update all organizations" ON "public"."organizations" FOR UPDATE USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can update all profiles" ON "public"."profiles" FOR UPDATE USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all attachments" ON "public"."support_ticket_attachments" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."profile_id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all messages" ON "public"."support_ticket_messages" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."profile_id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all organizations" ON "public"."organizations" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all tickets" ON "public"."support_tickets" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."profile_id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Authenticated users can view plans" ON "public"."plans" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Organization owners can view all memberships" ON "public"."organization_members" FOR SELECT USING (("organization_id" IN ( SELECT "organizations"."organization_id"
   FROM "public"."organizations"
  WHERE ("organizations"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Service role can manage all applications" ON "public"."application" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all asset bindings" ON "public"."asset_binding" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all assets" ON "public"."asset" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all bank transfer requests" ON "public"."bank_transfer_requests" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all data" ON "public"."organizations" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all organization members" ON "public"."organization_members" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all profiles" ON "public"."profiles" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all topup requests" ON "public"."topup_requests" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all transactions" ON "public"."transactions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all unmatched transfers" ON "public"."unmatched_transfers" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all wallets" ON "public"."wallets" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "System can update Binance Pay orders" ON "public"."binance_pay_orders" FOR UPDATE USING (true);



CREATE POLICY "Users can create Binance Pay orders for their organization" ON "public"."binance_pay_orders" FOR INSERT WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create applications for their organization" ON "public"."application" FOR INSERT WITH CHECK (("organization_id" IN ( SELECT "get_user_organizations"."organization_id"
   FROM "public"."get_user_organizations"("auth"."uid"()) "get_user_organizations"("organization_id"))));



CREATE POLICY "Users can create bank transfer requests for their organization" ON "public"."bank_transfer_requests" FOR INSERT WITH CHECK ((("organization_id" IN ( SELECT "get_user_organizations"."organization_id"
   FROM "public"."get_user_organizations"("auth"."uid"()) "get_user_organizations"("organization_id"))) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can create memberships for their organizations" ON "public"."organization_members" FOR INSERT WITH CHECK (("organization_id" IN ( SELECT "organizations"."organization_id"
   FROM "public"."organizations"
  WHERE ("organizations"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Users can create messages on their organization's tickets" ON "public"."support_ticket_messages" FOR INSERT WITH CHECK ((("ticket_id" IN ( SELECT "support_tickets"."ticket_id"
   FROM "public"."support_tickets"
  WHERE ("support_tickets"."organization_id" IN ( SELECT "organization_members"."organization_id"
           FROM "public"."organization_members"
          WHERE ("organization_members"."user_id" = "auth"."uid"()))))) AND ("sender_id" = "auth"."uid"()) AND (NOT "is_internal")));



CREATE POLICY "Users can create organizations" ON "public"."organizations" FOR INSERT WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can create tickets for their organization" ON "public"."support_tickets" FOR INSERT WITH CHECK ((("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))) AND ("created_by" = "auth"."uid"())));



CREATE POLICY "Users can create topup requests" ON "public"."topup_requests" FOR INSERT WITH CHECK ((("organization_id" IN ( SELECT "get_user_organizations"."organization_id"
   FROM "public"."get_user_organizations"("auth"."uid"()) "get_user_organizations"("organization_id"))) AND ("requested_by" = "auth"."uid"())));



CREATE POLICY "Users can manage their organization's BM domains" ON "public"."bm_domains" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage their organization's promotion URLs" ON "public"."promotion_urls" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update organizations they own" ON "public"."organizations" FOR UPDATE USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own tickets" ON "public"."support_tickets" FOR UPDATE USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can upload attachments to their organization's tickets" ON "public"."support_ticket_attachments" FOR INSERT WITH CHECK ((("uploaded_by" = "auth"."uid"()) AND ((("ticket_id" IS NOT NULL) AND ("ticket_id" IN ( SELECT "support_tickets"."ticket_id"
   FROM "public"."support_tickets"
  WHERE ("support_tickets"."organization_id" IN ( SELECT "organization_members"."organization_id"
           FROM "public"."organization_members"
          WHERE ("organization_members"."user_id" = "auth"."uid"())))))) OR (("message_id" IS NOT NULL) AND ("message_id" IN ( SELECT "support_ticket_messages"."message_id"
   FROM "public"."support_ticket_messages"
  WHERE ("support_ticket_messages"."ticket_id" IN ( SELECT "support_tickets"."ticket_id"
           FROM "public"."support_tickets"
          WHERE ("support_tickets"."organization_id" IN ( SELECT "organization_members"."organization_id"
                   FROM "public"."organization_members"
                  WHERE ("organization_members"."user_id" = "auth"."uid"())))))))))));



CREATE POLICY "Users can view attachments from their organization's tickets" ON "public"."support_ticket_attachments" FOR SELECT USING (((("ticket_id" IS NOT NULL) AND ("ticket_id" IN ( SELECT "support_tickets"."ticket_id"
   FROM "public"."support_tickets"
  WHERE ("support_tickets"."organization_id" IN ( SELECT "organization_members"."organization_id"
           FROM "public"."organization_members"
          WHERE ("organization_members"."user_id" = "auth"."uid"())))))) OR (("message_id" IS NOT NULL) AND ("message_id" IN ( SELECT "support_ticket_messages"."message_id"
   FROM "public"."support_ticket_messages"
  WHERE ("support_ticket_messages"."ticket_id" IN ( SELECT "support_tickets"."ticket_id"
           FROM "public"."support_tickets"
          WHERE ("support_tickets"."organization_id" IN ( SELECT "organization_members"."organization_id"
                   FROM "public"."organization_members"
                  WHERE ("organization_members"."user_id" = "auth"."uid"()))))))))));



CREATE POLICY "Users can view messages from their organization's tickets" ON "public"."support_ticket_messages" FOR SELECT USING ((("ticket_id" IN ( SELECT "support_tickets"."ticket_id"
   FROM "public"."support_tickets"
  WHERE ("support_tickets"."organization_id" IN ( SELECT "organization_members"."organization_id"
           FROM "public"."organization_members"
          WHERE ("organization_members"."user_id" = "auth"."uid"()))))) AND (NOT "is_internal")));



CREATE POLICY "Users can view organizations they belong to" ON "public"."organizations" FOR SELECT USING ((("owner_id" = "auth"."uid"()) OR ("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own organization topup requests" ON "public"."topup_requests" FOR SELECT USING (("organization_id" IN ( SELECT "get_user_organizations"."organization_id"
   FROM "public"."get_user_organizations"("auth"."uid"()) "get_user_organizations"("organization_id"))));



CREATE POLICY "Users can view their organization's BM domains" ON "public"."bm_domains" FOR SELECT USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their organization's Binance Pay orders" ON "public"."binance_pay_orders" FOR SELECT USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their organization's applications" ON "public"."application" FOR SELECT USING (("organization_id" IN ( SELECT "get_user_organizations"."organization_id"
   FROM "public"."get_user_organizations"("auth"."uid"()) "get_user_organizations"("organization_id"))));



CREATE POLICY "Users can view their organization's asset bindings" ON "public"."asset_binding" FOR SELECT USING (("organization_id" IN ( SELECT "get_user_organizations"."organization_id"
   FROM "public"."get_user_organizations"("auth"."uid"()) "get_user_organizations"("organization_id"))));



CREATE POLICY "Users can view their organization's bank transfer requests" ON "public"."bank_transfer_requests" FOR SELECT USING (("organization_id" IN ( SELECT "get_user_organizations"."organization_id"
   FROM "public"."get_user_organizations"("auth"."uid"()) "get_user_organizations"("organization_id"))));



CREATE POLICY "Users can view their organization's pixel assets" ON "public"."asset" FOR SELECT USING ((("type" = 'pixel'::"text") AND ("asset_id" IN ( SELECT "ab"."asset_id"
   FROM ("public"."asset_binding" "ab"
     JOIN "public"."profiles" "p" ON (("p"."organization_id" = "ab"."organization_id")))
  WHERE ("p"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their organization's promotion URLs" ON "public"."promotion_urls" FOR SELECT USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their organization's tickets" ON "public"."support_tickets" FOR SELECT USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their organization's wallet" ON "public"."wallets" FOR SELECT USING (("organization_id" IN ( SELECT "get_user_organizations"."organization_id"
   FROM "public"."get_user_organizations"("auth"."uid"()) "get_user_organizations"("organization_id"))));



CREATE POLICY "Users can view their own memberships" ON "public"."organization_members" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("profile_id" = "auth"."uid"()));



ALTER TABLE "public"."application" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."application_fulfillment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."asset" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."asset_binding" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_transfer_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."binance_pay_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bm_domains" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promotion_urls" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_ticket_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_ticket_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."topup_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unmatched_transfers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_data_retention_period"("plan_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_data_retention_period"("plan_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_data_retention_period"("plan_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_add_domain_to_bm"("p_bm_asset_id" "uuid", "p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_add_domain_to_bm"("p_bm_asset_id" "uuid", "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_add_domain_to_bm"("p_bm_asset_id" "uuid", "p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_organization_membership"("p_user_id" "uuid", "p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_organization_membership"("p_user_id" "uuid", "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_organization_membership"("p_user_id" "uuid", "p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_pixel_request_exists"("p_organization_id" "uuid", "p_pixel_id" "text", "p_business_manager_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_pixel_request_exists"("p_organization_id" "uuid", "p_pixel_id" "text", "p_business_manager_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_pixel_request_exists"("p_organization_id" "uuid", "p_pixel_id" "text", "p_business_manager_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_organizations"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_organizations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_organizations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_topup_transfer"("p_organization_id" "uuid", "p_amount_cents" integer, "p_request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_topup_transfer"("p_organization_id" "uuid", "p_amount_cents" integer, "p_request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_topup_transfer"("p_organization_id" "uuid", "p_amount_cents" integer, "p_request_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fulfill_pixel_connection_request"("p_application_id" "uuid", "p_admin_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fulfill_pixel_connection_request"("p_application_id" "uuid", "p_admin_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fulfill_pixel_connection_request"("p_application_id" "uuid", "p_admin_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_assets_for_deactivation"("p_organization_id" "uuid", "p_asset_type" "text", "p_count_to_deactivate" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_assets_for_deactivation"("p_organization_id" "uuid", "p_asset_type" "text", "p_count_to_deactivate" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_assets_for_deactivation"("p_organization_id" "uuid", "p_asset_type" "text", "p_count_to_deactivate" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bm_domain_count"("p_bm_asset_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_bm_domain_count"("p_bm_asset_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bm_domain_count"("p_bm_asset_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_domains_per_bm_limit"("p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_domains_per_bm_limit"("p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_domains_per_bm_limit"("p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_organization_dashboard_data"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_organization_dashboard_data"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_dashboard_data"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_organization_pixels"("p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_organization_pixels"("p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_pixels"("p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_promotion_url_limit"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_promotion_url_limit"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_promotion_url_limit"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_tickets_with_metadata"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_tickets_with_metadata"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tickets_with_metadata"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_organizations"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_organizations"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_organizations"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_plan_downgrade"("p_organization_id" "uuid", "p_new_plan_id" "text", "p_downgrade_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."handle_plan_downgrade"("p_organization_id" "uuid", "p_new_plan_id" "text", "p_downgrade_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_plan_downgrade"("p_organization_id" "uuid", "p_new_plan_id" "text", "p_downgrade_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_subscription_cancellation"("p_organization_id" "uuid", "p_cancelled_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."handle_subscription_cancellation"("p_organization_id" "uuid", "p_cancelled_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_subscription_cancellation"("p_organization_id" "uuid", "p_cancelled_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_topup_request_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_topup_request_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_topup_request_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."migrate_promotion_urls_to_bm_domains"() TO "anon";
GRANT ALL ON FUNCTION "public"."migrate_promotion_urls_to_bm_domains"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."migrate_promotion_urls_to_bm_domains"() TO "service_role";



GRANT ALL ON FUNCTION "public"."release_reserved_funds"("org_id" "uuid", "amount_cents" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."release_reserved_funds"("org_id" "uuid", "amount_cents" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."release_reserved_funds"("org_id" "uuid", "amount_cents" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."reserve_funds_for_topup"("org_id" "uuid", "amount_cents" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."reserve_funds_for_topup"("org_id" "uuid", "amount_cents" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reserve_funds_for_topup"("org_id" "uuid", "amount_cents" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."resolve_asset_names"("asset_ids" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_asset_names"("asset_ids" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_asset_names"("asset_ids" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_pixel_connection_request"("p_organization_id" "uuid", "p_pixel_id" "text", "p_pixel_name" "text", "p_business_manager_id" "text", "p_requested_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_pixel_connection_request"("p_organization_id" "uuid", "p_pixel_id" "text", "p_pixel_name" "text", "p_business_manager_id" "text", "p_requested_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_pixel_connection_request"("p_organization_id" "uuid", "p_pixel_id" "text", "p_pixel_name" "text", "p_business_manager_id" "text", "p_requested_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_asset_activation"("p_asset_id" "uuid", "p_organization_id" "uuid", "p_is_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_asset_activation"("p_asset_id" "uuid", "p_organization_id" "uuid", "p_is_active" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_asset_activation"("p_asset_id" "uuid", "p_organization_id" "uuid", "p_is_active" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_asset_activation_cascade"("p_asset_id" "uuid", "p_organization_id" "uuid", "p_is_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_asset_activation_cascade"("p_asset_id" "uuid", "p_organization_id" "uuid", "p_is_active" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_asset_activation_cascade"("p_asset_id" "uuid", "p_organization_id" "uuid", "p_is_active" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_binance_pay_orders_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_binance_pay_orders_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_binance_pay_orders_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_pixel_request_status"("p_request_id" "uuid", "p_status" "text", "p_admin_notes" "text", "p_processed_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_pixel_request_status"("p_request_id" "uuid", "p_status" "text", "p_admin_notes" "text", "p_processed_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_pixel_request_status"("p_request_id" "uuid", "p_status" "text", "p_admin_notes" "text", "p_processed_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_ticket_timestamp_on_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_ticket_timestamp_on_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ticket_timestamp_on_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_bm_asset_type"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_bm_asset_type"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_bm_asset_type"() TO "service_role";



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



GRANT ALL ON TABLE "public"."bank_transfer_requests" TO "anon";
GRANT ALL ON TABLE "public"."bank_transfer_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_transfer_requests" TO "service_role";



GRANT ALL ON TABLE "public"."binance_pay_orders" TO "anon";
GRANT ALL ON TABLE "public"."binance_pay_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."binance_pay_orders" TO "service_role";



GRANT ALL ON TABLE "public"."bm_domains" TO "anon";
GRANT ALL ON TABLE "public"."bm_domains" TO "authenticated";
GRANT ALL ON TABLE "public"."bm_domains" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."wallets" TO "anon";
GRANT ALL ON TABLE "public"."wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."wallets" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_summary" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_summary" TO "service_role";



GRANT ALL ON TABLE "public"."onboarding_states" TO "anon";
GRANT ALL ON TABLE "public"."onboarding_states" TO "authenticated";
GRANT ALL ON TABLE "public"."onboarding_states" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."plans" TO "anon";
GRANT ALL ON TABLE "public"."plans" TO "authenticated";
GRANT ALL ON TABLE "public"."plans" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."promotion_urls" TO "anon";
GRANT ALL ON TABLE "public"."promotion_urls" TO "authenticated";
GRANT ALL ON TABLE "public"."promotion_urls" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."support_ticket_attachments" TO "anon";
GRANT ALL ON TABLE "public"."support_ticket_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."support_ticket_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."support_ticket_messages" TO "anon";
GRANT ALL ON TABLE "public"."support_ticket_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."support_ticket_messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."support_tickets_ticket_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."support_tickets_ticket_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."support_tickets_ticket_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."topup_requests" TO "anon";
GRANT ALL ON TABLE "public"."topup_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."topup_requests" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."unmatched_transfers" TO "anon";
GRANT ALL ON TABLE "public"."unmatched_transfers" TO "authenticated";
GRANT ALL ON TABLE "public"."unmatched_transfers" TO "service_role";



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

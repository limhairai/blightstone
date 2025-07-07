

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'AdHub comprehensive schema with semantic IDs and subscription system';



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


COMMENT ON FUNCTION "public"."complete_topup_transfer"("p_organization_id" "uuid", "p_amount_cents" integer, "p_request_id" "uuid") IS 'FIXED: Deducts money from wallet balance AND releases reserved funds when admin completes topup request.';



CREATE OR REPLACE FUNCTION "public"."get_available_balance"("wallet_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE
    AS $_$
    SELECT balance_cents - reserved_balance_cents
    FROM public.wallets
    WHERE wallets.wallet_id = $1;
$_$;


ALTER FUNCTION "public"."get_available_balance"("wallet_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text" DEFAULT NULL::"text") RETURNS TABLE("asset_id" "uuid", "type" "text", "dolphin_id" "text", "name" "text", "status" "text", "metadata" "jsonb", "bound_at" timestamp with time zone, "binding_id" "uuid", "last_synced_at" timestamp with time zone)
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
        a.last_synced_at
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
  new_org_name TEXT;
  new_wallet_id UUID;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  
  -- Generate organization name from email
  new_org_name := COALESCE(
    split_part(user_email, '@', 1),
    'Organization ' || substring(NEW.id::text, 1, 8)
  );
  
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
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(user_email, '@', 1)),
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
    
    -- Release reserved funds (don't deduct from balance again - funds were already reserved)
    UPDATE public.wallets
    SET reserved_balance_cents = GREATEST(0, reserved_balance_cents - p_amount_cents),
        updated_at = NOW()
    WHERE wallet_id = v_wallet_id;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."release_reserved_funds"("p_organization_id" "uuid", "p_amount_cents" integer) OWNER TO "postgres";


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
    CONSTRAINT "application_request_type_check" CHECK (("request_type" = ANY (ARRAY['new_business_manager'::"text", 'additional_accounts'::"text"]))),
    CONSTRAINT "application_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'processing'::"text", 'rejected'::"text", 'fulfilled'::"text"])))
);


ALTER TABLE "public"."application" OWNER TO "postgres";


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
    CONSTRAINT "asset_type_check" CHECK (("type" = ANY (ARRAY['business_manager'::"text", 'ad_account'::"text", 'profile'::"text"])))
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
    CONSTRAINT "asset_binding_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."asset_binding" OWNER TO "postgres";


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
    "updated_at" timestamp with time zone DEFAULT "now"()
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


CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "wallet_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "balance_cents" integer DEFAULT 0,
    "reserved_balance_cents" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wallets" OWNER TO "postgres";


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



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("subscription_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



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



CREATE INDEX "idx_application_fulfillment_application_id" ON "public"."application_fulfillment" USING "btree" ("application_id");



CREATE INDEX "idx_application_fulfillment_asset_id" ON "public"."application_fulfillment" USING "btree" ("asset_id");



CREATE INDEX "idx_asset_binding_asset_id" ON "public"."asset_binding" USING "btree" ("asset_id");



CREATE INDEX "idx_asset_binding_organization_id" ON "public"."asset_binding" USING "btree" ("organization_id");



CREATE INDEX "idx_bank_transfer_requests_organization_id" ON "public"."bank_transfer_requests" USING "btree" ("organization_id");



CREATE INDEX "idx_bank_transfer_requests_reference_number" ON "public"."bank_transfer_requests" USING "btree" ("reference_number");



CREATE INDEX "idx_bank_transfer_requests_status" ON "public"."bank_transfer_requests" USING "btree" ("status");



CREATE INDEX "idx_organizations_plan_id" ON "public"."organizations" USING "btree" ("plan_id");



CREATE INDEX "idx_profiles_organization_id" ON "public"."profiles" USING "btree" ("organization_id");



CREATE INDEX "idx_subscriptions_organization_id" ON "public"."subscriptions" USING "btree" ("organization_id");



CREATE INDEX "idx_topup_requests_organization_id" ON "public"."topup_requests" USING "btree" ("organization_id");



CREATE INDEX "idx_topup_requests_status" ON "public"."topup_requests" USING "btree" ("status");



CREATE INDEX "idx_unmatched_transfers_reference_provided" ON "public"."unmatched_transfers" USING "btree" ("reference_provided");



CREATE INDEX "idx_unmatched_transfers_status" ON "public"."unmatched_transfers" USING "btree" ("status");



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



ALTER TABLE ONLY "public"."application_fulfillment"
    ADD CONSTRAINT "application_fulfillment_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."application"("application_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_fulfillment"
    ADD CONSTRAINT "application_fulfillment_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."asset_binding"
    ADD CONSTRAINT "asset_binding_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."asset_binding"
    ADD CONSTRAINT "asset_binding_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_transfer_requests"
    ADD CONSTRAINT "bank_transfer_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("wallet_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."unmatched_transfers"
    ADD CONSTRAINT "unmatched_transfers_matched_request_id_fkey" FOREIGN KEY ("matched_request_id") REFERENCES "public"."bank_transfer_requests"("request_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all applications" ON "public"."application" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage all asset bindings" ON "public"."asset_binding" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage all assets" ON "public"."asset" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage all bank transfer requests" ON "public"."bank_transfer_requests" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage all memberships" ON "public"."organization_members" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage all topup requests" ON "public"."topup_requests" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage all unmatched transfers" ON "public"."unmatched_transfers" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage plans" ON "public"."plans" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can update all organizations" ON "public"."organizations" FOR UPDATE USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can update all profiles" ON "public"."profiles" FOR UPDATE USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all organizations" ON "public"."organizations" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



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



CREATE POLICY "Users can create applications for their organization" ON "public"."application" FOR INSERT WITH CHECK (("organization_id" IN ( SELECT "get_user_organizations"."organization_id"
   FROM "public"."get_user_organizations"("auth"."uid"()) "get_user_organizations"("organization_id"))));



CREATE POLICY "Users can create bank transfer requests for their organization" ON "public"."bank_transfer_requests" FOR INSERT WITH CHECK ((("organization_id" IN ( SELECT "get_user_organizations"."organization_id"
   FROM "public"."get_user_organizations"("auth"."uid"()) "get_user_organizations"("organization_id"))) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can create memberships for their organizations" ON "public"."organization_members" FOR INSERT WITH CHECK (("organization_id" IN ( SELECT "organizations"."organization_id"
   FROM "public"."organizations"
  WHERE ("organizations"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Users can create organizations" ON "public"."organizations" FOR INSERT WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can create topup requests" ON "public"."topup_requests" FOR INSERT WITH CHECK ((("organization_id" IN ( SELECT "get_user_organizations"."organization_id"
   FROM "public"."get_user_organizations"("auth"."uid"()) "get_user_organizations"("organization_id"))) AND ("requested_by" = "auth"."uid"())));



CREATE POLICY "Users can update organizations they own" ON "public"."organizations" FOR UPDATE USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can view organizations they belong to" ON "public"."organizations" FOR SELECT USING ((("owner_id" = "auth"."uid"()) OR ("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own organization topup requests" ON "public"."topup_requests" FOR SELECT USING (("organization_id" IN ( SELECT "get_user_organizations"."organization_id"
   FROM "public"."get_user_organizations"("auth"."uid"()) "get_user_organizations"("organization_id"))));



CREATE POLICY "Users can view their organization's applications" ON "public"."application" FOR SELECT USING (("organization_id" IN ( SELECT "get_user_organizations"."organization_id"
   FROM "public"."get_user_organizations"("auth"."uid"()) "get_user_organizations"("organization_id"))));



CREATE POLICY "Users can view their organization's asset bindings" ON "public"."asset_binding" FOR SELECT USING (("organization_id" IN ( SELECT "get_user_organizations"."organization_id"
   FROM "public"."get_user_organizations"("auth"."uid"()) "get_user_organizations"("organization_id"))));



CREATE POLICY "Users can view their organization's bank transfer requests" ON "public"."bank_transfer_requests" FOR SELECT USING (("organization_id" IN ( SELECT "get_user_organizations"."organization_id"
   FROM "public"."get_user_organizations"("auth"."uid"()) "get_user_organizations"("organization_id"))));



CREATE POLICY "Users can view their organization's wallet" ON "public"."wallets" FOR SELECT USING (("organization_id" IN ( SELECT "get_user_organizations"."organization_id"
   FROM "public"."get_user_organizations"("auth"."uid"()) "get_user_organizations"("organization_id"))));



CREATE POLICY "Users can view their own memberships" ON "public"."organization_members" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("profile_id" = "auth"."uid"()));



ALTER TABLE "public"."application" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."application_fulfillment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."asset" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."asset_binding" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_transfer_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."topup_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unmatched_transfers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."check_organization_membership"("p_user_id" "uuid", "p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_organization_membership"("p_user_id" "uuid", "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_organization_membership"("p_user_id" "uuid", "p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_topup_transfer"("p_organization_id" "uuid", "p_amount_cents" integer, "p_request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_topup_transfer"("p_organization_id" "uuid", "p_amount_cents" integer, "p_request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_topup_transfer"("p_organization_id" "uuid", "p_amount_cents" integer, "p_request_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_balance"("wallet_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_balance"("wallet_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_balance"("wallet_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_organizations"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_organizations"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_organizations"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_topup_request_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_topup_request_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_topup_request_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."release_reserved_funds"("p_organization_id" "uuid", "p_amount_cents" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."release_reserved_funds"("p_organization_id" "uuid", "p_amount_cents" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."release_reserved_funds"("p_organization_id" "uuid", "p_amount_cents" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."reserve_funds_for_topup"("p_organization_id" "uuid", "p_amount_cents" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."reserve_funds_for_topup"("p_organization_id" "uuid", "p_amount_cents" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reserve_funds_for_topup"("p_organization_id" "uuid", "p_amount_cents" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



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



GRANT ALL ON TABLE "public"."unmatched_transfers" TO "anon";
GRANT ALL ON TABLE "public"."unmatched_transfers" TO "authenticated";
GRANT ALL ON TABLE "public"."unmatched_transfers" TO "service_role";



GRANT ALL ON TABLE "public"."wallets" TO "anon";
GRANT ALL ON TABLE "public"."wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."wallets" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;

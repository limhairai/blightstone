

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






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."fulfill_application"("p_application_id" "uuid", "p_asset_ids" "uuid"[], "p_admin_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_application RECORD;
    v_asset_id UUID;
    v_bound_count INTEGER := 0;
    v_error_count INTEGER := 0;
BEGIN
    -- Check if user is admin - FIX: Use table alias to avoid ambiguous column reference
    IF (SELECT p.is_superuser FROM public.profiles p WHERE p.id = p_admin_user_id) IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- Get application details
    SELECT * INTO v_application
    FROM public.application
    WHERE id = p_application_id;

    IF v_application IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Application not found');
    END IF;

    IF v_application.status != 'approved' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Application must be approved first');
    END IF;

    -- Bind each asset to the organization
    FOREACH v_asset_id IN ARRAY p_asset_ids
    LOOP
        BEGIN
            -- Create asset binding
            INSERT INTO public.asset_binding (asset_id, organization_id, bound_by)
            VALUES (v_asset_id, v_application.organization_id, p_admin_user_id);
            
            -- Track fulfillment
            INSERT INTO public.application_fulfillment (application_id, asset_id)
            VALUES (p_application_id, v_asset_id);
            
            v_bound_count := v_bound_count + 1;
        EXCEPTION WHEN OTHERS THEN
            v_error_count := v_error_count + 1;
        END;
    END LOOP;

    -- Update application status to fulfilled
    UPDATE public.application 
    SET 
        status = 'fulfilled',
        fulfilled_by = p_admin_user_id,
        fulfilled_at = NOW(),
        updated_at = NOW()
    WHERE id = p_application_id;

    RETURN jsonb_build_object(
        'success', true, 
        'bound_count', v_bound_count,
        'error_count', v_error_count
    );
END;
$$;


ALTER FUNCTION "public"."fulfill_application"("p_application_id" "uuid", "p_asset_ids" "uuid"[], "p_admin_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_applications"() RETURNS TABLE("id" "uuid", "organization_id" "uuid", "organization_name" "text", "request_type" "text", "target_bm_dolphin_id" "text", "website_url" "text", "status" "text", "approved_by" "uuid", "approved_at" timestamp with time zone, "rejected_by" "uuid", "rejected_at" timestamp with time zone, "fulfilled_by" "uuid", "fulfilled_at" timestamp with time zone, "client_notes" "text", "admin_notes" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if the calling user is a superuser - FIX: Use table alias to avoid ambiguous column reference
    IF (SELECT p.is_superuser FROM public.profiles p WHERE p.id = auth.uid()) IS NOT TRUE THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        a.id,
        a.organization_id,
        o.name AS organization_name,
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
        a.updated_at
    FROM
        public.application a
    LEFT JOIN
        public.organizations o ON a.organization_id = o.organization_id
    ORDER BY
        a.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_applications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_available_assets"("p_asset_type" "text" DEFAULT NULL::"text", "p_unbound_only" boolean DEFAULT false) RETURNS TABLE("id" "uuid", "type" "text", "dolphin_id" "text", "name" "text", "status" "text", "metadata" "jsonb", "last_synced_at" timestamp with time zone, "is_bound" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if the calling user is a superuser - FIX: Use table alias to avoid ambiguous column reference
    IF (SELECT p.is_superuser FROM public.profiles p WHERE p.id = auth.uid()) IS NOT TRUE THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        a.id,
        a.type,
        a.dolphin_id,
        a.name,
        a.status,
        a.metadata,
        a.last_synced_at,
        EXISTS(
            SELECT 1 FROM public.asset_binding ab 
            WHERE ab.asset_id = a.id AND ab.status = 'active'
        ) as is_bound
    FROM
        public.asset a
    WHERE
        a.status = 'active'
        AND (p_asset_type IS NULL OR a.type = p_asset_type)
        AND (
            p_unbound_only = FALSE OR 
            NOT EXISTS(
                SELECT 1 FROM public.asset_binding ab 
                WHERE ab.asset_id = a.id AND ab.status = 'active'
            )
        )
    ORDER BY
        a.name;
END;
$$;


ALTER FUNCTION "public"."get_available_assets"("p_asset_type" "text", "p_unbound_only" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "type" "text", "dolphin_id" "text", "name" "text", "status" "text", "metadata" "jsonb", "bound_at" timestamp with time zone, "binding_id" "uuid", "last_synced_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Verify user has access to this organization
    IF NOT EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.user_id = auth.uid() AND om.organization_id = p_organization_id
    ) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        a.id,
        a.type,
        a.dolphin_id,
        a.name,
        a.status,
        a.metadata,
        ab.bound_at,
        ab.id as binding_id,
        a.last_synced_at
    FROM
        public.asset_binding ab
    JOIN
        public.asset a ON ab.asset_id = a.id
    WHERE
        ab.organization_id = p_organization_id
        AND ab.status = 'active'
        AND (p_asset_type IS NULL OR a.type = p_asset_type)
    ORDER BY
        ab.bound_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text") OWNER TO "postgres";


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
  INSERT INTO public.profiles(id, organization_id, email, role)
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
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
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
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "asset_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."application_fulfillment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."asset" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "dolphin_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "metadata" "jsonb",
    "last_synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "asset_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'suspended'::"text"]))),
    CONSTRAINT "asset_type_check" CHECK (("type" = ANY (ARRAY['business_manager'::"text", 'ad_account'::"text", 'profile'::"text"])))
);


ALTER TABLE "public"."asset" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."asset_binding" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
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
    CONSTRAINT "funding_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."funding_requests" OWNER TO "postgres";


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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wallets" OWNER TO "postgres";


ALTER TABLE ONLY "public"."application_fulfillment"
    ADD CONSTRAINT "application_fulfillment_application_id_asset_id_key" UNIQUE ("application_id", "asset_id");



ALTER TABLE ONLY "public"."application_fulfillment"
    ADD CONSTRAINT "application_fulfillment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."asset_binding"
    ADD CONSTRAINT "asset_binding_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."asset"
    ADD CONSTRAINT "asset_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."asset"
    ADD CONSTRAINT "asset_type_dolphin_id_key" UNIQUE ("type", "dolphin_id");



ALTER TABLE ONLY "public"."funding_requests"
    ADD CONSTRAINT "funding_requests_pkey" PRIMARY KEY ("request_id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("user_id", "organization_id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("organization_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("transaction_id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_organization_id_key" UNIQUE ("organization_id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("wallet_id");



CREATE INDEX "idx_application_created_at" ON "public"."application" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_application_fulfillment_application_id" ON "public"."application_fulfillment" USING "btree" ("application_id");



CREATE INDEX "idx_application_fulfillment_asset_id" ON "public"."application_fulfillment" USING "btree" ("asset_id");



CREATE INDEX "idx_application_organization_id" ON "public"."application" USING "btree" ("organization_id");



CREATE INDEX "idx_application_request_type" ON "public"."application" USING "btree" ("request_type");



CREATE INDEX "idx_application_status" ON "public"."application" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_asset_binding_active_unique" ON "public"."asset_binding" USING "btree" ("asset_id") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_asset_binding_asset_id" ON "public"."asset_binding" USING "btree" ("asset_id");



CREATE INDEX "idx_asset_binding_organization_id" ON "public"."asset_binding" USING "btree" ("organization_id");



CREATE INDEX "idx_asset_binding_status" ON "public"."asset_binding" USING "btree" ("status");



CREATE INDEX "idx_asset_dolphin_id" ON "public"."asset" USING "btree" ("dolphin_id");



CREATE INDEX "idx_asset_metadata_gin" ON "public"."asset" USING "gin" ("metadata");



CREATE INDEX "idx_asset_status" ON "public"."asset" USING "btree" ("status");



CREATE INDEX "idx_asset_type" ON "public"."asset" USING "btree" ("type");



CREATE INDEX "idx_funding_requests_organization_id" ON "public"."funding_requests" USING "btree" ("organization_id");



CREATE INDEX "idx_organization_members_organization_id" ON "public"."organization_members" USING "btree" ("organization_id");



CREATE INDEX "idx_organization_members_user_id" ON "public"."organization_members" USING "btree" ("user_id");



CREATE INDEX "idx_organizations_owner_id" ON "public"."organizations" USING "btree" ("owner_id");



CREATE INDEX "idx_profiles_organization_id" ON "public"."profiles" USING "btree" ("organization_id");



CREATE INDEX "idx_transactions_organization_id" ON "public"."transactions" USING "btree" ("organization_id");



CREATE INDEX "idx_wallets_organization_id" ON "public"."wallets" USING "btree" ("organization_id");



CREATE OR REPLACE TRIGGER "update_application_updated_at" BEFORE UPDATE ON "public"."application" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_asset_binding_updated_at" BEFORE UPDATE ON "public"."asset_binding" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_asset_updated_at" BEFORE UPDATE ON "public"."asset" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_fulfilled_by_fkey" FOREIGN KEY ("fulfilled_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."application_fulfillment"
    ADD CONSTRAINT "application_fulfillment_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_fulfillment"
    ADD CONSTRAINT "application_fulfillment_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."asset_binding"
    ADD CONSTRAINT "asset_binding_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."asset_binding"
    ADD CONSTRAINT "asset_binding_bound_by_fkey" FOREIGN KEY ("bound_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."asset_binding"
    ADD CONSTRAINT "asset_binding_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funding_requests"
    ADD CONSTRAINT "funding_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funding_requests"
    ADD CONSTRAINT "funding_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("wallet_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

















































































































































































GRANT ALL ON FUNCTION "public"."fulfill_application"("p_application_id" "uuid", "p_asset_ids" "uuid"[], "p_admin_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fulfill_application"("p_application_id" "uuid", "p_asset_ids" "uuid"[], "p_admin_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fulfill_application"("p_application_id" "uuid", "p_asset_ids" "uuid"[], "p_admin_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_applications"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_applications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_applications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_assets"("p_asset_type" "text", "p_unbound_only" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_assets"("p_asset_type" "text", "p_unbound_only" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_assets"("p_asset_type" "text", "p_unbound_only" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_assets"("p_organization_id" "uuid", "p_asset_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



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



GRANT ALL ON TABLE "public"."funding_requests" TO "anon";
GRANT ALL ON TABLE "public"."funding_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."funding_requests" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



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

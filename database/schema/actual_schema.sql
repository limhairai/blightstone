

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






CREATE OR REPLACE FUNCTION "public"."fulfill_application_and_bind_assets"("p_application_id" "uuid", "p_organization_id" "uuid", "p_admin_user_id" "uuid", "p_dolphin_bm_asset_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_bm_id UUID;
    v_dolphin_bm_id_text TEXT;
    ad_account_asset RECORD;
BEGIN
    -- Step 1: Create the local Business Manager record for the client
    -- First, get the dolphin_asset_id (text version) for the main BM asset
    SELECT da.dolphin_asset_id INTO v_dolphin_bm_id_text
    FROM public.dolphin_assets da
    WHERE da.asset_id = p_dolphin_bm_asset_id;

    INSERT INTO public.business_managers (organization_id, application_id, dolphin_business_manager_id, status)
    VALUES (p_organization_id, p_application_id, v_dolphin_bm_id_text, 'active')
    RETURNING bm_id INTO new_bm_id;

    -- Step 2: Bind the main Business Manager asset to the organization
    INSERT INTO public.client_asset_bindings (asset_id, organization_id, bm_id, bound_by, status)
    VALUES (p_dolphin_bm_asset_id, p_organization_id, new_bm_id, p_admin_user_id, 'active');

    -- Step 3: Find, bind, and create records for all associated ad accounts
    FOR ad_account_asset IN
        SELECT *
        FROM public.dolphin_assets da
        WHERE da.asset_type = 'ad_account'
          AND da.asset_metadata->>'business_manager_id' = v_dolphin_bm_id_text
          -- Ensure we only grab unbound ad accounts
          AND NOT EXISTS (
              SELECT 1 FROM public.client_asset_bindings cab
              WHERE cab.asset_id = da.asset_id
          )
    LOOP
        -- Bind the ad account asset
        INSERT INTO public.client_asset_bindings (asset_id, organization_id, bm_id, bound_by, status)
        VALUES (ad_account_asset.asset_id, p_organization_id, new_bm_id, p_admin_user_id, 'active');

        -- Create the local ad_account record
        INSERT INTO public.ad_accounts (bm_id, name, dolphin_account_id, status)
        VALUES (new_bm_id, ad_account_asset.name, ad_account_asset.dolphin_asset_id, 'active');
    END LOOP;

    -- Step 4: Update the original application status to 'fulfilled'
    UPDATE public.bm_applications
    SET status = 'fulfilled'
    WHERE application_id = p_application_id;

    -- Return success
    RETURN jsonb_build_object('success', true, 'new_bm_id', new_bm_id);
END;
$$;


ALTER FUNCTION "public"."fulfill_application_and_bind_assets"("p_application_id" "uuid", "p_organization_id" "uuid", "p_admin_user_id" "uuid", "p_dolphin_bm_asset_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_bm_applications"() RETURNS TABLE("application_id" "uuid", "organization_id" "uuid", "website_url" "text", "status" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "organization_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if the calling user is a superuser. This is the correct check for platform-level admin access.
    IF (SELECT is_superuser FROM public.profiles WHERE id = auth.uid()) IS NOT TRUE THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        b.application_id,
        b.organization_id,
        b.website_url,
        b.status,
        b.created_at,
        b.updated_at,
        o.name AS organization_name
    FROM
        public.bm_applications b
    LEFT JOIN
        public.organizations o ON b.organization_id = o.organization_id
    ORDER BY
        b.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_admin_bm_applications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_client_business_managers"("p_organization_id" "uuid") RETURNS TABLE("bm_id" "uuid", "organization_id" "uuid", "application_id" "uuid", "dolphin_business_manager_id" "text", "status" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "name" "text", "ad_account_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        bm.bm_id,
        bm.organization_id,
        bm.application_id,
        bm.dolphin_business_manager_id,
        bm.status,
        bm.created_at,
        bm.updated_at,
        -- Join with dolphin_assets to get the real name
        da.name,
        -- Count associated ad accounts from active bindings, not the ad_accounts table
        (SELECT COUNT(*) 
         FROM public.client_asset_bindings cab
         JOIN public.dolphin_assets da_sub ON cab.asset_id = da_sub.asset_id
         WHERE cab.bm_id = bm.bm_id 
         AND cab.status = 'active'
         AND da_sub.asset_type = 'ad_account') as ad_account_count
    FROM
        public.business_managers bm
    LEFT JOIN
        public.dolphin_assets da ON bm.dolphin_business_manager_id = da.dolphin_asset_id AND da.asset_type = 'business_manager'
    WHERE
        bm.organization_id = p_organization_id
        -- Only show BMs that have active bindings (are actually bound to the organization)
        AND EXISTS (
            SELECT 1 FROM public.client_asset_bindings cab_bm
            WHERE cab_bm.bm_id = bm.bm_id 
            AND cab_bm.organization_id = p_organization_id
            AND cab_bm.status = 'active'
        )
    ORDER BY
        bm.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_client_business_managers"("p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_org_id UUID;
  user_email TEXT;
  new_org_name TEXT;
BEGIN
  -- It's better to get the email from the NEW record directly.
  user_email := NEW.email;
  
  -- Create a more user-friendly default organization name.
  new_org_name := split_part(user_email, '@', 1) || '''s Team';

  -- Create a new organization for the user.
  INSERT INTO public.organizations (name, owner_id)
  VALUES (new_org_name, NEW.id)
  RETURNING organization_id INTO new_org_id;

  -- Create the user's profile, linking it to the new organization.
  INSERT INTO public.profiles(id, organization_id, email, role)
  VALUES (NEW.id, new_org_id, user_email, 'client');
  
  -- Add the user to the organization as a member with the 'owner' role.
  -- This was the critical missing step that caused auth failures.
  INSERT INTO public.organization_members(user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');
  
  -- Inject the organization_id into the user's app_metadata for easy access on the client.
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('organization_id', new_org_id)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ad_accounts" (
    "ad_account_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "bm_id" "uuid",
    "name" "text" NOT NULL,
    "dolphin_account_id" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ad_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bm_applications" (
    "application_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "website_url" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "bm_applications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'ready'::"text", 'fulfilled'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."bm_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_managers" (
    "bm_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid",
    "application_id" "uuid",
    "dolphin_business_manager_id" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "business_managers_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'rejected'::"text", 'suspended'::"text"])))
);


ALTER TABLE "public"."business_managers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_asset_bindings" (
    "binding_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "asset_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "bm_id" "uuid",
    "status" "text" DEFAULT 'active'::"text",
    "bound_at" timestamp with time zone DEFAULT "now"(),
    "bound_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."client_asset_bindings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dolphin_assets" (
    "asset_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "asset_type" "text" NOT NULL,
    "dolphin_asset_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "asset_metadata" "jsonb",
    "last_sync_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "dolphin_assets_asset_type_check" CHECK (("asset_type" = ANY (ARRAY['business_manager'::"text", 'ad_account'::"text", 'profile'::"text"])))
);


ALTER TABLE "public"."dolphin_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funding_requests" (
    "request_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "ad_account_id" "uuid",
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
    "organization_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
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
    "transaction_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "wallet_id" "uuid" NOT NULL,
    "bm_id" "uuid",
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
    "wallet_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "balance_cents" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wallets" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ad_accounts"
    ADD CONSTRAINT "ad_accounts_pkey" PRIMARY KEY ("ad_account_id");



ALTER TABLE ONLY "public"."bm_applications"
    ADD CONSTRAINT "bm_applications_pkey" PRIMARY KEY ("application_id");



ALTER TABLE ONLY "public"."business_managers"
    ADD CONSTRAINT "business_managers_pkey" PRIMARY KEY ("bm_id");



ALTER TABLE ONLY "public"."client_asset_bindings"
    ADD CONSTRAINT "client_asset_bindings_pkey" PRIMARY KEY ("binding_id");



ALTER TABLE ONLY "public"."dolphin_assets"
    ADD CONSTRAINT "dolphin_assets_asset_type_dolphin_asset_id_key" UNIQUE ("asset_type", "dolphin_asset_id");



ALTER TABLE ONLY "public"."dolphin_assets"
    ADD CONSTRAINT "dolphin_assets_pkey" PRIMARY KEY ("asset_id");



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



CREATE INDEX "idx_bm_applications_organization_id" ON "public"."bm_applications" USING "btree" ("organization_id");



CREATE INDEX "idx_bm_applications_status" ON "public"."bm_applications" USING "btree" ("status");



CREATE INDEX "idx_business_managers_organization_id" ON "public"."business_managers" USING "btree" ("organization_id");



CREATE INDEX "idx_client_asset_bindings_asset_id" ON "public"."client_asset_bindings" USING "btree" ("asset_id");



CREATE INDEX "idx_client_asset_bindings_bm_id" ON "public"."client_asset_bindings" USING "btree" ("bm_id");



CREATE INDEX "idx_client_asset_bindings_organization_id" ON "public"."client_asset_bindings" USING "btree" ("organization_id");



CREATE INDEX "idx_dolphin_assets_asset_type" ON "public"."dolphin_assets" USING "btree" ("asset_type");



CREATE INDEX "idx_dolphin_assets_dolphin_asset_id" ON "public"."dolphin_assets" USING "btree" ("dolphin_asset_id");



CREATE INDEX "idx_organization_members_organization_id" ON "public"."organization_members" USING "btree" ("organization_id");



CREATE INDEX "idx_organization_members_user_id" ON "public"."organization_members" USING "btree" ("user_id");



CREATE INDEX "idx_organizations_owner_id" ON "public"."organizations" USING "btree" ("owner_id");



CREATE INDEX "idx_profiles_organization_id" ON "public"."profiles" USING "btree" ("organization_id");



CREATE INDEX "idx_transactions_organization_id" ON "public"."transactions" USING "btree" ("organization_id");



ALTER TABLE ONLY "public"."ad_accounts"
    ADD CONSTRAINT "ad_accounts_bm_id_fkey" FOREIGN KEY ("bm_id") REFERENCES "public"."business_managers"("bm_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bm_applications"
    ADD CONSTRAINT "bm_applications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_managers"
    ADD CONSTRAINT "business_managers_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."bm_applications"("application_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."business_managers"
    ADD CONSTRAINT "business_managers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_asset_bindings"
    ADD CONSTRAINT "client_asset_bindings_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."dolphin_assets"("asset_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_asset_bindings"
    ADD CONSTRAINT "client_asset_bindings_bm_id_fkey" FOREIGN KEY ("bm_id") REFERENCES "public"."business_managers"("bm_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."client_asset_bindings"
    ADD CONSTRAINT "client_asset_bindings_bound_by_fkey" FOREIGN KEY ("bound_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."client_asset_bindings"
    ADD CONSTRAINT "client_asset_bindings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funding_requests"
    ADD CONSTRAINT "funding_requests_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "public"."ad_accounts"("ad_account_id") ON DELETE SET NULL;



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
    ADD CONSTRAINT "transactions_bm_id_fkey" FOREIGN KEY ("bm_id") REFERENCES "public"."business_managers"("bm_id") ON DELETE SET NULL;



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

















































































































































































GRANT ALL ON FUNCTION "public"."fulfill_application_and_bind_assets"("p_application_id" "uuid", "p_organization_id" "uuid", "p_admin_user_id" "uuid", "p_dolphin_bm_asset_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fulfill_application_and_bind_assets"("p_application_id" "uuid", "p_organization_id" "uuid", "p_admin_user_id" "uuid", "p_dolphin_bm_asset_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fulfill_application_and_bind_assets"("p_application_id" "uuid", "p_organization_id" "uuid", "p_admin_user_id" "uuid", "p_dolphin_bm_asset_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_bm_applications"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_bm_applications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_bm_applications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_client_business_managers"("p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_client_business_managers"("p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_client_business_managers"("p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


















GRANT ALL ON TABLE "public"."ad_accounts" TO "anon";
GRANT ALL ON TABLE "public"."ad_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."ad_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."bm_applications" TO "anon";
GRANT ALL ON TABLE "public"."bm_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."bm_applications" TO "service_role";



GRANT ALL ON TABLE "public"."business_managers" TO "anon";
GRANT ALL ON TABLE "public"."business_managers" TO "authenticated";
GRANT ALL ON TABLE "public"."business_managers" TO "service_role";



GRANT ALL ON TABLE "public"."client_asset_bindings" TO "anon";
GRANT ALL ON TABLE "public"."client_asset_bindings" TO "authenticated";
GRANT ALL ON TABLE "public"."client_asset_bindings" TO "service_role";



GRANT ALL ON TABLE "public"."dolphin_assets" TO "anon";
GRANT ALL ON TABLE "public"."dolphin_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."dolphin_assets" TO "service_role";



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

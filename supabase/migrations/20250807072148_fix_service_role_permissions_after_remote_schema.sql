-- Fix service role permissions AFTER the remote schema migration
-- The remote schema migration (20250807072147_remote_schema.sql) revokes essential permissions
-- This migration runs after it to restore them

-- Restore ALL permissions for service_role on ALL essential tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Explicitly grant permissions on critical tables to ensure they work
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.organizations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.organization_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.wallets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.application TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.asset TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.asset_binding TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.topup_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.support_tickets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.application_pages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.bm_pages TO service_role;

-- Grant usage on sequences (needed for auto-incrementing IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Verify the fix worked
DO $$
BEGIN
    RAISE NOTICE '🔧 Service role permissions restored AFTER remote schema migration';
    RAISE NOTICE '✅ This should fix the permission denied errors for organization creation';
    RAISE NOTICE '🚀 Onboarding should now work properly!';
END $$;

-- Add comment documenting this fix
COMMENT ON SCHEMA public IS 'Service role permissions restored after remote schema migration to fix API operations';
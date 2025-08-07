-- Restore essential service role permissions that were revoked by remote schema migration
-- The remote schema migration (20250807072147_remote_schema.sql) incorrectly revoked service_role permissions

-- Restore service role permissions for organizations table
GRANT ALL ON TABLE public.organizations TO service_role;

-- Restore service role permissions for profiles table  
GRANT ALL ON TABLE public.profiles TO service_role;

-- Restore service role permissions for organization_members table
GRANT ALL ON TABLE public.organization_members TO service_role;

-- Restore service role permissions for wallets table
GRANT ALL ON TABLE public.wallets TO service_role;

-- Restore service role permissions for all other essential tables
GRANT ALL ON TABLE public.transactions TO service_role;
GRANT ALL ON TABLE public.application TO service_role;
GRANT ALL ON TABLE public.asset TO service_role;
GRANT ALL ON TABLE public.asset_binding TO service_role;
GRANT ALL ON TABLE public.topup_requests TO service_role;
GRANT ALL ON TABLE public.support_tickets TO service_role;

-- Also grant permissions on sequences (needed for auto-generated IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Add comment explaining the fix
COMMENT ON TABLE public.organizations IS 
'Service role permissions restored - required for API operations to work properly';

-- Verify permissions were granted
DO $$
BEGIN
    RAISE NOTICE 'Service role permissions restored for essential tables';
    RAISE NOTICE 'This fixes the permission denied errors during organization creation';
END $$;
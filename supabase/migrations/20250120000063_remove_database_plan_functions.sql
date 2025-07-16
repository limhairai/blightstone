-- Remove database plan limit functions since we now use pricing-config.ts as single source of truth
-- This completes the migration to application-layer plan limit enforcement

-- Drop the check_plan_limits function
DROP FUNCTION IF EXISTS public.check_plan_limits(UUID, TEXT);

-- Drop the debug function as well
DROP FUNCTION IF EXISTS public.debug_check_plan_limits(UUID, TEXT);

-- Add a comment explaining the architectural change
COMMENT ON SCHEMA public IS 'Plan limits are now enforced via pricing-config.ts in the application layer. The check_plan_limits function has been removed in favor of application-layer enforcement.';

-- Log the change
DO $$
BEGIN
    RAISE NOTICE 'Successfully removed database plan limit functions';
    RAISE NOTICE 'Plan limits are now enforced via pricing-config.ts in the application layer';
    RAISE NOTICE 'Backend subscription service now uses pricing config directly';
END $$; 
-- Remove check_plan_limits function as we now use pricing-config.ts as single source of truth
-- This function is no longer needed as all plan limit checking is done in the application layer

-- Drop the function
DROP FUNCTION IF EXISTS public.check_plan_limits(UUID, TEXT);

-- Drop the debug function as well
DROP FUNCTION IF EXISTS public.debug_check_plan_limits(UUID, TEXT);

-- Add a comment explaining the change
COMMENT ON SCHEMA public IS 'Plan limits are now enforced via pricing-config.ts in the application layer, not database functions'; 
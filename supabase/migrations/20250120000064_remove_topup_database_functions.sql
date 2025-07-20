-- Remove database top-up limit functions since we now use pricing-config.ts as single source of truth
-- This completes the migration of top-up limits to application-layer enforcement

-- Drop the get_monthly_topup_usage function
DROP FUNCTION IF EXISTS public.get_monthly_topup_usage(UUID);

-- Drop the can_make_topup_request function
DROP FUNCTION IF EXISTS public.can_make_topup_request(UUID, INTEGER);

-- Add a comment explaining the change
COMMENT ON COLUMN public.plans.monthly_topup_limit_cents IS 'DEPRECATED: Use pricing-config.ts for top-up limits. This field is no longer used for limit enforcement.';

-- Log the change
DO $$
BEGIN
    RAISE NOTICE 'Successfully removed database top-up limit functions';
    RAISE NOTICE 'Top-up limits are now enforced via pricing-config.ts in the application layer';
    RAISE NOTICE 'Functions removed: get_monthly_topup_usage, can_make_topup_request';
END $$; 
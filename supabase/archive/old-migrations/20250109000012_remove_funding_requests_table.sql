-- Remove funding_requests table and all associated remnants
-- This migration completely removes the old funding_requests system

-- Drop triggers first
DROP TRIGGER IF EXISTS funding_request_balance_trigger ON public.funding_requests;
DROP TRIGGER IF EXISTS set_timestamp_funding_requests ON public.funding_requests;

-- Drop functions related to funding_requests
DROP FUNCTION IF EXISTS public.handle_funding_request_changes();

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view own organization funding requests" ON public.funding_requests;
DROP POLICY IF EXISTS "Users can create funding requests for own organization" ON public.funding_requests;
DROP POLICY IF EXISTS "Users can update own pending funding requests" ON public.funding_requests;
DROP POLICY IF EXISTS "Admins can view all funding requests" ON public.funding_requests;
DROP POLICY IF EXISTS "Admins can update all funding requests" ON public.funding_requests;

-- Drop indexes
DROP INDEX IF EXISTS public.idx_funding_requests_organization_id;
DROP INDEX IF EXISTS public.idx_funding_requests_user_id;
DROP INDEX IF EXISTS public.idx_funding_requests_status;
DROP INDEX IF EXISTS public.idx_funding_requests_submitted_at;

-- Drop foreign key constraints
ALTER TABLE IF EXISTS public.funding_requests DROP CONSTRAINT IF EXISTS funding_requests_organization_id_fkey;
ALTER TABLE IF EXISTS public.funding_requests DROP CONSTRAINT IF EXISTS funding_requests_user_id_fkey;

-- Drop check constraints
ALTER TABLE IF EXISTS public.funding_requests DROP CONSTRAINT IF EXISTS funding_requests_status_check;

-- Drop the table itself
DROP TABLE IF EXISTS public.funding_requests;

-- Clean up any grants (these will be removed automatically with table drop, but being explicit)
-- Note: REVOKE statements will fail if table doesn't exist, so we use IF EXISTS pattern above

-- Add comment about the removal
COMMENT ON SCHEMA public IS 'Removed funding_requests table - replaced with topup_requests table with semantic IDs'; 
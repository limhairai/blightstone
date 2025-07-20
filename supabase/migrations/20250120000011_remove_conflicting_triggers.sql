-- Remove conflicting old triggers that cause double deduction
-- These old triggers are reserving/releasing funds in addition to our new unified trigger

-- Drop old triggers
DROP TRIGGER IF EXISTS reserve_balance_on_insert ON public.topup_requests;
DROP TRIGGER IF EXISTS release_balance_on_update ON public.topup_requests;

-- Drop old trigger functions
DROP FUNCTION IF EXISTS public.reserve_balance_on_topup_request();
DROP FUNCTION IF EXISTS public.release_balance_on_topup_status_change();

-- Verify only our correct trigger remains
-- The topup_request_reservation_trigger should be the only one handling fund operations

COMMENT ON TRIGGER topup_request_reservation_trigger ON public.topup_requests IS 
'UNIFIED TRIGGER: Handles all fund reservation/release operations. Old conflicting triggers removed.';

-- Log the cleanup
DO $$
BEGIN
    RAISE NOTICE 'Removed conflicting triggers: reserve_balance_on_insert, release_balance_on_update';
    RAISE NOTICE 'Removed conflicting functions: reserve_balance_on_topup_request, release_balance_on_topup_status_change';
    RAISE NOTICE 'Only topup_request_reservation_trigger should remain for fund operations';
END $$; 
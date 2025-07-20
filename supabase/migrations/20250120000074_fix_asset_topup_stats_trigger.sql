-- Fix the asset topup stats trigger that's causing UUID errors
-- The trigger was trying to cast ad_account_id (text) to UUID

-- Drop the problematic trigger and function
DROP TRIGGER IF EXISTS update_asset_topup_stats_trigger ON public.topup_requests;
DROP FUNCTION IF EXISTS public.update_asset_topup_stats();

-- The trigger was trying to update asset_binding using ad_account_id as UUID
-- But ad_account_id is text (Facebook ID like "1185414183335164"), not UUID
-- This trigger doesn't make sense in the current schema where:
-- - topup_requests.ad_account_id is TEXT (Facebook ad account ID)
-- - asset_binding.asset_id is UUID (internal asset ID)
-- These are completely different identifiers and can't be matched directly

-- If we need to track topup stats, we would need to:
-- 1. First find the asset_id from the asset table using the ad_account_id
-- 2. Then update the asset_binding table using that asset_id
-- But for now, we'll just remove this trigger since it's causing errors

-- Log the fix
DO $$
BEGIN
    RAISE NOTICE 'Removed problematic update_asset_topup_stats trigger';
    RAISE NOTICE 'This trigger was causing UUID errors by trying to cast ad_account_id (text) to UUID';
    RAISE NOTICE 'Topup completion should now work without UUID errors';
END $$; 
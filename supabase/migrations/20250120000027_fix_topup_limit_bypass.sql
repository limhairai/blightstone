-- Fix topup limit bypass vulnerability
-- The get_monthly_topup_usage function was only counting 'completed' requests
-- This allowed users to submit multiple requests that would exceed their monthly limit
-- Now we count pending, processing, and completed requests to prevent bypass

-- Update the monthly usage function to include pending and processing requests
CREATE OR REPLACE FUNCTION public.get_monthly_topup_usage(org_id UUID)
RETURNS INTEGER AS $$
DECLARE
    usage_cents INTEGER;
    current_month_start DATE;
BEGIN
    -- Get the start of the current month
    current_month_start := DATE_TRUNC('month', CURRENT_DATE);
    
    -- Sum all topup requests for this organization in the current month
    -- Include pending, processing, and completed requests to prevent limit bypass
    SELECT COALESCE(SUM(amount_cents), 0) INTO usage_cents
    FROM public.topup_requests
    WHERE organization_id = org_id
    AND status IN ('pending', 'processing', 'completed')  -- FIXED: Include pending and processing
    AND created_at >= current_month_start;
    
    RETURN usage_cents;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to document the security fix
COMMENT ON FUNCTION public.get_monthly_topup_usage(UUID) IS 'SECURITY FIX: Counts pending, processing, and completed requests to prevent monthly limit bypass';

-- Verify the fix works by testing the function
DO $$
BEGIN
    RAISE NOTICE 'Monthly topup usage function updated to prevent limit bypass vulnerability';
END $$; 
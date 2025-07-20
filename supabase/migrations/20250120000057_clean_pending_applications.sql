-- Clean up pending applications and fix status constraint
-- This migration cleans up old pending applications by marking them as cancelled
-- and ensures the constraint allows the 'cancelled' status

-- First, fix the application status constraint to allow 'cancelled' status
-- Drop the existing constraint if it exists
ALTER TABLE public.application DROP CONSTRAINT IF EXISTS application_status_check;

-- Add the correct constraint that includes 'cancelled'
ALTER TABLE public.application ADD CONSTRAINT application_status_check 
    CHECK (status IN ('pending', 'approved', 'processing', 'rejected', 'fulfilled', 'cancelled'));

-- Show pending applications before cleanup
DO $$
DECLARE
    app_record RECORD;
BEGIN
    RAISE NOTICE 'Pending applications before cleanup:';
    FOR app_record IN 
        SELECT application_id, organization_id, request_type, status, created_at
        FROM public.application 
        WHERE status IN ('pending', 'processing')
        ORDER BY created_at DESC
        LIMIT 20
    LOOP
        RAISE NOTICE 'App: % - Org: % - Type: % - Status: % - Created: %', 
            app_record.application_id, app_record.organization_id, 
            app_record.request_type, app_record.status, app_record.created_at;
    END LOOP;
END $$;

-- Clean up pending applications (mark as cancelled)
UPDATE public.application
SET status = 'cancelled',
    updated_at = NOW()
WHERE status IN ('pending', 'processing');

-- Show count of cancelled applications
DO $$
DECLARE
    cancelled_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO cancelled_count 
    FROM public.application 
    WHERE status = 'cancelled';
    
    RAISE NOTICE 'Cancelled % pending applications', cancelled_count;
END $$;

-- Test the limits again
DO $$
DECLARE
    test_org_id UUID;
    debug_result JSONB;
BEGIN
    -- Get first organization
    SELECT organization_id INTO test_org_id
    FROM organizations 
    LIMIT 1;
    
    IF test_org_id IS NOT NULL THEN
        -- Test business manager limits with debug info
        SELECT debug_check_plan_limits(test_org_id, 'businesses') INTO debug_result;
        RAISE NOTICE 'Debug result after cleanup: %', debug_result;
    END IF;
END $$; 
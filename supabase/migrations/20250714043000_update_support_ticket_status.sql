-- Update support ticket status from 'waiting_for_customer' to 'pending'
-- This ensures consistency with the new status naming convention

UPDATE public.support_tickets 
SET status = 'pending' 
WHERE status = 'waiting_for_customer';

-- Update any constraint that might reference the old status
-- (This is a safety measure in case there are any check constraints)
DO $$
BEGIN
    -- Check if there are any check constraints that need updating
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%support_tickets%status%'
        AND check_clause LIKE '%waiting_for_customer%'
    ) THEN
        -- Drop and recreate the constraint if it exists
        ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_status_check;
        ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_status_check 
            CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed'));
    END IF;
END $$; 
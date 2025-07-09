-- Add 'cancelled' status to application status constraint
-- This allows users to cancel their pending/processing applications

-- Drop the existing constraint
ALTER TABLE public.application DROP CONSTRAINT IF EXISTS application_status_check;

-- Add the new constraint with cancelled status
ALTER TABLE public.application ADD CONSTRAINT application_status_check 
CHECK (status IN ('pending', 'approved', 'processing', 'rejected', 'fulfilled', 'cancelled'));

-- Add comment for clarity
COMMENT ON CONSTRAINT application_status_check ON public.application IS 'Application status: pending (new), approved (admin approved), processing (with BlueFocus), rejected (denied), fulfilled (completed), cancelled (user cancelled)'; 
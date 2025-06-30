-- Add processing status to application status constraint
-- This allows the BlueFocus workflow: pending -> processing -> fulfilled

-- Drop the existing constraint
ALTER TABLE public.application DROP CONSTRAINT IF EXISTS application_status_check;

-- Add the new constraint with processing status
ALTER TABLE public.application ADD CONSTRAINT application_status_check 
CHECK (status IN ('pending', 'approved', 'processing', 'rejected', 'fulfilled')); 
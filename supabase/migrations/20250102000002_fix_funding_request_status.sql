-- Fix funding_requests status constraint to match frontend requirements
-- The frontend expects: 'pending', 'processing', 'completed', 'failed', 'cancelled'
-- But the current constraint only allows: 'pending', 'approved', 'rejected'

-- Drop the existing constraint
ALTER TABLE public.funding_requests DROP CONSTRAINT IF EXISTS funding_requests_status_check;

-- Add the new constraint with the correct status values
ALTER TABLE public.funding_requests ADD CONSTRAINT funding_requests_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')); 
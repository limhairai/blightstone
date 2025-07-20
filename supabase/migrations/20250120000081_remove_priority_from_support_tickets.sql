-- Remove priority column from support_tickets table
-- We don't track priority in the support system

-- Drop the priority column
ALTER TABLE public.support_tickets DROP COLUMN IF EXISTS priority;

-- Update any existing functions that might reference priority
-- The get_tickets_with_metadata function has already been updated in a previous migration 
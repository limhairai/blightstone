-- Fix application status constraint to allow 'cancelled' status
-- The constraint was preventing the cleanup migration from working

-- First, check what the current constraint allows
DO $$
DECLARE
    constraint_def TEXT;
BEGIN
    SELECT pg_get_constraintdef(oid) INTO constraint_def
    FROM pg_constraint 
    WHERE conname = 'application_status_check' 
    AND conrelid = 'application'::regclass;
    
    IF constraint_def IS NOT NULL THEN
        RAISE NOTICE 'Current constraint: %', constraint_def;
    ELSE
        RAISE NOTICE 'No application_status_check constraint found';
    END IF;
END $$;

-- Drop the existing constraint if it exists
ALTER TABLE public.application DROP CONSTRAINT IF EXISTS application_status_check;

-- Add the correct constraint that includes 'cancelled'
ALTER TABLE public.application ADD CONSTRAINT application_status_check 
    CHECK (status IN ('pending', 'approved', 'processing', 'rejected', 'fulfilled', 'cancelled'));

-- Verify the constraint was added correctly
DO $$
DECLARE
    constraint_def TEXT;
BEGIN
    SELECT pg_get_constraintdef(oid) INTO constraint_def
    FROM pg_constraint 
    WHERE conname = 'application_status_check' 
    AND conrelid = 'application'::regclass;
    
    RAISE NOTICE 'Updated constraint: %', constraint_def;
END $$; 
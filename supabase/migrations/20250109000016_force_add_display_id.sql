-- Force add display_id columns with a simpler approach
-- This migration will definitely add the columns if they don't exist

-- Add display_id to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS display_id TEXT;

-- Add display_id to topup_requests table  
ALTER TABLE public.topup_requests 
ADD COLUMN IF NOT EXISTS display_id TEXT;

-- Add unique constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'transactions_display_id_unique'
    ) THEN
        ALTER TABLE public.transactions 
        ADD CONSTRAINT transactions_display_id_unique UNIQUE (display_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'topup_requests_display_id_unique'
    ) THEN
        ALTER TABLE public.topup_requests 
        ADD CONSTRAINT topup_requests_display_id_unique UNIQUE (display_id);
    END IF;
END $$; 
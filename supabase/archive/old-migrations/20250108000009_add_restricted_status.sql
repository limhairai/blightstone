-- Add 'restricted' status to asset table constraint
-- This allows us to properly show Facebook restricted accounts to clients

-- Drop the existing constraint
ALTER TABLE public.asset DROP CONSTRAINT IF EXISTS asset_status_check;

-- Add the new constraint with 'restricted' status
ALTER TABLE public.asset ADD CONSTRAINT asset_status_check 
    CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text, 'restricted'::text]));

-- Update any existing 'inactive' records that should be 'restricted'
-- (This is safe to run multiple times)
UPDATE public.asset 
SET status = 'restricted' 
WHERE status = 'inactive' 
AND metadata->>'status' = 'RESTRICTED'; 
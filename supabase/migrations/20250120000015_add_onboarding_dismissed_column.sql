-- Add missing has_explicitly_dismissed column to onboarding_states table
ALTER TABLE public.onboarding_states 
ADD COLUMN IF NOT EXISTS has_explicitly_dismissed BOOLEAN DEFAULT FALSE;

-- Update existing records to have the default value
UPDATE public.onboarding_states 
SET has_explicitly_dismissed = FALSE 
WHERE has_explicitly_dismissed IS NULL; 
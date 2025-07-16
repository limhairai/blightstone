-- Add domains column to application table for BM applications
-- This allows storing multiple domains during BM application submission

ALTER TABLE public.application 
ADD COLUMN domains TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.application.domains IS 'Array of domains to be associated with the business manager when application is fulfilled';

-- Update existing applications to have empty domains array
UPDATE public.application 
SET domains = '{}' 
WHERE domains IS NULL; 
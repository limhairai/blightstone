-- Add name column to application table for better UX
ALTER TABLE public.application 
ADD COLUMN name TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_application_name ON public.application(name); 
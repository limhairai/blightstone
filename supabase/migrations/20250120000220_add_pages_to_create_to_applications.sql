-- Add pages_to_create column to applications table
-- This stores the pages that should be created when the BM application is approved

ALTER TABLE public.application 
ADD COLUMN pages_to_create JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN public.application.pages_to_create IS 'Array of pages to create when BM application is approved. Format: [{"name": "Page Name"}]';
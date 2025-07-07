-- Add metadata column to topup_requests table
ALTER TABLE public.topup_requests 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add index for metadata queries
CREATE INDEX IF NOT EXISTS idx_topup_requests_metadata ON public.topup_requests USING GIN (metadata);

-- Add comment
COMMENT ON COLUMN public.topup_requests.metadata IS 'Additional metadata including business manager information'; 
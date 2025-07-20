-- Add metadata column to support_ticket_messages table
-- This will store context about where messages were sent from (admin panel vs client)

ALTER TABLE public.support_ticket_messages 
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for metadata queries
CREATE INDEX idx_support_ticket_messages_metadata ON public.support_ticket_messages USING gin(metadata);

-- Add comment for documentation
COMMENT ON COLUMN public.support_ticket_messages.metadata IS 'Stores contextual information about the message, such as whether it was sent from admin panel'; 
-- Fix support ticket trigger that's causing "updated_at" error
-- The issue is that the trigger tries to access NEW.updated_at but NEW refers to the message record
-- We need to update the parent ticket's updated_at field when a message is inserted

-- Drop the existing faulty trigger and function
DROP TRIGGER IF EXISTS update_ticket_on_message_insert ON public.support_ticket_messages;
DROP FUNCTION IF EXISTS public.update_ticket_timestamp();

-- Create the correct function that updates the ticket's updated_at field
CREATE OR REPLACE FUNCTION public.update_ticket_timestamp_on_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the parent ticket's updated_at field when a message is inserted
    UPDATE public.support_tickets 
    SET updated_at = NOW()
    WHERE ticket_id = NEW.ticket_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that calls the correct function
CREATE TRIGGER update_ticket_on_message_insert
    AFTER INSERT ON public.support_ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ticket_timestamp_on_message();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_ticket_timestamp_on_message TO authenticated;

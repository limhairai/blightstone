-- Enhance support tickets with asset names and details
-- This migration adds asset name resolution to the get_tickets_with_metadata function

-- Create a function to resolve asset names from IDs
CREATE OR REPLACE FUNCTION public.resolve_asset_names(asset_ids TEXT[])
RETURNS JSONB AS $$
DECLARE
    result JSONB := '[]'::JSONB;
    asset_id TEXT;
    asset_record RECORD;
BEGIN
    -- Return empty array if no asset IDs provided
    IF asset_ids IS NULL OR array_length(asset_ids, 1) IS NULL THEN
        RETURN result;
    END IF;
    
    -- Loop through each asset ID and resolve its name
    FOREACH asset_id IN ARRAY asset_ids
    LOOP
        -- Try to find the asset in the asset table
        SELECT a.asset_id, a.name, a.type, a.dolphin_id
        INTO asset_record
        FROM public.asset a
        WHERE a.asset_id::TEXT = asset_id OR a.dolphin_id = asset_id;
        
        -- If found, add to result
        IF FOUND THEN
            result := result || jsonb_build_object(
                'id', asset_record.asset_id,
                'name', asset_record.name,
                'type', asset_record.type,
                'dolphin_id', asset_record.dolphin_id
            );
        ELSE
            -- If not found, add placeholder
            result := result || jsonb_build_object(
                'id', asset_id,
                'name', 'Unknown Asset',
                'type', 'unknown',
                'dolphin_id', asset_id
            );
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the existing function first since we're changing the return type
DROP FUNCTION IF EXISTS public.get_tickets_with_metadata(UUID);

-- Enhanced get_tickets_with_metadata function with asset names
CREATE OR REPLACE FUNCTION public.get_tickets_with_metadata(org_id UUID DEFAULT NULL)
RETURNS TABLE (
    ticket_id UUID,
    organization_id UUID,
    created_by UUID,
    assigned_to UUID,
    subject TEXT,
    category TEXT,
    priority TEXT,
    status TEXT,
    affected_asset_ids TEXT[],
    affected_assets JSONB, -- New field with asset details
    tags TEXT[],
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    ticket_number INTEGER,
    message_count BIGINT,
    last_message_at TIMESTAMPTZ,
    last_message_content TEXT,
    last_message_sender UUID,
    unread_messages BIGINT,
    creator_name TEXT,
    creator_email TEXT,
    assignee_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.ticket_id,
        t.organization_id,
        t.created_by,
        t.assigned_to,
        t.subject,
        t.category,
        t.priority,
        t.status,
        t.affected_asset_ids,
        public.resolve_asset_names(t.affected_asset_ids) as affected_assets, -- Resolve asset names
        t.tags,
        t.created_at,
        t.updated_at,
        t.ticket_number,
        COALESCE(msg_stats.message_count, 0) as message_count,
        msg_stats.last_message_at,
        msg_stats.last_message_content,
        msg_stats.last_message_sender,
        COALESCE(msg_stats.unread_messages, 0) as unread_messages,
        creator.name as creator_name,
        creator.email as creator_email,
        assignee.name as assignee_name
    FROM public.support_tickets t
    LEFT JOIN public.profiles creator ON t.created_by = creator.profile_id
    LEFT JOIN public.profiles assignee ON t.assigned_to = assignee.profile_id
    LEFT JOIN (
        SELECT 
            m.ticket_id,
            COUNT(*) as message_count,
            MAX(m.created_at) as last_message_at,
            (SELECT content FROM public.support_ticket_messages WHERE ticket_id = m.ticket_id ORDER BY created_at DESC LIMIT 1) as last_message_content,
            (SELECT sender_id FROM public.support_ticket_messages WHERE ticket_id = m.ticket_id ORDER BY created_at DESC LIMIT 1) as last_message_sender,
            COUNT(CASE WHEN NOT m.read_by_customer AND m.sender_id != t.created_by THEN 1 END) as unread_messages
        FROM public.support_ticket_messages m
        JOIN public.support_tickets t ON m.ticket_id = t.ticket_id
        WHERE NOT m.is_internal
        GROUP BY m.ticket_id
    ) msg_stats ON t.ticket_id = msg_stats.ticket_id
    WHERE (org_id IS NULL OR t.organization_id = org_id)
    ORDER BY t.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.resolve_asset_names TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tickets_with_metadata TO authenticated;

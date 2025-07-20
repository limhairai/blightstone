-- Fix ambiguous ticket_id reference in get_tickets_with_metadata function
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
            (SELECT content FROM public.support_ticket_messages WHERE support_ticket_messages.ticket_id = m.ticket_id ORDER BY created_at DESC LIMIT 1) as last_message_content,
            (SELECT sender_id FROM public.support_ticket_messages WHERE support_ticket_messages.ticket_id = m.ticket_id ORDER BY created_at DESC LIMIT 1) as last_message_sender,
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
-- Create support ticket system
-- This creates a comprehensive ticket system similar to Intercom's inbox design

-- Support tickets table
CREATE TABLE public.support_tickets (
    ticket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.profiles(profile_id) ON DELETE SET NULL,
    
    -- Ticket details
    subject TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'ad_account_issue',
        'business_manager_issue', 
        'pixel_access_request',
        'billing_question',
        'technical_support',
        'feature_request',
        'account_replacement',
        'spending_limit_issue',
        'general_inquiry'
    )),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_for_customer', 'resolved', 'closed')),
    
    -- Asset context - which BMs/accounts this ticket relates to
    affected_asset_ids TEXT[] DEFAULT '{}',
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    internal_notes TEXT, -- Admin-only notes
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    
    -- Auto-generated ticket number for display
    ticket_number INTEGER GENERATED ALWAYS AS IDENTITY
);

-- Support ticket messages table
CREATE TABLE public.support_ticket_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(ticket_id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
    
    -- Message content
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- True for admin-only messages
    
    -- Message metadata
    message_type TEXT DEFAULT 'message' CHECK (message_type IN ('message', 'status_change', 'assignment', 'note')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    
    -- Read status for real-time features
    read_by_customer BOOLEAN DEFAULT FALSE,
    read_by_admin BOOLEAN DEFAULT FALSE
);

-- Support ticket attachments table
CREATE TABLE public.support_ticket_attachments (
    attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.support_tickets(ticket_id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.support_ticket_messages(message_id) ON DELETE CASCADE,
    
    -- File details
    filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    
    -- Metadata
    uploaded_by UUID NOT NULL REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure attachment belongs to either ticket or message
    CONSTRAINT attachment_belongs_to_ticket_or_message 
        CHECK ((ticket_id IS NOT NULL AND message_id IS NULL) OR (ticket_id IS NULL AND message_id IS NOT NULL))
);

-- Indexes for performance
CREATE INDEX idx_support_tickets_organization_id ON public.support_tickets(organization_id);
CREATE INDEX idx_support_tickets_created_by ON public.support_tickets(created_by);
CREATE INDEX idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_category ON public.support_tickets(category);
CREATE INDEX idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX idx_support_tickets_updated_at ON public.support_tickets(updated_at DESC);

CREATE INDEX idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);
CREATE INDEX idx_support_ticket_messages_sender_id ON public.support_ticket_messages(sender_id);
CREATE INDEX idx_support_ticket_messages_created_at ON public.support_ticket_messages(created_at DESC);

CREATE INDEX idx_support_ticket_attachments_ticket_id ON public.support_ticket_attachments(ticket_id);
CREATE INDEX idx_support_ticket_attachments_message_id ON public.support_ticket_attachments(message_id);

-- RLS Policies
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_attachments ENABLE ROW LEVEL SECURITY;

-- Users can view tickets from their own organization
CREATE POLICY "Users can view their organization's tickets"
    ON public.support_tickets
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Users can create tickets for their organization
CREATE POLICY "Users can create tickets for their organization"
    ON public.support_tickets
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

-- Users can update their own tickets (limited fields)
CREATE POLICY "Users can update their own tickets"
    ON public.support_tickets
    FOR UPDATE
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
    ON public.support_tickets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Message policies
CREATE POLICY "Users can view messages from their organization's tickets"
    ON public.support_ticket_messages
    FOR SELECT
    USING (
        ticket_id IN (
            SELECT ticket_id FROM public.support_tickets
            WHERE organization_id IN (
                SELECT organization_id 
                FROM public.organization_members 
                WHERE user_id = auth.uid()
            )
        )
        AND NOT is_internal
    );

CREATE POLICY "Users can create messages on their organization's tickets"
    ON public.support_ticket_messages
    FOR INSERT
    WITH CHECK (
        ticket_id IN (
            SELECT ticket_id FROM public.support_tickets
            WHERE organization_id IN (
                SELECT organization_id 
                FROM public.organization_members 
                WHERE user_id = auth.uid()
            )
        )
        AND sender_id = auth.uid()
        AND NOT is_internal
    );

-- Admins can view all messages including internal ones
CREATE POLICY "Admins can view all messages"
    ON public.support_ticket_messages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Attachment policies
CREATE POLICY "Users can view attachments from their organization's tickets"
    ON public.support_ticket_attachments
    FOR SELECT
    USING (
        (ticket_id IS NOT NULL AND ticket_id IN (
            SELECT ticket_id FROM public.support_tickets
            WHERE organization_id IN (
                SELECT organization_id 
                FROM public.organization_members 
                WHERE user_id = auth.uid()
            )
        ))
        OR
        (message_id IS NOT NULL AND message_id IN (
            SELECT message_id FROM public.support_ticket_messages
            WHERE ticket_id IN (
                SELECT ticket_id FROM public.support_tickets
                WHERE organization_id IN (
                    SELECT organization_id 
                    FROM public.organization_members 
                    WHERE user_id = auth.uid()
                )
            )
        ))
    );

CREATE POLICY "Users can upload attachments to their organization's tickets"
    ON public.support_ticket_attachments
    FOR INSERT
    WITH CHECK (
        uploaded_by = auth.uid()
        AND (
            (ticket_id IS NOT NULL AND ticket_id IN (
                SELECT ticket_id FROM public.support_tickets
                WHERE organization_id IN (
                    SELECT organization_id 
                    FROM public.organization_members 
                    WHERE user_id = auth.uid()
                )
            ))
            OR
            (message_id IS NOT NULL AND message_id IN (
                SELECT message_id FROM public.support_ticket_messages
                WHERE ticket_id IN (
                    SELECT ticket_id FROM public.support_tickets
                    WHERE organization_id IN (
                        SELECT organization_id 
                        FROM public.organization_members 
                        WHERE user_id = auth.uid()
                    )
                )
            ))
        )
    );

-- Admins can view all attachments
CREATE POLICY "Admins can view all attachments"
    ON public.support_ticket_attachments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Functions for ticket management
CREATE OR REPLACE FUNCTION public.update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ticket timestamp when messages are added
CREATE TRIGGER update_ticket_on_message_insert
    AFTER INSERT ON public.support_ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ticket_timestamp();

-- Function to get ticket with message count and last message
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
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.support_ticket_messages TO authenticated;
GRANT SELECT, INSERT ON public.support_ticket_attachments TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tickets_with_metadata TO authenticated; 
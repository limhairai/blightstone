import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get current user from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    
    // Create anon client for user authentication
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: { user }, error: authError } = await anonSupabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's organization and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role, is_superuser')
      .eq('profile_id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select(`
        *,
        creator:profiles!support_tickets_created_by_fkey(name, email),
        assignee:profiles!support_tickets_assigned_to_fkey(name, email)
      `)
      .eq('ticket_id', params.ticketId)
      .single()

    if (ticketError) {
      console.error('Error fetching ticket:', ticketError)
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check permissions - users can only see their org's tickets, admins can see all
    const isAdmin = profile.is_superuser === true
    if (!isAdmin && ticket.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get ticket messages
    const { data: messages, error: messagesError } = await supabase
      .from('support_ticket_messages')
      .select(`
        *,
        sender:profiles!support_ticket_messages_sender_id_fkey(name, email, role),
        attachments:support_ticket_attachments(*)
      `)
      .eq('ticket_id', params.ticketId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Filter out internal messages for non-admin users
    const filteredMessages = isAdmin 
      ? messages 
      : messages?.filter(msg => !msg.is_internal) || []

    // Transform for frontend
    const transformedTicket = {
      id: ticket.ticket_id,
      ticket_id: ticket.ticket_id,
      ticketNumber: ticket.ticket_number,
      organizationId: ticket.organization_id,
      createdBy: ticket.created_by,
      assignedTo: ticket.assigned_to,
      subject: ticket.subject,
      category: ticket.category,

      status: ticket.status,
      affectedAssetIds: ticket.affected_asset_ids,
      tags: ticket.tags,
      internalNotes: isAdmin ? ticket.internal_notes : null,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      resolvedAt: ticket.resolved_at,
      closedAt: ticket.closed_at,
      creator: ticket.creator,
      assignee: ticket.assignee,
      messages: filteredMessages.map(msg => ({
        id: msg.message_id,
        message_id: msg.message_id,
        ticketId: msg.ticket_id,
        senderId: msg.sender_id,
        content: msg.content,
        isInternal: msg.is_internal,
        messageType: msg.message_type,
        createdAt: msg.created_at,
        editedAt: msg.edited_at,
        readByCustomer: msg.read_by_customer,
        readByAdmin: msg.read_by_admin,
        sender: msg.sender,
        attachments: msg.attachments || []
      }))
    }

    return NextResponse.json({ ticket: transformedTicket })

  } catch (error) {
    console.error('Error in ticket details API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get current user from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    
    // Create anon client for user authentication
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: { user }, error: authError } = await anonSupabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's organization and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role, is_superuser')
      .eq('profile_id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const updates: any = {}

    const isAdmin = profile.is_superuser === true

    // Only admins can update most fields
    if (isAdmin) {
      if (body.status) updates.status = body.status
  
      if (body.assignedTo !== undefined) updates.assigned_to = body.assignedTo
      if (body.tags) updates.tags = body.tags
      if (body.internalNotes !== undefined) updates.internal_notes = body.internalNotes
      
      // Set resolved/closed timestamps
      if (body.status === 'resolved' && !updates.resolved_at) {
        updates.resolved_at = new Date().toISOString()
      }
      if (body.status === 'closed' && !updates.closed_at) {
        updates.closed_at = new Date().toISOString()
      }
    }

    // Users can only update their own tickets and limited fields
    if (!isAdmin) {
      // Check if user owns the ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .select('created_by, organization_id')
        .eq('ticket_id', params.ticketId)
        .single()

      if (ticketError || !ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
      }

      if (ticket.organization_id !== profile.organization_id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Users can only update tags and close their own tickets
      if (body.tags) updates.tags = body.tags
      if (body.status === 'closed') {
        updates.status = 'closed'
        updates.closed_at = new Date().toISOString()
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
    }

    // Update ticket
    const { data: updatedTicket, error: updateError } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('ticket_id', params.ticketId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating ticket:', updateError)
      return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
    }

    return NextResponse.json({ 
      ticket: updatedTicket,
      message: 'Ticket updated successfully' 
    })

  } catch (error) {
    console.error('Error in update ticket API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 

export async function PUT(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get current user from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    
    // Create anon client for user authentication
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: { user }, error: authError } = await anonSupabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's organization and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role, is_superuser')
      .eq('profile_id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const isAdmin = profile.is_superuser === true

    // Only admins can update ticket status
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update ticket status
    const { data: ticket, error: updateError } = await supabase
      .from('support_tickets')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('ticket_id', params.ticketId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating ticket status:', updateError)
      return NextResponse.json({ error: 'Failed to update ticket status' }, { status: 500 })
    }

    return NextResponse.json({ 
      ticket,
      success: 'Status updated successfully' 
    })

  } catch (error) {
    console.error('Error in update ticket status API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
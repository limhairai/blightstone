import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(
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

    // Verify ticket exists and user has access
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('organization_id, status')
      .eq('ticket_id', params.ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const isAdmin = profile.is_superuser === true

    // Check permissions - users can only message their org's tickets, admins can message any
    if (!isAdmin && ticket.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Don't allow messages on closed tickets (except for admins)
    if (ticket.status === 'closed' && !isAdmin) {
      return NextResponse.json({ error: 'Cannot add messages to closed tickets' }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    const { content, isInternal = false, messageType = 'message', sentFromAdmin = false } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Validate message type
    const validMessageTypes = ['message', 'status_change', 'assignment', 'note']
    if (!validMessageTypes.includes(messageType)) {
      return NextResponse.json({ error: 'Invalid message type' }, { status: 400 })
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('support_ticket_messages')
      .insert({
        ticket_id: params.ticketId,
        sender_id: user.id,
        content: content.trim(),
        is_internal: isInternal,
        message_type: messageType,
        read_by_customer: !isAdmin, // Mark as read by customer if sent by customer
        read_by_admin: isAdmin, // Mark as read by admin if sent by admin
        metadata: {
          sent_from_admin: sentFromAdmin, // Store context about where message was sent from
          sent_from_admin_panel: sentFromAdmin
        }
      })
      .select(`
        *,
        sender:profiles!support_ticket_messages_sender_id_fkey(name, email, role, is_superuser)
      `)
      .single()

    if (messageError) {
      console.error('Error creating message:', messageError)
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
    }

    // If this is a customer message, update ticket status to indicate response needed
    if (!isAdmin && ticket.status === 'waiting_for_customer') {
      await supabase
        .from('support_tickets')
        .update({ status: 'open' })
        .eq('ticket_id', params.ticketId)
    }

    // If this is an admin message, update status to waiting for customer (if it was open)
    if (isAdmin && ticket.status === 'open') {
      await supabase
        .from('support_tickets')
        .update({ status: 'waiting_for_customer' })
        .eq('ticket_id', params.ticketId)
    }

    // Transform for frontend
    const transformedMessage = {
      id: message.message_id,
      message_id: message.message_id,
      ticketId: message.ticket_id,
      senderId: message.sender_id,
      content: message.content,
      isInternal: message.is_internal,
      messageType: message.message_type,
      createdAt: message.created_at,
      editedAt: message.edited_at,
      readByCustomer: message.read_by_customer,
      readByAdmin: message.read_by_admin,
      metadata: message.metadata || {},
      sender: {
        name: message.sender?.name || 'Unknown',
        email: message.sender?.email || '',
        role: message.sender?.is_superuser ? 'admin' : 'user'
      },
      senderType: message.metadata?.sent_from_admin ? 'admin' : 'user',
      attachments: []
    }

    return NextResponse.json({ 
      message: transformedMessage,
      success: 'Message sent successfully' 
    }, { status: 201 })

  } catch (error) {
    console.error('Error in create message API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 

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

    // Verify ticket exists and user has access
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('organization_id, status')
      .eq('ticket_id', params.ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const isAdmin = profile.is_superuser === true
    if (!isAdmin && ticket.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get messages for the ticket
    const { data: messages, error: messagesError } = await supabase
      .from('support_ticket_messages')
      .select(`
        message_id,
        ticket_id,
        sender_id,
        content,
        message_type,
        is_internal,
        created_at,
        edited_at,
        read_by_customer,
        read_by_admin,
        metadata,
        sender:profiles!support_ticket_messages_sender_id_fkey (
          profile_id,
          name,
          email,
          role,
          is_superuser
        )
      `)
      .eq('ticket_id', params.ticketId)
      .eq('is_internal', false) // Only show non-internal messages
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Transform messages for frontend
    const transformedMessages = messages.map((message: any) => ({
      id: message.message_id,
      message_id: message.message_id,
      ticketId: message.ticket_id,
      senderId: message.sender_id,
      content: message.content,
      isInternal: message.is_internal,
      messageType: message.message_type,
      createdAt: message.created_at,
      editedAt: message.edited_at,
      readByCustomer: message.read_by_customer,
      readByAdmin: message.read_by_admin,
      metadata: message.metadata || {},
      sender: {
        name: message.sender?.name || 'Unknown',
        email: message.sender?.email || '',
        role: message.sender?.is_superuser ? 'admin' : 'user'
      },
      senderName: message.sender?.name || 'Unknown',
      senderType: message.metadata?.sent_from_admin ? 'admin' : 'user', // Only use sent_from_admin metadata
      attachments: []
    }))

    return NextResponse.json({ 
      messages: transformedMessages,
      total: transformedMessages.length
    })

  } catch (error) {
    console.error('Error in get messages API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
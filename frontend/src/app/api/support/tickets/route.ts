import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
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

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role, is_superuser')
      .eq('profile_id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const requestedOrgId = url.searchParams.get('organization_id')
    const status = url.searchParams.get('status')
    const category = url.searchParams.get('category')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Determine which organization to query
    let organizationId: string
    
    if (requestedOrgId) {
      // Verify user has access to requested organization (ownership/membership)
      const { data: orgAccess, error: orgError } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('organization_id', requestedOrgId)
        .single()
      
      if (orgError || !orgAccess) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }
      
      // Check if user is owner
      if (orgAccess.owner_id === user.id) {
        organizationId = requestedOrgId
      } else {
        // Check if user is a member
        const { data: membership, error: membershipError } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', requestedOrgId)
          .eq('user_id', user.id)
          .single()
        
        if (membershipError || !membership) {
          return NextResponse.json({ error: 'Access denied to this organization' }, { status: 403 })
        }
        
        organizationId = requestedOrgId
      }
    } else {
      // Fallback to user's profile organization
      organizationId = profile.organization_id
    }

    const { data: tickets, error: ticketsError } = await supabase
      .rpc('get_tickets_with_metadata', { org_id: organizationId })

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    // Apply filters
    let filteredTickets = tickets || []
    
    if (status && status !== 'all') {
      filteredTickets = filteredTickets.filter((ticket: any) => ticket.status === status)
    }
    
    if (category && category !== 'all') {
      filteredTickets = filteredTickets.filter((ticket: any) => ticket.category === category)
    }

    // Apply pagination
    const paginatedTickets = filteredTickets.slice(offset, offset + limit)

    // Transform for frontend
    const transformedTickets = paginatedTickets.map((ticket: any) => ({
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
      affectedAssets: ticket.affected_assets || [], // New field with asset details
      tags: ticket.tags,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      messageCount: ticket.message_count,
      lastMessageAt: ticket.last_message_at,
      lastMessageContent: ticket.last_message_content,
      lastMessageSender: ticket.last_message_sender,
      unreadMessages: ticket.unread_messages,
      creator: {
        name: ticket.creator_name,
        email: ticket.creator_email
      },
      assignee: ticket.assignee_name ? {
        name: ticket.assignee_name,
        email: ticket.assignee_email
      } : null
    }))

    return NextResponse.json({
      tickets: transformedTickets,
      pagination: {
        total: filteredTickets.length,
        limit,
        offset,
        hasMore: offset + limit < filteredTickets.length
      }
    })

  } catch (error) {
    console.error('Error in tickets API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('profile_id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { subject, category, affectedAssetIds = [], initialMessage } = body

    // Validate required fields
    if (!subject || !category || !initialMessage) {
      return NextResponse.json({ 
        error: 'Missing required fields: subject, category, and initialMessage' 
      }, { status: 400 })
    }

    // Validate category
    const validCategories = [
      'ad_account_issue',
      'billing_question',
      'feature_request',
      'bug_report',
      'general_inquiry'
    ]
    
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Priority validation removed - we don't track priority

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        organization_id: profile.organization_id,
        created_by: user.id,
        subject,
        category,
        affected_asset_ids: affectedAssetIds,
        status: 'open'
      })
      .select()
      .single()

    if (ticketError) {
      console.error('Error creating ticket:', ticketError)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    // Create initial message
    const { data: message, error: messageError } = await supabase
      .from('support_ticket_messages')
      .insert({
        ticket_id: ticket.ticket_id,
        sender_id: user.id,
        content: initialMessage,
        message_type: 'message'
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error creating initial message:', messageError)
      return NextResponse.json({ error: 'Failed to create initial message' }, { status: 500 })
    }

    // Get the created ticket with metadata
    const { data: ticketWithMetadata, error: metadataError } = await supabase
      .rpc('get_tickets_with_metadata', { org_id: profile.organization_id })

    if (metadataError) {
      console.error('Error fetching ticket metadata:', metadataError)
      return NextResponse.json({ error: 'Failed to fetch ticket metadata' }, { status: 500 })
    }

    const createdTicket = ticketWithMetadata.find((t: any) => t.ticket_id === ticket.ticket_id)

    if (!createdTicket) {
      return NextResponse.json({ error: 'Failed to fetch created ticket' }, { status: 500 })
    }

    // Transform for frontend
    const transformedTicket = {
      id: createdTicket.ticket_id,
      ticket_id: createdTicket.ticket_id,
      ticketNumber: createdTicket.ticket_number,
      organizationId: createdTicket.organization_id,
      createdBy: createdTicket.created_by,
      assignedTo: createdTicket.assigned_to,
      subject: createdTicket.subject,
      category: createdTicket.category,
      
      status: createdTicket.status,
      affectedAssetIds: createdTicket.affected_asset_ids,
      affectedAssets: createdTicket.affected_assets || [], // New field with asset details
      tags: createdTicket.tags,
      createdAt: createdTicket.created_at,
      updatedAt: createdTicket.updated_at,
      messageCount: createdTicket.message_count,
      lastMessageAt: createdTicket.last_message_at,
      lastMessageContent: createdTicket.last_message_content,
      lastMessageSender: createdTicket.last_message_sender,
      unreadMessages: createdTicket.unread_messages,
      creatorName: createdTicket.creator_name,
      creatorEmail: createdTicket.creator_email,
      assigneeName: createdTicket.assignee_name
    }

    return NextResponse.json({ 
      ticket: transformedTicket,
      message: 'Ticket created successfully' 
    }, { status: 201 })

  } catch (error) {
    console.error('Error in create ticket API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
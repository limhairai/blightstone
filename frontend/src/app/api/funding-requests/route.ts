import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Create new funding request (simple top-up request)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      account_id,
      account_name,
      requested_amount,
      notes,
      organization_id
    } = body
    
    // Validate required fields
    if (!account_id || !account_name || !requested_amount || !organization_id) {
      return NextResponse.json(
        { error: 'Missing required fields (account_id, account_name, requested_amount, organization_id)' },
        { status: 400 }
      )
    }
    
    // Validate amount
    if (requested_amount < 10 || requested_amount > 100000) {
      return NextResponse.json(
        { error: 'Amount must be between $10 and $100,000' },
        { status: 400 }
      )
    }
    
    // Create simple funding request
    const { data: newFundingRequest, error } = await supabase
      .from('funding_requests')
      .insert([{
        account_id,
        account_name,
        requested_amount,
        notes: notes || '',
        organization_id,
        status: 'pending'
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to create funding request' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      request_id: newFundingRequest.id,
      message: 'Top-up request submitted successfully. Admin will process it manually.'
    })
  } catch (error) {
    console.error('Error creating funding request:', error)
    return NextResponse.json(
      { error: 'Failed to create funding request' },
      { status: 500 }
    )
  }
}

// GET - Retrieve funding requests (for admin or user)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const status = searchParams.get('status')
    
    // Build simple query without problematic joins
    let query = supabase
      .from('funding_requests')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Filter by organization if provided
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }
    
    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data: requests, error } = await query
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch funding requests' },
        { status: 500 }
      )
    }

    // Get organization names separately
    const orgIds = [...new Set((requests || []).map(req => req.organization_id).filter(Boolean))]
    let organizations: any[] = []
    
    if (orgIds.length > 0) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds)
      organizations = orgs || []
    }
    
    const orgMap = new Map(organizations.map(org => [org.id, org]))
    
    // Transform the data to include organization info
    const transformedRequests = (requests || []).map(req => ({
      id: req.id,
      account_id: req.account_id,
      account_name: req.account_name,
      amount: req.requested_amount,
      status: req.status,
      notes: req.notes,
      admin_notes: req.admin_notes,
      created_at: req.created_at,
      organization: orgMap.get(req.organization_id) || { name: 'Unknown Organization' },
      business: { name: 'N/A' } // Not needed for simple funding requests
    }))
    
    return NextResponse.json({
      requests: transformedRequests,
      total: transformedRequests.length
    })
  } catch (error) {
    console.error('Error fetching funding requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch funding requests' },
      { status: 500 }
    )
  }
}

// PUT - Update funding request (for admin approval/rejection)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, admin_notes } = body
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields (id, status)' },
        { status: 400 }
      )
    }
    
    // Simple update - just change status and add admin notes
    const updateData = {
      status,
      admin_notes: admin_notes || `Status changed to ${status}`,
      updated_at: new Date().toISOString()
    }
    
    // Update the funding request in the database
    const { data: fundingRequest, error } = await supabase
      .from('funding_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to update funding request' },
        { status: 500 }
      )
    }
    
    if (!fundingRequest) {
      return NextResponse.json(
        { error: 'Funding request not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: `Funding request ${status} successfully`,
      request: fundingRequest
    })
  } catch (error) {
    console.error('Error updating funding request:', error)
    return NextResponse.json(
      { error: 'Failed to update funding request' },
      { status: 500 }
    )
  }
} 
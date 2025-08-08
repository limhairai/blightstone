import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('page_requests')
      .select(`
        *,
        organizations!inner(name)
      `)
      .order('created_at', { ascending: false })

    // If organization_id is provided, filter by it (and verify access)
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data: pageRequests, error } = await query

    if (error) {
      console.error('Error fetching page requests:', error)
      return NextResponse.json({ error: 'Failed to fetch page requests' }, { status: 500 })
    }

    return NextResponse.json({ pageRequests })
  } catch (error) {
    console.error('Error in page requests API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const body = await request.json()

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      organization_id, 
      page_name, 
      page_category, 
      page_description,
      business_manager_id 
    } = body

    if (!organization_id || !page_name) {
      return NextResponse.json({ 
        error: 'Organization ID and page name are required' 
      }, { status: 400 })
    }

    // Create page request
    const { data: pageRequest, error } = await supabase
      .from('page_requests')
      .insert({
        organization_id,
        page_name: page_name.trim(),
        page_category: page_category?.trim() || null,
        page_description: page_description?.trim() || null,
        business_manager_id: business_manager_id || null,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating page request:', error)
      return NextResponse.json({ error: 'Failed to create page request' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      pageRequest,
      message: 'Page request submitted successfully' 
    })
  } catch (error) {
    console.error('Error in page requests POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const body = await request.json()

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { request_id, status, admin_notes, processed_by } = body

    if (!request_id || !status) {
      return NextResponse.json({ 
        error: 'Request ID and status are required' 
      }, { status: 400 })
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (admin_notes) {
      updateData.admin_notes = admin_notes
    }

    if (processed_by) {
      updateData.processed_by = processed_by
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data: pageRequest, error } = await supabase
      .from('page_requests')
      .update(updateData)
      .eq('request_id', request_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating page request:', error)
      return NextResponse.json({ error: 'Failed to update page request' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      pageRequest,
      message: 'Page request updated successfully' 
    })
  } catch (error) {
    console.error('Error in page requests PATCH API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('request_id')

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!requestId) {
      return NextResponse.json({ 
        error: 'Request ID is required' 
      }, { status: 400 })
    }

    // First check if the request exists and belongs to user's organization
    const { data: existingRequest, error: fetchError } = await supabase
      .from('page_requests')
      .select('request_id, organization_id, status')
      .eq('request_id', requestId)
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: 'Page request not found' }, { status: 404 })
    }

    // Only allow canceling pending requests
    if (existingRequest.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Only pending requests can be cancelled' 
      }, { status: 400 })
    }

    // Delete the request
    const { error: deleteError } = await supabase
      .from('page_requests')
      .delete()
      .eq('request_id', requestId)

    if (deleteError) {
      console.error('Error deleting page request:', deleteError)
      return NextResponse.json({ error: 'Failed to cancel page request' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Page request cancelled successfully' 
    })
  } catch (error) {
    console.error('Error in page requests DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
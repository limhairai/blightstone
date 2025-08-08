import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    
    let query = supabase
      .from('page_requests')
      .select(`
        *,
        organizations!inner(name)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`page_name.ilike.%${search}%,organizations.name.ilike.%${search}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: pageRequests, error, count } = await query

    if (error) {
      console.error('Error fetching page requests:', error)
      return NextResponse.json({ error: 'Failed to fetch page requests' }, { status: 500 })
    }

    return NextResponse.json({ 
      pageRequests: pageRequests || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in admin page requests API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
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
      updateData.processed_at = new Date().toISOString()
    }

    const { data: pageRequest, error } = await supabase
      .from('page_requests')
      .update(updateData)
      .eq('request_id', request_id)
      .select(`
        *,
        organizations!inner(name)
      `)
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
    console.error('Error in admin page requests PATCH API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')
    
    // Build the query
    let query = supabase
      .from('application')
      .select(`
        id,
        organization_id,
        request_type,
        target_bm_dolphin_id,
        website_url,
        status,
        approved_by,
        approved_at,
        rejected_by,
        rejected_at,
        fulfilled_by,
        fulfilled_at,
        client_notes,
        admin_notes,
        created_at,
        updated_at,
        organizations!inner(name)
      `)
    
    // Add status filter if provided
    if (statusParam) {
      const statuses = statusParam.split(',').map(s => s.trim())
      query = query.in('status', statuses)
    }
    
    // Execute query
    const { data: applications, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    // Transform to match frontend expectations
    const transformedApplications = applications?.map(app => ({
      id: app.id,
      organization_id: app.organization_id,
      organization_name: app.organizations?.name || 'Unknown Organization',
      business_name: app.organizations?.name || 'Unknown Organization', // Alias for compatibility
      request_type: app.request_type,
      target_bm_dolphin_id: app.target_bm_dolphin_id,
      website_url: app.website_url,
      status: app.status,
      approved_by: app.approved_by,
      approved_at: app.approved_at,
      rejected_by: app.rejected_by,
      rejected_at: app.rejected_at,
      fulfilled_by: app.fulfilled_by,
      fulfilled_at: app.fulfilled_at,
      client_notes: app.client_notes,
      admin_notes: app.admin_notes,
      created_at: app.created_at,
      updated_at: app.updated_at
    })) || []

    return NextResponse.json({
      applications: transformedApplications
    })

  } catch (error) {
    console.error('Error in applications API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      organization_id, 
      request_type, 
      target_bm_dolphin_id, 
      website_url, 
      client_notes 
    } = body

    // Validate required fields
    if (!organization_id || !request_type || !website_url) {
      return NextResponse.json(
        { error: 'Missing required fields: organization_id, request_type, website_url' },
        { status: 400 }
      )
    }

    // Validate request_type
    if (!['new_business_manager', 'additional_accounts'].includes(request_type)) {
      return NextResponse.json(
        { error: 'Invalid request_type. Must be new_business_manager or additional_accounts' },
        { status: 400 }
      )
    }

    // For additional_accounts, target_bm_dolphin_id is required
    if (request_type === 'additional_accounts' && !target_bm_dolphin_id) {
      return NextResponse.json(
        { error: 'target_bm_dolphin_id is required for additional_accounts requests' },
        { status: 400 }
      )
    }

    // Create the application
    const { data: application, error } = await supabase
      .from('application')
      .insert({
        organization_id,
        request_type,
        target_bm_dolphin_id,
        website_url,
        client_notes,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating application:', error)
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      application: {
        id: application.id,
        organization_id: application.organization_id,
        request_type: application.request_type,
        target_bm_dolphin_id: application.target_bm_dolphin_id,
        website_url: application.website_url,
        status: application.status,
        client_notes: application.client_notes,
        created_at: application.created_at
      }
    })

  } catch (error) {
    console.error('Error creating application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
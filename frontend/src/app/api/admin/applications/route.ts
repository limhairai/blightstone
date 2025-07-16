import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Transform database snake_case to API camelCase (standard SaaS convention)
const transformApplicationToFrontend = (app: any) => ({
  applicationId: app.application_id,
  organizationId: app.organization_id,
  organizationName: app.organizations?.name || 'Unknown Organization',
  businessName: app.organizations?.name || 'Unknown Organization', // Alias for compatibility
  requestType: app.request_type,
  targetBmDolphinId: app.target_bm_dolphin_id,
  websiteUrl: app.website_url,
  domains: app.domains || [],
  status: app.status,
  approvedBy: app.approved_by,
  approvedAt: app.approved_at,
  rejectedBy: app.rejected_by,
  rejectedAt: app.rejected_at,
  fulfilledBy: app.fulfilled_by,
  fulfilledAt: app.fulfilled_at,
  clientNotes: app.client_notes,
  
  createdAt: app.created_at,
  updatedAt: app.updated_at
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')
    
    // Build the query using semantic ID columns
    let query = supabase
      .from('application')
      .select(`
        application_id,
        organization_id,
        request_type,
        target_bm_dolphin_id,
        website_url,
        domains,
        status,
        approved_by,
        approved_at,
        rejected_by,
        rejected_at,
        fulfilled_by,
        fulfilled_at,
        client_notes,

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

    // Transform to match frontend expectations (camelCase)
    const transformedApplications = applications?.map(transformApplicationToFrontend) || []

    const response = NextResponse.json({
      applications: transformedApplications
    });
    
    // **PERFORMANCE**: Add caching headers
    response.headers.set('Cache-Control', 'private, max-age=10, s-maxage=10'); // Reduced to 10 seconds for immediate responsiveness after fulfill operations
    response.headers.set('Vary', 'Authorization');
    
    return response;

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
      organizationId, 
      requestType, 
      targetBmDolphinId, 
      websiteUrl, 
      clientNotes 
    } = body

    // Validate required fields
    if (!organizationId || !requestType || !websiteUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, requestType, websiteUrl' },
        { status: 400 }
      )
    }

    // Validate request_type
    if (!['new_business_manager', 'additional_accounts'].includes(requestType)) {
      return NextResponse.json(
        { error: 'Invalid requestType. Must be new_business_manager or additional_accounts' },
        { status: 400 }
      )
    }

    // For additional_accounts, targetBmDolphinId is required
    if (requestType === 'additional_accounts' && !targetBmDolphinId) {
      return NextResponse.json(
        { error: 'targetBmDolphinId is required for additional_accounts requests' },
        { status: 400 }
      )
    }

    // Create the application using semantic ID columns
    const { data: application, error } = await supabase
      .from('application')
      .insert({
        organization_id: organizationId,
        request_type: requestType,
        target_bm_dolphin_id: targetBmDolphinId,
        website_url: websiteUrl,
        client_notes: clientNotes,
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

    // Transform response to frontend format
    return NextResponse.json({
      application: transformApplicationToFrontend(application)
    })

  } catch (error) {
    console.error('Error creating application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
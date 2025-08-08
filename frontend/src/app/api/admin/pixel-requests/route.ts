import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const transformPixelRequestToFrontend = (req: any) => ({
  application_id: req.application_id,
  organization_id: req.organization_id,
  pixel_name: req.pixel_name,
  pixel_id: req.pixel_id,
  target_bm_dolphin_id: req.target_bm_dolphin_id,
  status: req.status,
  admin_notes: req.admin_notes,
  client_notes: req.client_notes,
  created_at: req.created_at,
  updated_at: req.updated_at,
  organizations: {
    name: req.organizations?.name || 'Unknown Organization'
  }
})

export async function GET(request: NextRequest) {
  try {
    const { data: pixelRequests, error } = await supabase
      .from('application')
      .select(`
        application_id,
        organization_id,
        pixel_name,
        pixel_id,
        target_bm_dolphin_id,
        status,
        admin_notes,
        client_notes,
        created_at,
        updated_at,
        organizations!inner(name)
      `)
      .eq('request_type', 'pixel_connection')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pixel requests:', error)
      return NextResponse.json({ error: 'Failed to fetch pixel requests' }, { status: 500 })
    }

    return NextResponse.json({ 
      pixelRequests: (pixelRequests || []).map(transformPixelRequestToFrontend) 
    })
  } catch (error) {
    console.error('Error in admin pixel requests API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { application_id, status, admin_notes } = body

    if (!application_id || !status) {
      return NextResponse.json({
        error: 'Application ID and status are required'
      }, { status: 400 })
    }

    const updateData: any = {
      status,
      admin_notes: admin_notes || null,
      updated_at: new Date().toISOString()
    }

    const { data: pixelRequest, error } = await supabase
      .from('application')
      .update(updateData)
      .eq('application_id', application_id)
      .eq('request_type', 'pixel_connection')
      .select(`
        application_id,
        organization_id,
        pixel_name,
        pixel_id,
        target_bm_dolphin_id,
        status,
        admin_notes,
        client_notes,
        created_at,
        updated_at,
        organizations!inner(name)
      `)
      .single()

    if (error) {
      console.error('Error updating pixel request:', error)
      return NextResponse.json({ error: 'Failed to update pixel request' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      pixelRequest: transformPixelRequestToFrontend(pixelRequest),
      message: 'Pixel request updated successfully'
    })
  } catch (error) {
    console.error('Error in admin pixel requests PATCH API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
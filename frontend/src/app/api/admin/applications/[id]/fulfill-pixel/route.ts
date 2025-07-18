import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params.id
    const { admin_user_id } = await request.json()

    if (!admin_user_id) {
      return NextResponse.json({ error: 'Admin user ID is required' }, { status: 400 })
    }

    // Get the application details
    const { data: application, error: appError } = await supabase
      .from('application')
      .select('*')
      .eq('application_id', applicationId)
      .eq('request_type', 'pixel_connection')
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: 'Pixel connection application not found' }, { status: 404 })
    }

    if (application.status !== 'processing') {
      return NextResponse.json({ error: 'Application must be in processing status to fulfill' }, { status: 400 })
    }

    // Create or update pixel asset
    const { data: pixelAsset, error: assetError } = await supabase
      .from('asset')
      .upsert({
        type: 'pixel',
        dolphin_id: application.pixel_id,
        name: application.pixel_name || `Pixel ${application.pixel_id}`,
        status: 'active',
        metadata: {
          business_manager_id: application.target_bm_dolphin_id,
          connected_at: new Date().toISOString(),
          application_id: applicationId
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'type,dolphin_id'
      })
      .select()
      .single()

    if (assetError) {
      console.error('Error creating pixel asset:', assetError)
      return NextResponse.json({ error: 'Failed to create pixel asset' }, { status: 500 })
    }

    // Check if asset binding already exists
    const { data: existingBinding } = await supabase
      .from('asset_binding')
      .select('binding_id')
      .eq('asset_id', pixelAsset.asset_id)
      .eq('organization_id', application.organization_id)
      .single()

    if (!existingBinding) {
      // Create asset binding only if it doesn't exist
      const { error: bindingError } = await supabase
        .from('asset_binding')
        .insert({
          asset_id: pixelAsset.asset_id,
          organization_id: application.organization_id,
          status: 'active',
          is_active: true,
          bound_by: admin_user_id,
          bound_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (bindingError) {
        console.error('Error creating asset binding:', bindingError)
        return NextResponse.json({ error: 'Failed to bind pixel asset' }, { status: 500 })
      }
    } else {
      // Update existing binding to active
      const { error: updateError } = await supabase
        .from('asset_binding')
        .update({
          status: 'active',
          is_active: true,
          bound_by: admin_user_id,
          bound_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('binding_id', existingBinding.binding_id)

      if (updateError) {
        console.error('Error updating asset binding:', updateError)
        return NextResponse.json({ error: 'Failed to update pixel asset binding' }, { status: 500 })
      }
    }

    // Create fulfillment record
    const { error: fulfillmentError } = await supabase
      .from('application_fulfillment')
      .insert({
        application_id: applicationId,
        asset_id: pixelAsset.asset_id,
        created_at: new Date().toISOString()
      })

    if (fulfillmentError) {
      console.error('Error creating fulfillment record:', fulfillmentError)
      // Don't fail the request for this - it's just for tracking
    }

    // Mark application as fulfilled
    const { error: updateError } = await supabase
      .from('application')
      .update({
        status: 'fulfilled',
        fulfilled_by: admin_user_id,
        fulfilled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId)

    if (updateError) {
      console.error('Error updating application status:', updateError)
      return NextResponse.json({ error: 'Failed to update application status' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Pixel connection fulfilled successfully',
      pixel_asset: pixelAsset
    })

  } catch (error) {
    console.error('Error fulfilling pixel connection:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
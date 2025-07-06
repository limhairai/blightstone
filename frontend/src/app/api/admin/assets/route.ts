import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Field mapping utility for transforming between database and frontend formats
const transformAssetToFrontend = (asset: any, bindingInfo?: any) => ({
  assetId: asset.asset_id,
  id: asset.asset_id, // For backward compatibility
  name: asset.name,
  type: asset.type,
  dolphinId: asset.dolphin_id,
  status: asset.status,
  metadata: asset.metadata,
  lastSyncedAt: asset.last_synced_at,
  createdAt: asset.created_at,
  updatedAt: asset.updated_at,
  organizationId: bindingInfo?.organization_id || null,
  organizationName: bindingInfo?.organization_name || null,
  boundAt: bindingInfo?.bound_at || null
})

export async function GET(request: NextRequest) {
  try {
    // Note: Using service role key for admin operations
    // In production, you should verify admin access via session

    // Fetch assets with organization information
    const { data: assets, error } = await supabase
      .from('asset_binding')
      .select(`
        binding_id,
        asset_id,
        organization_id,
        status,
        asset:asset_id (
          asset_id,
          name,
          type,
          dolphin_id,
          status,
          metadata
        ),
        organization:organization_id (
          organization_id,
          name
        )
      `)
      .eq('status', 'active')
      .in('asset.type', ['business_manager', 'ad_account'])

    if (error) {
      console.error('Error fetching assets:', error)
      return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
    }

    // Transform the data for the global search
    const transformedAssets = assets?.map((binding: any) => {
      const asset = binding.asset
      const organization = binding.organization
      
      return {
        asset_id: asset.asset_id,
        binding_id: binding.binding_id,
        name: asset.name,
        type: asset.type,
        dolphin_id: asset.dolphin_id,
        status: asset.status,
        metadata: asset.metadata,
        organization_id: organization.organization_id,
        organization_name: organization.name,
        // Add computed fields for search
        ad_accounts_count: asset.type === 'business_manager' ? 
          (asset.metadata?.ad_accounts_count || 0) : undefined
      }
    }) || []

    return NextResponse.json({ 
      assets: transformedAssets,
      count: transformedAssets.length
    })

  } catch (error) {
    console.error('Admin assets API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, dolphinId, name, status = 'active', metadata } = body

    // Validate required fields
    if (!type || !dolphinId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: type, dolphinId, name' },
        { status: 400 }
      )
    }

    // Validate asset type
    if (!['business_manager', 'ad_account', 'profile'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be business_manager, ad_account, or profile' },
        { status: 400 }
      )
    }

    // Create the asset using semantic ID columns
    const { data: asset, error } = await supabase
      .from('asset')
      .insert({
        type,
        dolphin_id: dolphinId,
        name,
        status,
        metadata,
        last_synced_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating asset:', error)
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Asset with this dolphinId already exists for this type' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create asset' },
        { status: 500 }
      )
    }

    // Transform response to frontend format
    return NextResponse.json({
      asset: transformAssetToFrontend(asset)
    })

  } catch (error) {
    console.error('Error creating asset:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
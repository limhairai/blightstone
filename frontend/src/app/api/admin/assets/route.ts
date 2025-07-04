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
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const unbound_only = searchParams.get('unbound_only') === 'true'

    // Get all assets using semantic ID columns
    let query = supabase.from('asset').select('*').order('created_at', { ascending: false })
    
    if (type) {
      query = query.eq('type', type)
    }

    const { data: assets, error: assetsError } = await query

    if (assetsError) {
      console.error('Error fetching assets:', assetsError)
      return NextResponse.json(
        { error: 'Failed to fetch assets' },
        { status: 500 }
      )
    }

    // Get all active bindings using semantic ID columns
    const { data: bindings, error: bindingsError } = await supabase
      .from('asset_binding')
      .select(`
        asset_id,
        organization_id,
        status,
        bound_at,
        organizations!inner(name)
      `)
      .eq('status', 'active')

    if (bindingsError) {
      console.error('Error fetching bindings:', bindingsError)
      return NextResponse.json(
        { error: 'Failed to fetch bindings' },
        { status: 500 }
      )
    }

    // Create binding map using semantic ID
    const bindingMap = new Map()
    bindings?.forEach(binding => {
      bindingMap.set(binding.asset_id, {
        organization_id: binding.organization_id,
        organization_name: binding.organizations?.name || 'Unknown Organization',
        bound_at: binding.bound_at
      })
    })

    // Process assets with binding information
    const processedAssets = assets?.map(asset => {
      const bindingInfo = bindingMap.get(asset.asset_id)
      return transformAssetToFrontend(asset, bindingInfo)
    }).filter(asset => {
      // Apply unbound_only filter if requested
      if (unbound_only) {
        return !asset.organizationId
      }
      return true
    }) || []

    return NextResponse.json({
      assets: processedAssets
    })

  } catch (error) {
    console.error('Error in assets API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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
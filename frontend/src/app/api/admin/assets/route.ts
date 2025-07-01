import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const unbound_only = searchParams.get('unbound_only') === 'true'

    // Get all assets
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

    // Get all active bindings
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

    // Create binding map
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
      const bindingInfo = bindingMap.get(asset.id)
      
      return {
        asset_id: asset.id, // Frontend compatibility
        id: asset.id,
        name: asset.name,
        type: asset.type,
        dolphin_id: asset.dolphin_id,
        status: asset.status,
        metadata: asset.metadata,
        last_synced_at: asset.last_synced_at,
        created_at: asset.created_at,
        updated_at: asset.updated_at,
        organization_id: bindingInfo?.organization_id || null,
        organization_name: bindingInfo?.organization_name || null,
        bound_at: bindingInfo?.bound_at || null
      }
    }).filter(asset => {
      // Apply unbound_only filter if requested
      if (unbound_only) {
        return !asset.organization_id
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
    const { type, dolphin_id, name, status = 'active', metadata } = body

    // Validate required fields
    if (!type || !dolphin_id || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: type, dolphin_id, name' },
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

    // Create the asset
    const { data: asset, error } = await supabase
      .from('asset')
      .insert({
        type,
        dolphin_id,
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
          { error: 'Asset with this dolphin_id already exists for this type' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create asset' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      asset: {
        id: asset.id,
        type: asset.type,
        dolphin_id: asset.dolphin_id,
        name: asset.name,
        status: asset.status,
        metadata: asset.metadata,
        last_synced_at: asset.last_synced_at,
        created_at: asset.created_at
      }
    })

  } catch (error) {
    console.error('Error creating asset:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: organizationId } = params
    const { searchParams } = new URL(request.url)
    const asset_type = searchParams.get('asset_type')

    // Use the clean database function
    const { data: assets, error } = await supabase
      .rpc('get_organization_assets', {
        p_organization_id: organizationId,
        p_asset_type: asset_type
      })

    if (error) {
      console.error('Error fetching organization assets:', error)
      return NextResponse.json(
        { error: 'Failed to fetch organization assets' },
        { status: 500 }
      )
    }

    // Transform to match frontend expectations and group by type
    const transformedAssets = assets?.map(asset => ({
      id: asset.id,
      type: asset.type,
      dolphin_id: asset.dolphin_id,
      name: asset.name,
      status: asset.status,
      metadata: asset.metadata,
      bound_at: asset.bound_at,
      binding_id: asset.binding_id,
      last_synced_at: asset.last_synced_at
    })) || []

    // Group assets by type for easier frontend consumption
    const groupedAssets = {
      business_managers: transformedAssets.filter(a => a.type === 'business_manager'),
      ad_accounts: transformedAssets.filter(a => a.type === 'ad_account'),
      profiles: transformedAssets.filter(a => a.type === 'profile')
    }

    return NextResponse.json({
      assets: transformedAssets,
      grouped_assets: groupedAssets,
      counts: {
        business_managers: groupedAssets.business_managers.length,
        ad_accounts: groupedAssets.ad_accounts.length,
        profiles: groupedAssets.profiles.length,
        total: transformedAssets.length
      }
    })

  } catch (error) {
    console.error('Error in organization assets API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
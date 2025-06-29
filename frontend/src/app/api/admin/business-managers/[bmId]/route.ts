import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch individual business manager with ad accounts
export async function GET(
  request: NextRequest,
  { params }: { params: { bmId: string } }
) {
  const { bmId } = params

  if (!bmId) {
    return NextResponse.json({ error: 'Business Manager ID is required' }, { status: 400 })
  }

  try {
    // First get the business manager details from business_managers table
    const { data: bmData, error: bmError } = await supabase
      .from('business_managers')
      .select('*')
      .eq('bm_id', bmId)
      .single()

    if (bmError) {
      if (bmError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Business Manager not found' }, { status: 404 })
      }
      throw bmError
    }

    // Get the dolphin asset name for this business manager
    const { data: assetData, error: assetError } = await supabase
      .from('dolphin_assets')
      .select('name')
      .eq('dolphin_asset_id', bmData.dolphin_business_manager_id)
      .eq('asset_type', 'business_manager')
      .single()

    // Get associated ad accounts for this business manager using the correct binding approach
    const { data: adAccounts, error: adAccountsError } = await supabase
      .from('client_asset_bindings')
      .select(`
        *,
        dolphin_assets!inner(
          asset_id,
          name,
          status,
          asset_metadata
        )
      `)
      .eq('bm_id', bmId)
      .eq('status', 'active')
      .eq('dolphin_assets.asset_type', 'ad_account')

    if (adAccountsError) {
      console.error('Error fetching ad accounts:', adAccountsError)
      // Don't throw, just log - we can still return BM details without accounts
    }

    // Format business manager data
    const businessManager = {
      id: bmData.bm_id,
      name: assetData?.name || `Business Manager #${bmData.dolphin_business_manager_id.substring(0, 8)}`,
      dolphin_business_manager_id: bmData.dolphin_business_manager_id,
      status: bmData.status,
      organization_id: bmData.organization_id,
      ad_account_count: adAccounts?.length || 0,
      created_at: bmData.created_at,
    }

    // Format ad accounts data from the new structure
    const formattedAdAccounts = adAccounts ? adAccounts.map(binding => {
      const asset = binding.dolphin_assets;
      const metadata = asset.asset_metadata || {};
      
      return {
        id: asset.asset_id,
        name: asset.name,
        ad_account_id: metadata.ad_account_id || asset.asset_id,
        status: asset.status,
        balance_cents: Math.round(((metadata.spend_cap || 0) - (metadata.amount_spent || 0)) * 100),
        spend_cents: Math.round((metadata.amount_spent || 0) * 100), // Total lifetime spend
        timezone: metadata.timezone_id || 'UTC',
        created_at: binding.bound_at,
        last_activity: asset.last_sync_at,
      };
    }) : []

    return NextResponse.json({
      businessManager,
      adAccounts: formattedAdAccounts,
    })
  } catch (error: any) {
    console.error('Error fetching business manager details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business manager details', details: error.message },
      { status: 500 }
    )
  }
} 
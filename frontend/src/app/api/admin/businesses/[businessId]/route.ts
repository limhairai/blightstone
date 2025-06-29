import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  const { businessId } = params

  if (!businessId) {
    return NextResponse.json({ error: 'Business ID is required' }, { status: 400 })
  }

  try {
    // Fetch business manager details using the correct table and column
    const { data: businessManager, error: bmError } = await supabase
      .from('business_managers')
      .select('*')
      .eq('bm_id', businessId)
      .single()

    if (bmError) {
      if (bmError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Business Manager not found' }, { status: 404 })
      }
      throw bmError
    }

    // Fetch associated ad accounts using the new Dolphin assets structure
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
      .eq('bm_id', businessId)
      .eq('status', 'active')
      .eq('dolphin_assets.asset_type', 'ad_account')

    if (adAccountsError) {
      console.error('Error fetching ad accounts:', adAccountsError)
      // Don't throw, just log - we can still return BM details without accounts
    }

    // Format the response to match expected structure
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
      business: {
        id: businessManager.bm_id,
        name: `Business Manager #${businessManager.dolphin_business_manager_id.substring(0, 8)}`,
        dolphin_business_manager_id: businessManager.dolphin_business_manager_id,
        status: businessManager.status,
        organization_id: businessManager.organization_id,
        created_at: businessManager.created_at,
      },
      adAccounts: formattedAdAccounts,
    })
  } catch (error: any) {
    console.error('Error fetching business details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business details', details: error.message },
      { status: 500 }
    )
  }
} 
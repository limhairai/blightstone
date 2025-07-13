import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Note: Using service role key for admin operations
    // Admin authentication is handled by the admin layout/middleware

    // Fetch all ad accounts with pixel data and their business managers
    const { data: adAccounts, error: adAccountsError } = await supabase
      .from('asset')
      .select(`
        asset_id,
        name,
        dolphin_id,
        metadata,
        status,
        asset_binding!inner(
          organization_id,
          status
        )
      `)
      .eq('type', 'ad_account')
      .eq('asset_binding.status', 'active')

    if (adAccountsError) {
      console.error('Error fetching ad accounts:', adAccountsError)
      return NextResponse.json({ error: 'Failed to fetch ad accounts' }, { status: 500 })
    }

    // Fetch business managers for BM information
    const { data: businessManagers, error: bmError } = await supabase
      .from('asset')
      .select(`
        asset_id,
        name,
        dolphin_id,
        metadata,
        asset_binding!inner(
          organization_id,
          status
        )
      `)
      .eq('type', 'business_manager')
      .eq('asset_binding.status', 'active')

    if (bmError) {
      console.error('Error fetching business managers:', bmError)
      return NextResponse.json({ error: 'Failed to fetch business managers' }, { status: 500 })
    }

    // Create BM lookup map
    const bmMap = new Map()
    businessManagers.forEach(bm => {
      bmMap.set(bm.dolphin_id, {
        id: bm.asset_id,
        name: bm.name,
        dolphin_id: bm.dolphin_id,
        organizationId: bm.asset_binding[0]?.organization_id
      })
    })

    // Fetch organization names for display
    const organizationIds = [...new Set(adAccounts.map(account => account.asset_binding[0]?.organization_id).filter(Boolean))]
    
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('organization_id, name')
      .in('organization_id', organizationIds)

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError)
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
    }

    const orgMap = new Map(organizations.map(org => [org.organization_id, org.name]))

    // Process ad accounts to extract pixel data and group by pixel
    const pixelMap = new Map()

    adAccounts.forEach(account => {
      const pixelId = account.metadata?.pixel_id
      if (!pixelId) return

      const organizationId = account.asset_binding[0]?.organization_id
      const organizationName = orgMap.get(organizationId) || organizationId
      
      // Get BM information from the account's metadata
      const bmId = account.metadata?.business_manager_id
      const bmInfo = bmId ? bmMap.get(bmId) : null

      if (!pixelMap.has(pixelId)) {
        pixelMap.set(pixelId, {
          pixelId,
          pixelName: account.metadata?.pixel_name || `Pixel ${pixelId}`,
          organizationId,
          organizationName,
          businessManagerId: bmId,
          businessManagerName: bmInfo?.name || account.metadata?.business_manager_name || 'Unknown BM',
          adAccounts: [],
          status: 'active' // Default status
        })
      }

      const pixel = pixelMap.get(pixelId)
      pixel.adAccounts.push({
        id: account.asset_id,
        name: account.name,
        dolphin_id: account.dolphin_id,
        status: account.status
      })

      // Note: Removed lastSeen tracking as it's not reliable or useful
    })

    // Convert map to array and sort by pixel ID
    const pixels = Array.from(pixelMap.values()).sort((a, b) => 
      a.pixelId.localeCompare(b.pixelId)
    )

    return NextResponse.json({
      pixels,
      total: pixels.length,
      organizationsWithPixels: organizationIds.length
    })

  } catch (error) {
    console.error('Error in admin pixels API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
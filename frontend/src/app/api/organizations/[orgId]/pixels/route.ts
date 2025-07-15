import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get current user from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    
    // Create anon client for user authentication
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: { user }, error: userError } = await anonSupabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get organization data with plan information using service role
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select(`
        organization_id,
        name,
        plan_id
      `)
      .eq('organization_id', params.orgId)
      .single()

    if (orgError) {
      console.error('Error fetching organization:', orgError)
      return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
    }

    // Get plan data to fetch max_pixels
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('max_pixels')
      .eq('plan_id', orgData.plan_id)
      .single()

    let subscriptionLimit = 0
    if (!planError && planData) {
      subscriptionLimit = planData.max_pixels || 0
      // Keep -1 for unlimited pixels so frontend can handle it properly
    } else {
      // If no plan found, default to 0 (no pixels allowed)
      subscriptionLimit = 0
    }

    // Fetch ad accounts with pixel data for this organization (same approach as admin panel)
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
          status,
          is_active
        )
      `)
      .eq('type', 'ad_account')
      .eq('asset_binding.organization_id', params.orgId)
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
          status,
          is_active
        )
      `)
      .eq('type', 'business_manager')
      .eq('asset_binding.organization_id', params.orgId)
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
        dolphin_id: bm.dolphin_id
      })
    })

    // Process ad accounts to extract pixel data and group by pixel (same as admin panel)
    const pixelMap = new Map()

    adAccounts.forEach(account => {
      const pixelId = account.metadata?.pixel_id
      if (!pixelId) return

      // Get BM information from the account's metadata
      const bmId = account.metadata?.business_manager_id
      const bmInfo = bmId ? bmMap.get(bmId) : null

      if (!pixelMap.has(pixelId)) {
        pixelMap.set(pixelId, {
          id: pixelId, // Use pixel_id as the ID for frontend
          pixelId,
          pixelName: account.metadata?.pixel_name || `Pixel ${pixelId}`,
          businessManagerId: bmId,
          businessManagerName: bmInfo?.name || account.metadata?.business_manager_name || 'Unknown BM',
          adAccounts: [],
          status: 'active', // Default status
          isActive: account.asset_binding[0]?.is_active || false
        })
      }

      const pixel = pixelMap.get(pixelId)
      pixel.adAccounts.push({
        id: account.asset_id,
        name: account.name,
        dolphin_id: account.dolphin_id,
        status: account.status,
        isActive: account.asset_binding[0]?.is_active || false
      })
    })

    // Convert map to array and sort by pixel ID
    const pixels = Array.from(pixelMap.values()).sort((a, b) => 
      a.pixelId.localeCompare(b.pixelId)
    )

    // Calculate pixel counts
    const activePixels = pixels.filter(p => p.isActive && p.adAccounts.some((acc: any) => acc.isActive)).length
    const totalPixels = pixels.length
    const pendingPixels = 0 // TODO: Add pending pixel applications if needed

    console.log('Pixels fetched successfully:', pixels.length, 'pixels found')
    console.log('Active pixels:', activePixels)
    console.log('Subscription limit:', subscriptionLimit)

    return NextResponse.json({
      pixels,
      active_pixels: activePixels,
      total_pixels: totalPixels,
      pending_pixels: pendingPixels,
      subscription_limit: subscriptionLimit
    })

  } catch (error) {
    console.error('Error in pixel API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
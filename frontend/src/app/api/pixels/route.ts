import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface PixelData {
  pixel_id: string
  bm_id: string
  bm_name: string
  status: 'active' | 'pending' | 'inactive'
  ad_accounts: Array<{
    id: string
    name: string
    account_id: string
  }>
}

export async function GET(request: NextRequest) {
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
    
    const { data: { user }, error: authError } = await anonSupabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('profile_id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get user's subscription plan for pixel limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id')
      .eq('organization_id', profile.organization_id)
      .eq('status', 'active')
      .single()

    // Get pixel limits from pricing config
    const { getPlanPricing } = await import('@/lib/config/pricing-config')
    const planId = subscription?.plan_id || 'free'
    const planPricing = planId === 'free' ? null : getPlanPricing(planId)
    const subscriptionLimit = planPricing?.pixels || 0

    // Get all ad accounts for this organization that have pixel data
    // Use the same approach as admin API for consistency
    const { data: assets, error: assetsError } = await supabase
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
          bound_at
        )
      `)
      .eq('type', 'ad_account')
      .eq('asset_binding.organization_id', profile.organization_id)
      .eq('asset_binding.status', 'active')

    if (assetsError) {
      console.error('Error fetching assets:', assetsError)
      return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
    }



    // Get business managers for name lookup
    const { data: businessManagers } = await supabase
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
      .eq('asset_binding.organization_id', profile.organization_id)
      .eq('asset_binding.status', 'active')

    // Create BM lookup map
    const bmLookup = new Map()
    if (businessManagers) {
      businessManagers.forEach((bm: any) => {
        bmLookup.set(bm.dolphin_id, bm.name)
      })
    }

    // Process ad accounts to extract pixel data
    const pixelMap = new Map<string, PixelData>()
    
    if (assets) {
      assets.forEach((asset: any) => {
        const metadata = asset.metadata || {}
        const pixelId = metadata.pixel_id
        

        
        if (pixelId) {
          const bmId = metadata.business_manager_id
          const bmName = bmLookup.get(bmId) || metadata.business_manager || 'Unknown BM'
          
          // Create unique key for pixel+BM combination
          const pixelKey = `${pixelId}_${bmId}`
          
          if (!pixelMap.has(pixelKey)) {
            pixelMap.set(pixelKey, {
              pixel_id: pixelId,
              bm_id: bmId || 'unknown',
              bm_name: bmName,
              status: 'active', // We'll determine this based on ad account status
              ad_accounts: []
            })
          }
          
          // Add this ad account to the pixel
          const pixelData = pixelMap.get(pixelKey)!
          pixelData.ad_accounts.push({
            id: asset.asset_id,
            name: asset.name,
            account_id: metadata.ad_account_id || asset.dolphin_id
          })
          
          // Note: Removed last_seen tracking as it's not needed
          
          // Update status based on asset status
          if (asset.status === 'inactive' || asset.status === 'suspended') {
            pixelData.status = 'inactive'
          }
        }
      })
    }

    const pixels = Array.from(pixelMap.values())

    return NextResponse.json({
      pixels,
      total_pixels: pixels.length,
      total_bms: new Set(pixels.map(p => p.bm_id)).size,
      subscription_limit: subscriptionLimit
    })

  } catch (error) {
    console.error('Error fetching pixels:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
} 
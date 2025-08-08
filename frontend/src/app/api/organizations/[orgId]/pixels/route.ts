import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPlanPricing } from '@/lib/config/pricing-config'

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // SECURE: Always require authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify user belongs to this organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('profile_id', user.id)
      .single();

    if (!profile || profile.organization_id !== params.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch organization, pixel assets, and pending applications in parallel
    const [orgResult, pixelAssetsResult, pendingPixelAppsResult] = await Promise.all([
      // Get organization details
      supabase
        .from('organizations')
        .select('*')
        .eq('organization_id', params.orgId)
        .single(),
      
      // Get pixel assets directly from asset table
      supabase
        .from('asset')
        .select(`
          asset_id,
          name,
          dolphin_id,
          metadata,
          status,
          type,
          created_at,
          updated_at,
          asset_binding!inner(
            organization_id,
            status,
            is_active,
            bound_at
          )
        `)
        .eq('asset_binding.organization_id', params.orgId)
        .eq('asset_binding.status', 'active')
        .eq('type', 'pixel'),
      
      // Get pending pixel connection applications
      supabase
        .from('application')
        .select('*')
        .eq('organization_id', params.orgId)
        .eq('request_type', 'pixel_connection')
        .in('status', ['pending', 'processing'])
    ])

    if (orgResult.error) {
      console.error('Error fetching organization:', orgResult.error)
      return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
    }

    if (pixelAssetsResult.error) {
      console.error('Error fetching pixel assets:', pixelAssetsResult.error)
      return NextResponse.json({ error: 'Failed to fetch pixel assets' }, { status: 500 })
    }

    if (pendingPixelAppsResult.error) {
      console.error('Error fetching pending pixel applications:', pendingPixelAppsResult.error)
      return NextResponse.json({ error: 'Failed to fetch pending pixel applications' }, { status: 500 })
    }

    const orgData = orgResult.data
    const pixelAssets = pixelAssetsResult.data || []
    const pendingPixelApps = pendingPixelAppsResult.data || []

    // Get pixel limits from pricing config (same pattern as subscription API)
    const planId = orgData.plan_id || 'free'
    
    let subscriptionLimit = 0
    
    if (planId === 'free') {
      subscriptionLimit = 0
    } else {
      // Use pricing config as single source of truth
      const planPricing = getPlanPricing(planId as 'starter' | 'growth' | 'scale' | 'plus')
      
      if (planPricing && typeof planPricing.pixels === 'number') {
        subscriptionLimit = planPricing.pixels
      } else {
        // If plan exists in org but not in pricing config, treat as free plan
        console.warn(`Plan ${planId} not found in pricing config, treating as free plan`)
        subscriptionLimit = 0
      }
    }

    // Get business managers for name lookup
    const { data: businessManagers } = await supabase
      .from('asset')
      .select(`
        asset_id,
        name,
        dolphin_id,
        asset_binding!inner(
          organization_id,
          status
        )
      `)
      .eq('type', 'business_manager')
      .eq('asset_binding.organization_id', params.orgId)
      .eq('asset_binding.status', 'active')

    // Create BM lookup map
    const bmMap = new Map()
    if (businessManagers) {
      businessManagers.forEach((bm: any) => {
        bmMap.set(bm.dolphin_id, {
          id: bm.asset_id,
          name: bm.name,
          dolphin_id: bm.dolphin_id
        })
      })
    }

    // Get ad accounts for each pixel to show which accounts are using the pixel
    const { data: adAccounts } = await supabase
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

    // Create a map of pixel_id -> ad_accounts for that pixel
    const pixelToAdAccountsMap = new Map()
    if (adAccounts) {
      adAccounts.forEach((account: any) => {
        const pixelId = account.metadata?.pixel_id
        if (pixelId) {
          if (!pixelToAdAccountsMap.has(pixelId)) {
            pixelToAdAccountsMap.set(pixelId, [])
          }
          pixelToAdAccountsMap.get(pixelId).push({
            id: account.asset_id,
            name: account.name,
            dolphin_id: account.dolphin_id,
            status: account.status,
            isActive: account.asset_binding[0]?.is_active || false
          })
        }
      })
    }

    // Process pixel assets
    const pixels = pixelAssets.map((pixel: any) => {
      const metadata = pixel.metadata || {}
      const bmId = metadata.business_manager_id
      const bmInfo = bmId ? bmMap.get(bmId) : null
      const adAccountsForPixel = pixelToAdAccountsMap.get(pixel.dolphin_id) || []

      return {
        id: pixel.asset_id,
        pixelId: pixel.dolphin_id,
        pixelName: pixel.name,
        businessManagerId: bmId,
        businessManagerName: bmInfo?.name || metadata.business_manager_name || 'Unknown BM',
        adAccounts: adAccountsForPixel,
        status: pixel.status,
        isActive: pixel.asset_binding[0]?.is_active || false,
        createdAt: pixel.created_at,
        updatedAt: pixel.updated_at
      }
    })

    // Add pending pixel connection applications
    const pendingPixels = pendingPixelApps.map((app: any) => {
      const bmId = app.target_bm_dolphin_id
      const bmInfo = bmId ? bmMap.get(bmId) : null
      
      return {
        id: app.application_id,
        type: 'application',
        pixelId: app.pixel_id,
        pixelName: app.pixel_name || `Pixel ${app.pixel_id}`,
        businessManagerId: bmId,
        businessManagerName: bmInfo?.name || 'Unknown BM',
        adAccounts: [],
        status: app.status,
        isActive: false,
        applicationId: app.application_id,
        createdAt: app.created_at
      }
    })

    // Combine active pixels and pending applications
    const allPixels = [...pixels, ...pendingPixels]

    // Sort by created date (newest first)
    allPixels.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())

    return NextResponse.json({
      pixels: allPixels,
      total: allPixels.length,
      active: pixels.length,
      pending: pendingPixels.length,
      subscriptionLimit
    })

  } catch (error) {
    console.error('Error in pixels API:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
} 
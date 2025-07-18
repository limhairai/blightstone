import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // SECURE: Check authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const DOLPHIN_API_URL = process.env.DOLPHIN_API_URL || 'https://cloud.dolphin.tech'
    const DOLPHIN_API_KEY = process.env.DOLPHIN_API_KEY

    if (!DOLPHIN_API_KEY) {
      return NextResponse.json({ error: 'Dolphin API key not configured' }, { status: 500 })
    }

    console.log('🔍 Starting pixel sync from Dolphin API...')

    // Fetch pixels from both business managers and ad accounts
    const [bmResponse, cabsResponse] = await Promise.all([
      fetch(`${DOLPHIN_API_URL}/api/v1/fb-businesses?perPage=100&page=1&currency=USD&with_trashed=1`, {
        headers: {
          'Authorization': `Bearer ${DOLPHIN_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }),
      fetch(`${DOLPHIN_API_URL}/api/v1/fb-cabs?perPage=100&page=1&currency=USD&showArchivedAdAccount=1&with_trashed=1`, {
        headers: {
          'Authorization': `Bearer ${DOLPHIN_API_KEY}`,
          'Content-Type': 'application/json',
        },
      })
    ])

    if (!bmResponse.ok) {
      throw new Error(`Business managers API error: ${bmResponse.status} ${bmResponse.statusText}`)
    }

    const bmData = await bmResponse.json()
    const businessManagers = bmData.data || []

    // Extract pixels from business managers
    const pixelsFromBMs: any[] = []
    businessManagers.forEach((bm: any) => {
      if (bm.pixels && Array.isArray(bm.pixels)) {
        bm.pixels.forEach((pixel: any) => {
          pixelsFromBMs.push({
            pixel_id: pixel.id,
            pixel_name: pixel.name || `Pixel ${pixel.id}`,
            business_manager_id: bm.id,
            business_manager_name: bm.name,
            status: pixel.status || 'active',
            created_time: pixel.created_time,
            source: 'dolphin_bm'
          })
        })
      }
    })

    // Extract pixels from ad accounts
    const pixelsFromCABs: any[] = []
    if (cabsResponse.ok) {
      const cabsData = await cabsResponse.json()
      const adAccounts = cabsData.data || []

      adAccounts.forEach((cab: any) => {
        if (cab.pixel_id) {
          pixelsFromCABs.push({
            pixel_id: cab.pixel_id,
            pixel_name: cab.pixel_name || `Pixel ${cab.pixel_id}`,
            business_manager_id: cab.business_manager_id,
            business_manager_name: cab.business_manager_name,
            ad_account_id: cab.id,
            ad_account_name: cab.name,
            status: 'active',
            source: 'dolphin_cab'
          })
        }
      })
    }

    // Combine and deduplicate pixels
    const allPixels = [...pixelsFromBMs, ...pixelsFromCABs]
    const pixelMap = new Map()

    allPixels.forEach(pixel => {
      const key = `${pixel.pixel_id}_${pixel.business_manager_id}`
      if (!pixelMap.has(key)) {
        pixelMap.set(key, pixel)
      } else {
        // Merge data from multiple sources
        const existing = pixelMap.get(key)
        if (pixel.ad_account_id && !existing.ad_account_id) {
          existing.ad_account_id = pixel.ad_account_id
          existing.ad_account_name = pixel.ad_account_name
        }
      }
    })

    const uniquePixels = Array.from(pixelMap.values())

    console.log(`🔍 Found ${uniquePixels.length} unique pixels from Dolphin API`)

    // Now sync these pixels to the database as assets
    const syncResults = {
      created: 0,
      updated: 0,
      errors: 0,
      total: uniquePixels.length
    }

    for (const pixel of uniquePixels) {
      try {
        // Check if pixel asset already exists
        const { data: existingAsset } = await supabase
          .from('asset')
          .select('asset_id, status, metadata')
          .eq('type', 'pixel')
          .eq('dolphin_id', pixel.pixel_id)
          .single()

        const pixelMetadata = {
          business_manager_id: pixel.business_manager_id,
          business_manager_name: pixel.business_manager_name,
          ad_account_id: pixel.ad_account_id,
          ad_account_name: pixel.ad_account_name,
          created_time: pixel.created_time,
          source: pixel.source,
          last_synced_at: new Date().toISOString()
        }

        if (existingAsset) {
          // Update existing pixel asset
          const { error: updateError } = await supabase
            .from('asset')
            .update({
              name: pixel.pixel_name,
              status: pixel.status,
              metadata: pixelMetadata,
              updated_at: new Date().toISOString()
            })
            .eq('asset_id', existingAsset.asset_id)

          if (updateError) {
            console.error(`Error updating pixel ${pixel.pixel_id}:`, updateError)
            syncResults.errors++
          } else {
            syncResults.updated++
          }
        } else {
          // Create new pixel asset
          const { error: createError } = await supabase
            .from('asset')
            .insert({
              type: 'pixel',
              dolphin_id: pixel.pixel_id,
              name: pixel.pixel_name,
              status: pixel.status,
              metadata: pixelMetadata,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (createError) {
            console.error(`Error creating pixel ${pixel.pixel_id}:`, createError)
            syncResults.errors++
          } else {
            syncResults.created++
          }
        }
      } catch (error) {
        console.error(`Error syncing pixel ${pixel.pixel_id}:`, error)
        syncResults.errors++
      }
    }

    console.log('🔍 Pixel sync completed:', syncResults)

    return NextResponse.json({
      success: true,
      message: 'Pixel sync completed',
      results: syncResults,
      pixels: uniquePixels
    })

  } catch (error) {
    console.error('Error in pixel sync:', error)
    return NextResponse.json(
      { error: 'Failed to sync pixels from Dolphin API', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 
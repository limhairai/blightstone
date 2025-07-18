import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const DOLPHIN_API_URL = process.env.DOLPHIN_API_URL || 'https://cloud.dolphin.tech'
    const DOLPHIN_API_KEY = process.env.DOLPHIN_API_KEY

    if (!DOLPHIN_API_KEY) {
      return NextResponse.json({ error: 'Dolphin API key not configured' }, { status: 500 })
    }

    // Fetch all business managers from Dolphin to get their pixels
    const bmResponse = await fetch(`${DOLPHIN_API_URL}/api/v1/fb-businesses?perPage=100&page=1&currency=USD&with_trashed=1`, {
      headers: {
        'Authorization': `Bearer ${DOLPHIN_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!bmResponse.ok) {
      throw new Error(`Dolphin API error: ${bmResponse.status} ${bmResponse.statusText}`)
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

    // Also fetch ad accounts to get pixels from their metadata
    const cabsResponse = await fetch(`${DOLPHIN_API_URL}/api/v1/fb-cabs?perPage=100&page=1&currency=USD&showArchivedAdAccount=1&with_trashed=1`, {
      headers: {
        'Authorization': `Bearer ${DOLPHIN_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

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

    return NextResponse.json({
      pixels: uniquePixels,
      total: uniquePixels.length,
      sources: {
        business_managers: pixelsFromBMs.length,
        ad_accounts: pixelsFromCABs.length,
        unique: uniquePixels.length
      }
    })

  } catch (error) {
    console.error('Error fetching pixels from Dolphin:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pixels from Dolphin API' },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

/**
 * Cache invalidation endpoint
 * This endpoint can be called to immediately invalidate specific cache entries
 */
export async function POST(request: NextRequest) {
  try {
    const { organizationId, type = 'subscription' } = await request.json()

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    // Validate request is from internal source (webhook)
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.CACHE_INVALIDATION_SECRET || 'internal-cache-invalidation'}`
    
    if (authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Invalidate caches based on type
    if (type === 'subscription') {
      // Invalidate subscription-related caches
      revalidateTag(`subscription-${organizationId}`)
      revalidateTag(`organization-${organizationId}`)
      revalidateTag('subscriptions')
      revalidateTag('organizations')
      
      console.log(`✅ Subscription cache invalidated for org: ${organizationId}`)
    } else if (type === 'organization') {
      // Invalidate organization-related caches
      revalidateTag(`organization-${organizationId}`)
      revalidateTag('organizations')
      revalidateTag('business-managers')
      revalidateTag('ad-accounts')
      
      console.log(`✅ Organization cache invalidated for org: ${organizationId}`)
    } else if (type === 'wallet') {
      // Invalidate wallet and transaction-related caches
      revalidateTag(`organization-${organizationId}`)
      revalidateTag('organizations')
      revalidateTag('transactions')
      revalidateTag(`wallet-${organizationId}`)
      
      // Also clear server-side organization cache
      try {
        const orgCache = global.orgCache || new Map()
        const userCacheKeys = Array.from(orgCache.keys()).filter(key => key.includes(organizationId))
        userCacheKeys.forEach(key => orgCache.delete(key))
        console.log(`✅ Server-side org cache cleared for ${userCacheKeys.length} keys`)
      } catch (error) {
        console.error('Failed to clear server-side cache:', error)
      }
      
      console.log(`✅ Wallet cache invalidated for org: ${organizationId}`)
    } else if (type === 'business-manager') {
      // Invalidate business manager and application-related caches
      revalidateTag(`organization-${organizationId}`)
      revalidateTag('organizations')
      revalidateTag('business-managers')
      revalidateTag('applications')
      revalidateTag('ad-accounts')
      
      console.log(`✅ Business manager cache invalidated for org: ${organizationId}`)
    }

    // Broadcast to connected clients via localStorage (works across all tabs)
    const timestamp = Date.now()
    const cacheData = { type, timestamp, organizationId }
    
    return NextResponse.json({ 
      success: true, 
      message: `Cache invalidated for ${type}`,
      organizationId,
      timestamp,
      broadcastData: cacheData
    })

  } catch (error) {
    console.error('Cache invalidation error:', error)
    return NextResponse.json({ error: 'Cache invalidation failed' }, { status: 500 })
  }
} 
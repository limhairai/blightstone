import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('Authorization')
    const expectedToken = `Bearer ${process.env.CACHE_INVALIDATION_SECRET || 'internal-cache-invalidation'}`
    
    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId, type } = await request.json()

    if (!organizationId || !type) {
      return NextResponse.json({ error: 'organizationId and type are required' }, { status: 400 })
    }

    // Invalidate Next.js cache tags
    switch (type) {
      case 'subscription':
        revalidateTag(`subscription-${organizationId}`)
        revalidateTag(`organization-${organizationId}`)
        revalidateTag('subscriptions')
        revalidateTag('organizations')
        break
        
      case 'wallet':
        revalidateTag(`wallet-${organizationId}`)
        revalidateTag(`transactions-${organizationId}`)
        revalidateTag(`organization-${organizationId}`)
        revalidateTag('organizations')
        break
        
      case 'business-manager':
        revalidateTag(`business-managers-${organizationId}`)
        revalidateTag(`applications-${organizationId}`)
        revalidateTag(`organization-${organizationId}`)
        break
        
      case 'onboarding':
        revalidateTag(`onboarding-${organizationId}`)
        break
        
      default:
        revalidateTag(`organization-${organizationId}`)
        break
    }

    // Clear any global organization cache
    const orgCache = global.orgCache || new Map()
    const userCacheKeys = Array.from(orgCache.keys()).filter(key => key.includes(organizationId))
    userCacheKeys.forEach(key => orgCache.delete(key))

    console.log(`✅ Cache invalidated for org ${organizationId}, type: ${type}`)

    return NextResponse.json({ 
      success: true, 
      message: `Cache invalidated for organization ${organizationId}` 
    })

  } catch (error) {
    console.error('Cache invalidation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
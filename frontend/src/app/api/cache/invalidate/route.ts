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

    const body = await request.json()
    
    // Support both old format { organizationId, type } and new format { tags, context }
    const { organizationId, type, tags, context } = body

    // New format with tags array
    if (tags && Array.isArray(tags)) {
      // Invalidate Next.js cache tags based on categories
      tags.forEach(tag => {
        switch (tag) {
          case 'subscription':
            revalidateTag('subscriptions')
            revalidateTag('subscription')
            break
          case 'organization':
            revalidateTag('organizations')
            revalidateTag('organization')
            break
          case 'wallet':
            revalidateTag('wallet')
            revalidateTag('wallets')
            break
          case 'transactions':
            revalidateTag('transactions')
            break
          case 'onboarding':
            revalidateTag('onboarding')
            break
          case 'plans':
            revalidateTag('plans')
            break
          case 'accounts':
            revalidateTag('accounts')
            break
          case 'businesses':
            revalidateTag('businesses')
            break
          case 'pixels':
            revalidateTag('pixels')
            break
        }
      })
      
      console.log(`✅ Cache invalidated for tags: ${tags.join(', ')} (${context || 'no context'})`)
      
      return NextResponse.json({ 
        success: true, 
        message: `Cache invalidated for tags: ${tags.join(', ')}` 
      })
    }

    // Legacy format support
    if (!organizationId || !type) {
      return NextResponse.json({ error: 'Either tags array or organizationId and type are required' }, { status: 400 })
    }

    // Invalidate Next.js cache tags (legacy format)
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
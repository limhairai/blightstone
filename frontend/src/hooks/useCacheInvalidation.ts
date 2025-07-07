import { useEffect } from 'react'
import { mutate } from 'swr'
import { useOrganizationStore } from '@/lib/stores/organization-store'

/**
 * Hook that listens for cache invalidation events and immediately refreshes relevant caches
 * This provides instant UI updates when subscription changes occur
 */
export function useCacheInvalidation() {
  const { currentOrganizationId } = useOrganizationStore()

  useEffect(() => {
    if (!currentOrganizationId) return

    // Listen for storage events (can be triggered by webhooks via localStorage)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === `cache_invalidate_${currentOrganizationId}`) {
        const data = event.newValue ? JSON.parse(event.newValue) : null
        if (data && data.type === 'subscription') {
          console.log('🔄 Cache invalidation detected, refreshing subscription data...')
          invalidateSubscriptionCaches(currentOrganizationId)
        }
      }
    }

    // Listen for custom events (can be triggered by other parts of the app)
    const handleCacheInvalidation = (event: CustomEvent) => {
      const { organizationId, type } = event.detail
      if (organizationId === currentOrganizationId && type === 'subscription') {
        console.log('🔄 Custom cache invalidation detected, refreshing subscription data...')
        invalidateSubscriptionCaches(currentOrganizationId)
      }
    }

    // Listen for window focus (user returns to tab after payment)
    const handleWindowFocus = () => {
      // Small delay to allow webhooks to process
      setTimeout(() => {
        console.log('🔄 Window focused, refreshing subscription data...')
        invalidateSubscriptionCaches(currentOrganizationId)
      }, 1000)
    }

    // Add event listeners
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('cache-invalidation', handleCacheInvalidation as EventListener)
    window.addEventListener('focus', handleWindowFocus)

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cache-invalidation', handleCacheInvalidation as EventListener)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [currentOrganizationId])
}

/**
 * Immediately invalidate all subscription-related SWR caches
 */
export async function invalidateSubscriptionCaches(organizationId: string) {
  if (!organizationId) return

  try {
    // Invalidate all subscription-related cache keys with force revalidation
    await Promise.all([
      // Subscription data with different possible cache key formats
      mutate([`/api/subscriptions/current?organizationId=${organizationId}`, localStorage.getItem('sb-access-token')], undefined, { revalidate: true }),
      mutate(`/api/subscriptions/current?organizationId=${organizationId}`, undefined, { revalidate: true }),
      
      // Organization data
      mutate([`/api/organizations?id=${organizationId}`, localStorage.getItem('sb-access-token')], undefined, { revalidate: true }),
      mutate(`/api/organizations?id=${organizationId}`, undefined, { revalidate: true }),
      
      // Plans data
      mutate('/api/subscriptions/plans', undefined, { revalidate: true }),
      mutate('/api/subscriptions/available-plans', undefined, { revalidate: true }),
      
      // General organization caches
      mutate('organizations', undefined, { revalidate: true }),
      mutate(`org-${organizationId}`, undefined, { revalidate: true }),
    ])
    
    console.log('✅ SWR caches invalidated successfully')
    return true
  } catch (error) {
    console.error('Failed to invalidate SWR caches:', error)
    return false
  }
}

/**
 * Trigger cache invalidation event (can be called from anywhere in the app)
 */
export function triggerCacheInvalidation(organizationId: string, type: 'subscription' | 'organization' = 'subscription') {
  // Method 1: Custom event
  const event = new CustomEvent('cache-invalidation', {
    detail: { organizationId, type, timestamp: Date.now() }
  })
  window.dispatchEvent(event)

  // Method 2: localStorage (works across tabs)
  const cacheData = { type, timestamp: Date.now() }
  localStorage.setItem(`cache_invalidate_${organizationId}`, JSON.stringify(cacheData))
  
  // Clean up localStorage after a short delay
  setTimeout(() => {
    localStorage.removeItem(`cache_invalidate_${organizationId}`)
  }, 5000)

  console.log(`🔄 Cache invalidation triggered for org ${organizationId}, type: ${type}`)
} 
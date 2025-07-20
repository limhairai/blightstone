/**
 * Instant Cache Refresh - Simple but effective cache invalidation
 * This uses multiple strategies to ensure cache updates work immediately
 */

import { mutate } from 'swr'

/**
 * The nuclear approach - clear ALL cache and force refresh
 * This WILL work, no matter what
 */
export async function forceRefreshAllData(): Promise<void> {
  try {
    // Strategy 1: Clear ALL SWR cache
    await mutate(() => true, undefined, { revalidate: true })
    
    // Strategy 2: Force refresh specific critical endpoints
    const criticalEndpoints = [
      '/api/organizations',
      '/api/subscription', 
      '/api/onboarding/progress',
      '/api/wallet',
      '/api/plans'
    ]
    
    for (const endpoint of criticalEndpoints) {
      await mutate(endpoint, undefined, { revalidate: true })
    }
    
    // Strategy 3: Trigger custom event for any components listening
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('force-refresh-data'))
    }
    
    console.log('💥 NUCLEAR: All cache cleared and data refreshed')
  } catch (error) {
    console.error('Failed to force refresh data:', error)
  }
}

/**
 * Immediate cache invalidation for payment success
 * Uses multiple strategies to ensure it works
 */
export async function invalidatePaymentCache(organizationId?: string): Promise<void> {
  try {
    // Strategy 1: Pattern-based invalidation
    await mutate(
      (key) => {
        if (typeof key !== 'string') return false
        return key.includes('organization') || 
               key.includes('subscription') || 
               key.includes('wallet') || 
               key.includes('onboarding')
      },
      undefined,
      { revalidate: true }
    )
    
    // Strategy 2: Specific key invalidation with organization ID
    if (organizationId) {
      const keysWithOrg = [
        `/api/organizations?id=${organizationId}`,
        `/api/subscription?org=${organizationId}`,
        `/api/wallet?org=${organizationId}`,
        `/api/onboarding/progress?org=${organizationId}`
      ]
      
      for (const key of keysWithOrg) {
        await mutate(key, undefined, { revalidate: true })
      }
    }
    
    // Strategy 3: General keys without org ID
    const generalKeys = [
      '/api/organizations',
      '/api/subscription',
      '/api/wallet',
      '/api/onboarding/progress',
      '/api/plans'
    ]
    
    for (const key of generalKeys) {
      await mutate(key, undefined, { revalidate: true })
    }
    
    // Strategy 4: Local storage event for cross-tab communication
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('payment-cache-invalidation', {
        detail: { organizationId, timestamp: Date.now() }
      })
      window.dispatchEvent(event)
      
      // Also use localStorage
      localStorage.setItem('payment_cache_invalidate', JSON.stringify({
        organizationId,
        timestamp: Date.now()
      }))
      
      // Clean up localStorage after 5 seconds
      setTimeout(() => {
        localStorage.removeItem('payment_cache_invalidate')
      }, 5000)
    }
    
    console.log('🔄 Payment cache invalidated for org:', organizationId)
  } catch (error) {
    console.error('Failed to invalidate payment cache:', error)
    // Fallback to nuclear option
    setTimeout(() => forceRefreshAllData(), 1000)
  }
}

/**
 * Simple cache invalidation that just works
 * Call this after any important data change
 */
export async function refreshCriticalData(): Promise<void> {
  const endpoints = [
    '/api/organizations',
    '/api/subscription',
    '/api/onboarding/progress', 
    '/api/wallet'
  ]
  
  for (const endpoint of endpoints) {
    try {
      await mutate(endpoint, undefined, { revalidate: true })
    } catch (error) {
      console.warn(`Failed to refresh ${endpoint}:`, error)
    }
  }
  
  console.log('✅ Critical data refreshed')
}

/**
 * Setup listeners for cache invalidation events
 */
export function setupCacheInvalidationListeners(): void {
  if (typeof window === 'undefined') return
  
  // Listen for payment success events
  window.addEventListener('payment-cache-invalidation', (event: any) => {
    const { organizationId } = event.detail
    console.log('🔔 Received payment cache invalidation event')
    refreshCriticalData()
  })
  
  // Listen for localStorage changes (cross-tab)
  window.addEventListener('storage', (event) => {
    if (event.key === 'payment_cache_invalidate') {
      console.log('🔔 Received cross-tab cache invalidation')
      refreshCriticalData()
    }
  })
  
  // Listen for force refresh events
  window.addEventListener('force-refresh-data', () => {
    console.log('🔔 Received force refresh event')
    refreshCriticalData()
  })
  
  // Refresh on window focus (user comes back to tab)
  window.addEventListener('focus', () => {
    console.log('🔔 Window focused, refreshing data')
    setTimeout(() => refreshCriticalData(), 500)
  })
  
  console.log('👂 Cache invalidation listeners setup complete')
}

/**
 * Initialize everything
 */
export function initializeCacheSystem(): void {
  if (typeof window === 'undefined') return
  
  setupCacheInvalidationListeners()
  
  // Add global functions for manual testing
  ;(window as any).forceRefreshAllData = forceRefreshAllData
  ;(window as any).invalidatePaymentCache = invalidatePaymentCache
  ;(window as any).refreshCriticalData = refreshCriticalData
  
  console.log('🚀 Cache system initialized')
} 
/**
 * Surgical Cache Invalidation - Targets EXACT SWR keys used in the app
 * This fixes the cache invalidation problem by targeting the precise keys
 */

import { mutate } from 'swr'

/**
 * Get the current session token from the auth context
 */
function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null
  
  // Try to get from local storage (where Supabase stores it)
  try {
    const authData = localStorage.getItem('supabase.auth.token')
    if (authData) {
      const parsed = JSON.parse(authData)
      return parsed?.access_token || null
    }
    
    // Fallback: try session storage
    const sessionData = sessionStorage.getItem('supabase.auth.token')
    if (sessionData) {
      const parsed = JSON.parse(sessionData)
      return parsed?.access_token || null
    }
  } catch (error) {
    console.warn('Failed to get session token:', error)
  }
  
  return null
}

/**
 * Get organization ID from store
 */
function getOrganizationId(): string | null {
  if (typeof window === 'undefined') return null
  
  try {
    // Get from Zustand store in localStorage
    const storeData = localStorage.getItem('organization-store')
    if (storeData) {
      const parsed = JSON.parse(storeData)
      return parsed?.state?.currentOrganizationId || null
    }
  } catch (error) {
    console.warn('Failed to get organization ID:', error)
  }
  
  return null
}

/**
 * The EXACT SWR cache keys used in the app
 */
function generateExactCacheKeys(organizationId?: string, sessionToken?: string) {
  const orgId = organizationId || getOrganizationId()
  const token = sessionToken || getSessionToken()
  
  const keys = []
  
  if (token) {
    // Organizations data (array key format)
    keys.push(['/api/organizations', token])
    
    if (orgId) {
      // Current organization (array key format)
      keys.push([`/api/organizations?id=${orgId}`, token])
      
      // Subscription data (array key format)
      keys.push([`/api/subscriptions/current?organizationId=${orgId}`, token])
      
      // Onboarding progress
      keys.push('/api/onboarding-progress')
      
      // Wallet data
      keys.push([`/api/wallet?org=${orgId}`, token])
      
      // Transactions
      keys.push([`/api/transactions?org=${orgId}`, token])
    }
    
    // Global endpoints (string keys)
    keys.push('/api/plans')
  }
  
  return keys
}

/**
 * NUCLEAR option: Invalidate all known cache keys
 * This WILL work because it targets the exact keys
 */
export async function invalidateAllKnownKeys(organizationId?: string, sessionToken?: string): Promise<void> {
  try {
    const exactKeys = generateExactCacheKeys(organizationId, sessionToken)
    
    console.log('🎯 Invalidating exact cache keys:', exactKeys)
    
    // Invalidate each key individually
    for (const key of exactKeys) {
      try {
        await mutate(key, undefined, { revalidate: true })
      } catch (error) {
        console.warn('Failed to invalidate key:', key, error)
      }
    }
    
    // Also do pattern-based invalidation as backup
    await mutate(
      (key) => {
        if (typeof key === 'string') {
          return key.includes('organization') || 
                 key.includes('subscription') || 
                 key.includes('onboarding') ||
                 key.includes('wallet')
        }
        if (Array.isArray(key) && typeof key[0] === 'string') {
          return key[0].includes('organization') || 
                 key[0].includes('subscription') || 
                 key[0].includes('onboarding') ||
                 key[0].includes('wallet')
        }
        return false
      },
      undefined,
      { revalidate: true }
    )
    
    console.log('✅ All known cache keys invalidated successfully')
  } catch (error) {
    console.error('Failed to invalidate cache keys:', error)
  }
}

/**
 * Payment-specific cache invalidation
 */
export async function invalidatePaymentCaches(organizationId?: string): Promise<void> {
  const orgId = organizationId || getOrganizationId()
  const token = getSessionToken()
  
  if (!token || !orgId) {
    console.warn('Missing token or org ID for payment cache invalidation')
    return
  }
  
  const paymentKeys = [
    // Subscription data is most critical after payment
    [`/api/subscriptions/current?organizationId=${orgId}`, token],
    [`/api/organizations?id=${orgId}`, token],
    ['/api/organizations', token],
    '/api/onboarding-progress',
    [`/api/wallet?org=${orgId}`, token],
  ]
  
  console.log('💳 Invalidating payment-related caches:', paymentKeys)
  
  for (const key of paymentKeys) {
    try {
      await mutate(key, undefined, { revalidate: true })
    } catch (error) {
      console.warn('Failed to invalidate payment key:', key, error)
    }
  }
  
  // Trigger a custom event for components to listen to
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('payment-cache-invalidated', {
      detail: { organizationId: orgId, timestamp: Date.now() }
    }))
  }
  
  console.log('✅ Payment caches invalidated')
}

/**
 * Simple function to call after any important change
 */
export async function forceRefreshCriticalData(): Promise<void> {
  const orgId = getOrganizationId()
  const token = getSessionToken()
  
  if (!token) {
    console.warn('No session token available for cache refresh')
    return
  }
  
  // The most critical data that users need to see updated immediately
  const criticalKeys = [
    ['/api/organizations', token],
    '/api/onboarding-progress'
  ]
  
  if (orgId) {
    criticalKeys.push(
      [`/api/organizations?id=${orgId}`, token],
      [`/api/subscriptions/current?organizationId=${orgId}`, token]
    )
  }
  
  console.log('🔄 Force refreshing critical data:', criticalKeys)
  
  for (const key of criticalKeys) {
    try {
      await mutate(key, undefined, { revalidate: true })
    } catch (error) {
      console.warn('Failed to refresh critical key:', key, error)
    }
  }
  
  console.log('✅ Critical data refreshed')
}

/**
 * Initialize global cache invalidation functions
 */
export function initializeCacheInvalidation(): void {
  if (typeof window === 'undefined') return
  
  // Add global functions for easy access
  ;(window as any).invalidateAllKnownKeys = invalidateAllKnownKeys
  ;(window as any).invalidatePaymentCaches = invalidatePaymentCaches
  ;(window as any).forceRefreshCriticalData = forceRefreshCriticalData
  
  // Listen for payment success events
  window.addEventListener('payment-cache-invalidated', () => {
    console.log('🔔 Payment cache invalidation event received')
  })
  
  console.log('🎯 Surgical cache invalidation initialized')
} 
import { mutate } from 'swr'

/**
 * Utility functions for subscription management and cache invalidation
 */

/**
 * Invalidates all subscription-related cache entries for a given organization
 * This should be called after subscription changes (upgrades, downgrades, etc.)
 */
export async function invalidateSubscriptionCache(organizationId: string) {
  if (!organizationId) return false

  try {
    // Invalidate all subscription-related cache keys
    await Promise.all([
      // Subscription data
      mutate(`/api/subscriptions/current?organizationId=${organizationId}`),
      // Organization data (contains plan_id)
      mutate(`/api/organizations?id=${organizationId}`),
      // Plans data
      mutate('/api/subscriptions/plans'),
      // Available plans
      mutate('/api/subscriptions/available-plans'),
    ])
    
    return true
  } catch (error) {
    console.error('Failed to invalidate subscription cache:', error)
    return false
  }
}

/**
 * Invalidates all organization-related cache entries
 */
export async function invalidateOrganizationCache(organizationId: string) {
  if (!organizationId) return false

  try {
    await Promise.all([
      // Organization data - force revalidation with the exact cache key format
      mutate((key) => {
        return Array.isArray(key) && key[0] === `/api/organizations?id=${organizationId}`
      }, undefined, { revalidate: true }),
      // Legacy cache keys for backward compatibility
      mutate(`/api/organizations?id=${organizationId}`, undefined, { revalidate: true }),
      mutate('organizations', undefined, { revalidate: true }),
      mutate(`org-${organizationId}`, undefined, { revalidate: true }),
      // Business managers and applications
      mutate('business-managers', undefined, { revalidate: true }),
      mutate('/api/business-managers', undefined, { revalidate: true }),
      mutate('ad-accounts', undefined, { revalidate: true }),
      mutate('/api/ad-accounts', undefined, { revalidate: true }),
      // Transactions
      mutate('transactions', undefined, { revalidate: true }),
      mutate('/api/transactions', undefined, { revalidate: true }),
      // Admin applications if applicable
      mutate('/api/admin/applications', undefined, { revalidate: true }),
    ])
    
    return true
  } catch (error) {
    console.error('Failed to invalidate organization cache:', error)
    return false
  }
}

/**
 * Invalidates all business manager and application related cache entries
 */
export async function invalidateBusinessManagerCache(organizationId?: string) {
  try {
    const cacheKeys = [
      // Business managers
      'business-managers',
      '/api/business-managers',
      // Ad accounts
      'ad-accounts',
      '/api/ad-accounts',
      // Applications
      '/api/applications',
      '/api/admin/applications',
      '/api/bm-applications',
    ]

    // Add organization-specific keys if organizationId provided
    if (organizationId) {
      cacheKeys.push(
        `/api/organizations?id=${organizationId}`,
        `org-${organizationId}`,
      )
    }

    await Promise.all(cacheKeys.map(key => mutate(key)))
    
    return true
  } catch (error) {
    console.error('Failed to invalidate business manager cache:', error)
    return false
  }
}

/**
 * Simple refresh after subscription changes - just reload the page
 */
export async function refreshAfterSubscriptionChange(organizationId: string) {
  if (!organizationId) return false

  try {
    console.log('🔄 Subscription changed, reloading page...')
    
    // Simple page reload to ensure fresh data
    setTimeout(() => {
      window.location.reload()
    }, 1000)
    
    return true
  } catch (error) {
    console.error('Failed to refresh after subscription change:', error)
    window.location.reload()
    return false
  }
}

/**
 * Refresh cache after business manager or application changes
 */
export async function refreshAfterBusinessManagerChange(organizationId?: string) {
  try {
    await invalidateBusinessManagerCache(organizationId)
    
    // Wait a moment for the cache to clear
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return true
  } catch (error) {
    console.error('Failed to refresh after business manager change:', error)
    return false
  }
}

/**
 * Checks if a subscription upgrade is in progress by looking for URL parameters
 */
export function isSubscriptionUpgradeInProgress(): boolean {
  if (typeof window === 'undefined') return false
  
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('subscription') === 'success'
}

/**
 * Clears subscription-related URL parameters after processing
 */
export function clearSubscriptionUrlParams() {
  if (typeof window === 'undefined') return
  
  const url = new URL(window.location.href)
  url.searchParams.delete('subscription')
  url.searchParams.delete('session_id')
  
  window.history.replaceState({}, '', url.toString())
} 
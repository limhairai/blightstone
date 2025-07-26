/**
 * Centralized cache invalidation utilities for payment success and other critical events
 */

import { mutate } from 'swr'
import { CacheCategories, AuthKeys, validateCacheKey, logCacheKeyUsage } from './cache-keys'

export type CacheCategory = 
  | 'subscription' 
  | 'organization' 
  | 'onboarding' 
  | 'plans' 
  | 'wallet' 
  | 'transactions'
  | 'accounts'
  | 'businesses'
  | 'pixels'

/**
 * Invalidate both server-side Next.js caches and client-side SWR caches
 */
export async function invalidateCaches(
  categories: CacheCategory[], 
  context: string = 'general'
): Promise<void> {
  try {
    // Invalidate server-side caches via API
    await fetch('/api/cache/invalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: categories })
    })
    
    // Invalidate client-side SWR caches using surgical precision
    if (typeof window !== 'undefined') {
      const { invalidatePaymentCaches } = await import('./surgical-cache-invalidation')
      await invalidatePaymentCaches()
    }
    
    console.log(`✅ ${context}: Caches invalidated for categories:`, categories)
  } catch (error) {
    console.error(`❌ Failed to invalidate caches in ${context}:`, error)
    throw error
  }
}

/**
 * Predefined cache invalidation for common scenarios
 */
export const CacheInvalidationScenarios = {
  /**
   * After successful payment (subscription upgrade, wallet funding, etc.)
   */
  paymentSuccess: () => invalidateCaches(
    ['subscription', 'organization', 'onboarding', 'plans', 'wallet', 'transactions'],
    'Payment Success'
  ),
  
  /**
   * After wallet funding (crypto or card payments)
   */
  walletFunding: () => invalidateCaches(
    ['organization', 'wallet', 'transactions'],
    'Wallet Funding'
  ),
  
  /**
   * After subscription change
   */
  subscriptionChange: async () => {
    await invalidateCaches(
      ['subscription', 'organization', 'plans', 'onboarding'],
      'Subscription Change'
    )
    
    // Also use surgical subscription invalidation
    if (typeof window !== 'undefined') {
      const { invalidateSubscriptionCaches } = await import('./surgical-cache-invalidation')
      await invalidateSubscriptionCaches()
    }
  },
  
  /**
   * After onboarding progress update
   */
  onboardingUpdate: () => invalidateCaches(
    ['onboarding', 'organization'],
    'Onboarding Update'
  ),
  
  /**
   * After connecting accounts or businesses
   */
  accountConnection: () => invalidateCaches(
    ['accounts', 'businesses', 'organization'],
    'Account Connection'
  ),
  
  /**
   * After major organization changes
   */
  organizationUpdate: () => invalidateCaches(
    ['organization', 'subscription', 'wallet', 'accounts', 'businesses'],
    'Organization Update'
  )
}

/**
 * Safe cache invalidation that won't throw errors
 */
export async function safeInvalidateCaches(
  categories: CacheCategory[], 
  context: string = 'general'
): Promise<boolean> {
  try {
    await invalidateCaches(categories, context)
    return true
  } catch (error) {
    console.warn(`Cache invalidation failed for ${context}, but continuing...`, error)
    return false
  }
} 

/**
 * Comprehensive cache invalidation for asset-related data
 * This ensures all data sources see updated asset states immediately
 */
export function invalidateAssetCache(organizationId: string) {
  if (!organizationId) return

  // Use standardized cache keys
  const keysToInvalidate = [
    ...CacheCategories.assets(organizationId),
    ...CacheCategories.organization(organizationId),
    ...CacheCategories.subscription(organizationId), // Asset changes affect usage counts
  ]

  logCacheKeyUsage('Asset Invalidation', keysToInvalidate)

  // Invalidate exact matches
  keysToInvalidate.forEach(key => {
    if (validateCacheKey(key)) {
      mutate(key, undefined, { revalidate: true })
    }
  })

  // Pattern-based invalidation for dynamic keys (authenticated endpoints)
  mutate((key) => {
    if (typeof key === 'string') {
      return key.includes(organizationId) || 
             key.includes('/api/business-managers') ||
             key.includes('/api/ad-accounts') ||
             key.includes('/api/subscriptions') ||
             key.includes('/api/organizations')
    }
    if (Array.isArray(key) && key.length === 2) {
      const url = key[0]
      return typeof url === 'string' && (
        url.includes(organizationId) ||
        url.includes('/api/business-managers') ||
        url.includes('/api/ad-accounts') ||
        url.includes('/api/organizations')
      )
    }
    return false
  }, undefined, { revalidate: true })
}

/**
 * Invalidate subscription-related cache specifically
 * Used when subscription status or usage counts change
 */
export function invalidateSubscriptionCache(organizationId: string) {
  if (!organizationId) return

  const subscriptionKeys = [
    // Core subscription endpoints
    `/api/subscriptions/current`,
    `/api/subscriptions/current?organizationId=${organizationId}`,
    
    // Usage counting endpoints  
    `/api/topup-usage`,
    `/api/topup-usage?organizationId=${organizationId}`,
    
    // Real-time count APIs (critical for limit checking)
    `/api/organizations/${organizationId}/active-bm-count`,
    `/api/organizations/${organizationId}/active-account-count`,
    
    // Organization data (contains usage info)
    `/api/organizations`,
    `/api/organizations?id=${organizationId}`,
    `/api/organizations/${organizationId}`,
    
    // SWR hook keys used by useSubscription
    'subscription',
    `subscription-${organizationId}`,
    'subscriptionData',
    `subscriptionData-${organizationId}`,
  ]

  // Invalidate exact matches
  subscriptionKeys.forEach(key => {
    mutate(key, undefined, { revalidate: true })
  })

  // Pattern-based invalidation for dynamic keys
  mutate((key) => {
    if (typeof key === 'string') {
      return key.includes(organizationId) ||
             key.includes('/api/subscriptions') ||
             key.includes('/api/topup-usage') ||
             key.includes('/api/organizations') ||
             key.includes('subscription') ||
             key.includes('usage')
    }
    if (Array.isArray(key) && key.length > 0) {
      const url = key[0]
      return typeof url === 'string' && (
        url.includes(organizationId) ||
        url.includes('/api/subscriptions') ||
        url.includes('/api/organizations')
      )
    }
    return false
  }, undefined, { revalidate: true })
}

/**
 * Invalidate financial data after wallet/payment operations
 * Critical for keeping wallet balance, transactions, and limits in sync
 */
export function invalidateFinancialCache(organizationId: string) {
  if (!organizationId) return

  // Use standardized cache keys
  const financialKeys = [
    ...CacheCategories.financial(organizationId),
    ...CacheCategories.organization(organizationId), // Organization contains wallet info
    ...CacheCategories.subscription(organizationId), // Financial changes affect usage
  ]

  logCacheKeyUsage('Financial Invalidation', financialKeys)

  // Invalidate exact matches
  financialKeys.forEach(key => {
    if (validateCacheKey(key)) {
      mutate(key, undefined, { revalidate: true })
    }
  })

  // Pattern-based invalidation for authenticated endpoints
  mutate((key) => {
    if (typeof key === 'string') {
      return key.includes(organizationId) ||
             key.includes('/api/transactions') ||
             key.includes('/api/wallet') ||
             key.includes('/api/topup') ||
             key.includes('/api/organizations')
    }
    if (Array.isArray(key) && key.length === 2) {
      const url = key[0]
      return typeof url === 'string' && (
        url.includes(organizationId) ||
        url.includes('/api/transactions') ||
        url.includes('/api/wallet') ||
        url.includes('/api/organizations')
      )
    }
    return false
  }, undefined, { revalidate: true })
}

/**
 * Invalidate authentication and user-specific data
 * Critical for login/logout flows to clear stale user data
 */
export function invalidateAuthCache() {
  // Use standardized cache keys
  const authKeys = [
    ...CacheCategories.auth,
    '/api/organizations', // User orgs change on login/logout
  ]

  logCacheKeyUsage('Auth Invalidation', authKeys)

  // Invalidate exact matches
  authKeys.forEach(key => {
    if (validateCacheKey(key)) {
      mutate(key, undefined, { revalidate: true })
    }
  })

  // Pattern-based invalidation for user-specific data
  mutate((key) => {
    if (typeof key === 'string') {
      return key.includes('/api/auth') ||
             key.includes('/api/profile') ||
             key.includes('/api/organizations') ||
             key.includes('user') ||
             key.includes('auth') ||
             key.includes('profile')
    }
    if (Array.isArray(key) && key.length > 0) {
      const url = key[0]
      return typeof url === 'string' && (
        url.includes('/api/auth') ||
        url.includes('/api/profile') ||
        url.includes('/api/organizations')
      )
    }
    return false
  }, undefined, { revalidate: true })
}

/**
 * Complete cache invalidation after major operations
 * Use for operations that affect multiple data domains
 */
export function invalidateAllUserCache(organizationId: string) {
  if (!organizationId) return
  
  invalidateAssetCache(organizationId)
  invalidateFinancialCache(organizationId)
  invalidateSubscriptionCache(organizationId)
}

/**
 * Nuclear option: Clear ALL cached data
 * Use for logout, account switches, or critical data inconsistencies
 */
export function clearAllCaches() {
  // Clear all SWR caches
  mutate(() => true, undefined, { revalidate: false })
  
  // Clear localStorage cache remnants
  if (typeof window !== 'undefined') {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.includes('swr-') || 
          key.includes('cache-') ||
          key.includes('adhub-cache')) {
        localStorage.removeItem(key)
      }
    })
  }
}

/**
 * Force refresh of all asset data after significant changes
 * Use sparingly as it triggers many requests
 */
export function forceRefreshAssetData(organizationId: string) {
  invalidateAssetCache(organizationId)
  
  // Additional delay to ensure database consistency
  setTimeout(() => {
    invalidateAssetCache(organizationId)
  }, 1000)
} 
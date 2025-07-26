/**
 * Centralized cache invalidation utilities for payment success and other critical events
 */

import { mutate } from 'swr'

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

  // Invalidate all asset-related cache keys
  const keysToInvalidate = [
    // Business managers data
    `/api/business-managers`,
    `/api/business-managers?organization_id=${organizationId}`,
    
    // Ad accounts data  
    `/api/ad-accounts`,
    `/api/ad-accounts?organization_id=${organizationId}`,
    
    // Organization-specific asset data
    `/api/organizations/${organizationId}/assets`,
    `/api/organizations/${organizationId}/business-managers`,
    `/api/organizations/${organizationId}/pixels`,
    
    // Real-time count APIs (critical for limit checking)
    `/api/organizations/${organizationId}/active-bm-count`,
    
    // Subscription data (contains usage counts)
    `/api/subscriptions/current`,
    `/api/subscriptions/current?organizationId=${organizationId}`,
    
    // Admin APIs (if user is admin)
    `/api/admin/assets`,
    `/api/admin/organizations`,
    `/api/admin/dashboard-summary`,
  ]

  // Invalidate exact matches
  keysToInvalidate.forEach(key => {
    mutate(key, undefined, { revalidate: true })
  })

  // Pattern-based invalidation for dynamic keys
  mutate((key) => {
    if (typeof key === 'string') {
      return key.includes(organizationId) || 
             key.includes('/api/business-managers') ||
             key.includes('/api/ad-accounts') ||
             key.includes('/api/subscriptions') ||
             key.includes('/api/organizations')
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
    `/api/subscriptions/current`,
    `/api/subscriptions/current?organizationId=${organizationId}`,
    `/api/organizations/${organizationId}/active-bm-count`,
  ]

  subscriptionKeys.forEach(key => {
    mutate(key, undefined, { revalidate: true })
  })
}

/**
 * Invalidate financial data after wallet/payment operations
 * Critical for keeping wallet balance, transactions, and limits in sync
 */
export function invalidateFinancialCache(organizationId: string) {
  if (!organizationId) return

  const financialKeys = [
    // Wallet & balance data
    `/api/organizations/${organizationId}/wallet`,
    `/api/wallet/transactions`,
    `/api/wallet/transactions?organizationId=${organizationId}`,
    
    // Transaction history  
    `/api/transactions`,
    `/api/transactions?organizationId=${organizationId}`,
    
    // Topup requests
    `/api/topup-requests`,
    `/api/topup-requests?organizationId=${organizationId}`,
    
    // Organization data (contains wallet info)
    `/api/organizations`,
    `/api/organizations?id=${organizationId}`,
    
    // Subscription usage (affected by spending)
    `/api/subscriptions/current`,
    `/api/subscriptions/current?organizationId=${organizationId}`,
  ]

  // Invalidate exact matches
  financialKeys.forEach(key => {
    mutate(key, undefined, { revalidate: true })
  })

  // Pattern-based invalidation  
  mutate((key) => {
    if (typeof key === 'string') {
      return key.includes(organizationId) ||
             key.includes('/api/transactions') ||
             key.includes('/api/wallet') ||
             key.includes('/api/topup') ||
             key.includes('/api/organizations')
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
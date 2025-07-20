/**
 * Centralized cache invalidation utilities for payment success and other critical events
 */

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
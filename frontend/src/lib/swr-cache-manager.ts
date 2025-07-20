/**
 * SWR Cache Manager - Handles real-time cache invalidation
 * This solves the cache invalidation problem by providing multiple strategies
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
 * Advanced SWR cache invalidation with multiple strategies
 */
export class SWRCacheManager {
  private static instance: SWRCacheManager
  private invalidationEvents: Set<string> = new Set()

  static getInstance(): SWRCacheManager {
    if (!SWRCacheManager.instance) {
      SWRCacheManager.instance = new SWRCacheManager()
    }
    return SWRCacheManager.instance
  }

  /**
   * Strategy 1: Pattern-based cache invalidation
   * Invalidates all SWR keys that match specific patterns
   */
  async invalidateByPatterns(categories: CacheCategory[]): Promise<void> {
    const patterns = this.generatePatterns(categories)
    
    // Invalidate keys that match any of the patterns
    await mutate(
      (key) => {
        if (typeof key !== 'string') return false
        return patterns.some(pattern => key.includes(pattern))
      },
      undefined,
      { revalidate: true }
    )
    
    console.log(`🔄 SWR: Invalidated cache for patterns:`, patterns)
  }

  /**
   * Strategy 2: Specific key invalidation
   * Targets exact SWR cache keys
   */
  async invalidateSpecificKeys(organizationId?: string): Promise<void> {
    const keysToInvalidate = [
      '/api/organizations',
      `/api/organizations?id=${organizationId}`,
      '/api/subscription',
      `/api/subscription?org=${organizationId}`,
      '/api/onboarding/progress',
      `/api/onboarding/progress?org=${organizationId}`,
      '/api/plans',
      '/api/wallet',
      `/api/wallet?org=${organizationId}`,
      '/api/transactions',
      `/api/transactions?org=${organizationId}`,
    ].filter(Boolean)

    // Invalidate each key individually
    for (const key of keysToInvalidate) {
      await mutate(key, undefined, { revalidate: true })
    }
    
    console.log(`🎯 SWR: Invalidated specific keys for org:`, organizationId)
  }

  /**
   * Strategy 3: Global cache clear (nuclear option)
   * Clears ALL SWR cache - use sparingly
   */
  async clearAllCache(): Promise<void> {
    await mutate(() => true, undefined, { revalidate: true })
    console.log(`💥 SWR: Cleared ALL cache (nuclear option)`)
  }

  /**
   * Strategy 4: Event-driven invalidation
   * Uses browser events for real-time cache invalidation
   */
  setupEventListeners(): void {
    if (typeof window === 'undefined') return

    // Listen for custom cache invalidation events
    window.addEventListener('cache-invalidation', (event: any) => {
      const { categories, organizationId } = event.detail
      this.handleCacheInvalidation(categories, organizationId)
    })

    // Listen for localStorage changes (cross-tab communication)
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith('cache_invalidate_')) {
        const data = event.newValue ? JSON.parse(event.newValue) : null
        if (data) {
          this.handleCacheInvalidation(data.categories || ['organization'], data.organizationId)
        }
      }
    })

    // Listen for window focus (refresh on tab focus)
    window.addEventListener('focus', () => {
      // Debounced refresh on focus
      clearTimeout((window as any).focusRefreshTimeout)
      ;(window as any).focusRefreshTimeout = setTimeout(() => {
        this.refreshCriticalData()
      }, 1000)
    })
  }

  /**
   * Strategy 5: Periodic refresh
   * Background refresh of critical data
   */
  setupPeriodicRefresh(): void {
    if (typeof window === 'undefined') return

    // Refresh critical data every 30 seconds
    setInterval(() => {
      this.refreshCriticalData()
    }, 30000)
  }

  /**
   * The main invalidation handler
   */
  async handleCacheInvalidation(categories: CacheCategory[], organizationId?: string): Promise<void> {
    try {
      // Use multiple strategies for maximum effectiveness
      await Promise.all([
        this.invalidateByPatterns(categories),
        this.invalidateSpecificKeys(organizationId),
      ])
    } catch (error) {
      console.error('SWR cache invalidation failed:', error)
      // Fallback to global refresh if specific invalidation fails
      setTimeout(() => {
        this.refreshCriticalData()
      }, 1000)
    }
  }

  /**
   * Refresh only the most critical data
   */
  private async refreshCriticalData(): Promise<void> {
    const criticalKeys = [
      '/api/organizations',
      '/api/subscription', 
      '/api/onboarding/progress',
      '/api/wallet'
    ]

    for (const key of criticalKeys) {
      try {
        await mutate(key, undefined, { revalidate: true })
      } catch (error) {
        console.warn(`Failed to refresh ${key}:`, error)
      }
    }
  }

  /**
   * Generate SWR key patterns from cache categories
   */
  private generatePatterns(categories: CacheCategory[]): string[] {
    const patternMap: Record<CacheCategory, string[]> = {
      subscription: ['/api/subscription', 'subscription'],
      organization: ['/api/organizations', 'organization'],
      onboarding: ['/api/onboarding', 'onboarding'],
      plans: ['/api/plans', 'plans'],
      wallet: ['/api/wallet', 'wallet'],
      transactions: ['/api/transactions', 'transaction'],
      accounts: ['/api/accounts', 'account'],
      businesses: ['/api/businesses', 'business'],
      pixels: ['/api/pixels', 'pixel']
    }

    return categories.flatMap(category => patternMap[category] || [])
  }
}

/**
 * Convenience functions for easy use
 */

// Initialize the cache manager (call this in your app root)
export function initializeSWRCacheManager(): void {
  if (typeof window !== 'undefined') {
    const manager = SWRCacheManager.getInstance()
    manager.setupEventListeners()
    manager.setupPeriodicRefresh()
    console.log('🚀 SWR Cache Manager initialized')
  }
}

// Invalidate cache for specific categories
export async function invalidateSWRCache(categories: CacheCategory[], organizationId?: string): Promise<void> {
  const manager = SWRCacheManager.getInstance()
  await manager.handleCacheInvalidation(categories, organizationId)
}

// Trigger cache invalidation via event (for cross-component communication)
export function triggerCacheInvalidation(categories: CacheCategory[], organizationId?: string): void {
  if (typeof window !== 'undefined') {
    // Method 1: Custom event
    const event = new CustomEvent('cache-invalidation', {
      detail: { categories, organizationId, timestamp: Date.now() }
    })
    window.dispatchEvent(event)

    // Method 2: localStorage (for cross-tab communication)
    const cacheData = { categories, organizationId, timestamp: Date.now() }
    localStorage.setItem(`cache_invalidate_${Date.now()}`, JSON.stringify(cacheData))
    
    // Clean up localStorage after a short time
    setTimeout(() => {
      localStorage.removeItem(`cache_invalidate_${Date.now()}`)
    }, 5000)
  }
}

// Nuclear option: clear all cache
export async function clearAllSWRCache(): Promise<void> {
  const manager = SWRCacheManager.getInstance()
  await manager.clearAllCache()
} 
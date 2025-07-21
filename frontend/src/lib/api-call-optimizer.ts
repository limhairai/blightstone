"use client"

/**
 * 🚀 API Call Optimizer - Aggressive caching and deduplication
 * Prevents excessive API calls by intelligent caching and request deduplication
 */

interface CacheEntry {
  data: any
  timestamp: number
  promise?: Promise<any>
}

class APICallOptimizer {
  private cache = new Map<string, CacheEntry>()
  private pendingRequests = new Map<string, Promise<any>>()
  
  // Aggressive cache settings
  private readonly CACHE_DURATION = 120000 // 2 minutes (increased from 30s)
  private readonly DEDUPLICATION_WINDOW = 5000 // 5 seconds for identical requests
  
  // Cleanup interval
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired cache entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 300000) // 5 minutes
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_DURATION * 2) {
        this.cache.delete(key)
      }
    }
  }

  private getCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET'
    const body = options?.body ? JSON.stringify(options.body) : ''
    const headers = options?.headers ? JSON.stringify(options.headers) : ''
    return `${method}:${url}:${body}:${headers}`
  }

  async optimizedFetch(url: string, options?: RequestInit): Promise<Response> {
    const cacheKey = this.getCacheKey(url, options)
    const now = Date.now()
    
    // Check if we have a cached response
    const cached = this.cache.get(cacheKey)
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      // Cache hit
      return Promise.resolve(new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))
    }

    // Check if there's already a pending request for this exact call
    const pendingRequest = this.pendingRequests.get(cacheKey)
    if (pendingRequest) {
      // Deduplicating request
      return pendingRequest
    }

    // Make the actual request
          // Making fresh request
    const request = fetch(url, options)
      .then(async (response) => {
        // Only cache successful responses
        if (response.ok) {
          const data = await response.clone().json()
          this.cache.set(cacheKey, {
            data,
            timestamp: now
          })
        }
        return response
      })
      .catch((error) => {
        console.error(`❌ Request failed for ${url}:`, error)
        throw error
      })
      .finally(() => {
        // Remove from pending requests
        this.pendingRequests.delete(cacheKey)
      })

    // Store the pending request
    this.pendingRequests.set(cacheKey, request)
    
    return request
  }

  // Force clear cache for specific URL patterns
  invalidateCache(urlPattern?: string) {
    if (!urlPattern) {
      this.cache.clear()
      this.pendingRequests.clear()
      return
    }
    
    for (const [key] of this.cache.entries()) {
      if (key.includes(urlPattern)) {
        this.cache.delete(key)
      }
    }
    
    for (const [key] of this.pendingRequests.entries()) {
      if (key.includes(urlPattern)) {
        this.pendingRequests.delete(key)
      }
    }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      cacheEntries: Array.from(this.cache.keys())
    }
  }

  // Cleanup on app shutdown
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
    this.pendingRequests.clear()
  }
}

// Create singleton instance
export const apiOptimizer = new APICallOptimizer()

// Enhanced fetch wrapper with aggressive optimization
export async function optimizedFetch(url: string, options?: RequestInit): Promise<Response> {
  return apiOptimizer.optimizedFetch(url, options)
}

// Utility to invalidate specific cache entries
export function invalidateApiCache(urlPattern?: string) {
  apiOptimizer.invalidateCache(urlPattern)
}

// Debug function to inspect cache
export function getApiCacheStats() {
  return apiOptimizer.getCacheStats()
} 
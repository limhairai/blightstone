/**
 * Rate Limiting Implementation
 * Protects API endpoints from abuse and DDoS attacks
 */

import { NextRequest, NextResponse } from 'next/server'

export interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: NextRequest) => string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: Date
  retryAfter?: number
}

/**
 * In-memory rate limit store (use Redis in production)
 */
class MemoryStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const data = this.store.get(key)
    if (!data) return null
    
    // Clean up expired entries
    if (Date.now() > data.resetTime) {
      this.store.delete(key)
      return null
    }
    
    return data
  }

  async set(key: string, value: { count: number; resetTime: number }): Promise<void> {
    this.store.set(key, value)
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now()
    const existing = await this.get(key)
    
    if (!existing) {
      const data = { count: 1, resetTime: now + windowMs }
      await this.set(key, data)
      return data
    }
    
    const updated = { ...existing, count: existing.count + 1 }
    await this.set(key, updated)
    return updated
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now()
    for (const [key, data] of this.store.entries()) {
      if (now > data.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

// Global store instance
const store = new MemoryStore()

// Cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => store.cleanup(), 5 * 60 * 1000)
}

/**
 * Default rate limit configurations for different endpoint types
 */
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - strict limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,            // 5 attempts per 15 minutes
  },
  
  // API endpoints - moderate limits
  api: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 100,          // 100 requests per minute
  },
  
  // Payment endpoints - very strict
  payment: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 10,           // 10 requests per minute
  },
  
  // File upload - strict limits
  upload: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 20,           // 20 uploads per minute
  },
  
  // General endpoints - relaxed
  general: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 200,          // 200 requests per minute
  }
} as const

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(req: NextRequest): string {
  // Try to get real IP from headers (for production behind proxy)
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip') // Cloudflare
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || req.ip || 'unknown'
  return `ip:${ip}`
}

/**
 * User-based key generator (for authenticated endpoints)
 */
export function userKeyGenerator(req: NextRequest): string {
  // Extract user ID from JWT token or session
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      // In a real implementation, decode the JWT token
      // For now, use a simple approach
      const token = authHeader.slice(7)
      return `user:${token.slice(0, 10)}` // Use first 10 chars as identifier
    } catch {
      // Fallback to IP if token is invalid
      return defaultKeyGenerator(req)
    }
  }
  
  return defaultKeyGenerator(req)
}

/**
 * Combined key generator (IP + User)
 */
export function combinedKeyGenerator(req: NextRequest): string {
  const ipKey = defaultKeyGenerator(req)
  const userKey = userKeyGenerator(req)
  return `${ipKey}:${userKey}`
}

/**
 * Rate limit middleware function
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const keyGenerator = config.keyGenerator || defaultKeyGenerator
  const key = keyGenerator(req)
  
  try {
    const data = await store.increment(key, config.windowMs)
    const resetTime = new Date(data.resetTime)
    
    const result: RateLimitResult = {
      success: data.count <= config.maxRequests,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - data.count),
      resetTime,
    }
    
    if (!result.success) {
      result.retryAfter = Math.ceil((data.resetTime - Date.now()) / 1000)
    }
    
    return result
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Fail open - allow request if rate limiting fails
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: new Date(Date.now() + config.windowMs),
    }
  }
}

/**
 * Create rate limit response with proper headers
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
    },
    { status: 429 }
  )
  
  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.resetTime.getTime().toString())
  
  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString())
  }
  
  return response
}

/**
 * Endpoint-specific rate limiters
 */
export const authRateLimit = (req: NextRequest) => 
  rateLimit(req, { ...RATE_LIMIT_CONFIGS.auth, keyGenerator: combinedKeyGenerator })

export const apiRateLimit = (req: NextRequest) => 
  rateLimit(req, { ...RATE_LIMIT_CONFIGS.api, keyGenerator: userKeyGenerator })

export const paymentRateLimit = (req: NextRequest) => 
  rateLimit(req, { ...RATE_LIMIT_CONFIGS.payment, keyGenerator: combinedKeyGenerator })

export const uploadRateLimit = (req: NextRequest) => 
  rateLimit(req, { ...RATE_LIMIT_CONFIGS.upload, keyGenerator: userKeyGenerator })

export const generalRateLimit = (req: NextRequest) => 
  rateLimit(req, RATE_LIMIT_CONFIGS.general)

/**
 * Check if request should be rate limited based on path
 */
export function shouldRateLimit(pathname: string): {
  shouldLimit: boolean
  config: RateLimitConfig
  limiter: (req: NextRequest) => Promise<RateLimitResult>
} {
  // Authentication endpoints
  if (pathname.includes('/auth/') || pathname.includes('/login') || pathname.includes('/register')) {
    return {
      shouldLimit: true,
      config: RATE_LIMIT_CONFIGS.auth,
      limiter: authRateLimit
    }
  }
  
  // Payment endpoints
  if (pathname.includes('/payment') || pathname.includes('/stripe')) {
    return {
      shouldLimit: true,
      config: RATE_LIMIT_CONFIGS.payment,
      limiter: paymentRateLimit
    }
  }
  
  // Upload endpoints
  if (pathname.includes('/upload') || pathname.includes('/file')) {
    return {
      shouldLimit: true,
      config: RATE_LIMIT_CONFIGS.upload,
      limiter: uploadRateLimit
    }
  }
  
  // API endpoints
  if (pathname.startsWith('/api/')) {
    return {
      shouldLimit: true,
      config: RATE_LIMIT_CONFIGS.api,
      limiter: apiRateLimit
    }
  }
  
  // General rate limiting for all other endpoints
  return {
    shouldLimit: true,
    config: RATE_LIMIT_CONFIGS.general,
    limiter: generalRateLimit
  }
} 
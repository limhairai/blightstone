'use client'

import { useEffect } from 'react'
import { initializeCacheInvalidation } from '@/lib/surgical-cache-invalidation'

/**
 * Initialize the Surgical Cache Invalidation System
 * This targets EXACT SWR keys for guaranteed cache invalidation
 */
export function CacheManagerInit() {
  useEffect(() => {
    // Initialize the surgical cache invalidation system
    initializeCacheInvalidation()
  }, [])

  return null // This component doesn't render anything
} 
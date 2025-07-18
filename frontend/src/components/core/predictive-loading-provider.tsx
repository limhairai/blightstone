"use client"

import React from 'react'
import { usePredictiveLoading, defaultPredictiveConfig } from '@/lib/predictive-loading'
import { usePerformanceMonitor } from '@/lib/performance-monitor'

interface PredictiveLoadingProviderProps {
  children: React.ReactNode
}

export function PredictiveLoadingProvider({ children }: PredictiveLoadingProviderProps) {
  // Initialize predictive loading
  const { preloadData, getPreloadedData } = usePredictiveLoading(defaultPredictiveConfig)
  
  // Initialize performance monitoring
  const { trackPreloadHit, trackPreloadMiss, trackApiCall } = usePerformanceMonitor()

  // Enhance fetch to work with predictive loading
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const originalFetch = window.fetch

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString()
      const startTime = performance.now()

      // Check if we have preloaded data
      const preloadedData = getPreloadedData(url)
      if (preloadedData) {
        trackPreloadHit()
        trackApiCall(url, startTime, true)
        
        // Return preloaded data as a Response
        return new Response(JSON.stringify(preloadedData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // No preloaded data, make actual request
      trackPreloadMiss()
      const response = await originalFetch(input, init)
      trackApiCall(url, startTime, false)
      
      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [getPreloadedData, trackPreloadHit, trackPreloadMiss, trackApiCall])

  return <>{children}</>
} 
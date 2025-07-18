"use client"

// Performance Monitor - Track 0ms goal
// Industry standards: <67ms for network, <16ms for UI, 0ms for preloaded data

import React from 'react'

interface PerformanceMetrics {
  pageLoadTime: number
  apiResponseTime: number
  uiInteractionTime: number
  preloadHitRate: number
  cacheHitRate: number
  networkLatency: number
  renderTime: number
}

interface PerformanceTarget {
  name: string
  target: number
  current: number
  status: 'excellent' | 'good' | 'warning' | 'poor'
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics = {
    pageLoadTime: 0,
    apiResponseTime: 0,
    uiInteractionTime: 0,
    preloadHitRate: 0,
    cacheHitRate: 0,
    networkLatency: 0,
    renderTime: 0
  }
  
  private apiCallTimes = new Map<string, number>()
  private preloadHits = 0
  private preloadMisses = 0
  private cacheHits = 0
  private cacheMisses = 0
  private interactionTimes: number[] = []

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Track page load performance
  trackPageLoad(): void {
    if (typeof window === 'undefined') return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          this.metrics.pageLoadTime = navEntry.loadEventEnd - (navEntry as any).navigationStart
          this.metrics.networkLatency = navEntry.responseStart - navEntry.requestStart
          this.metrics.renderTime = navEntry.domContentLoadedEventEnd - navEntry.responseEnd
        }
      })
    })

    observer.observe({ entryTypes: ['navigation'] })
  }

  // Track API response times
  trackApiCall(endpoint: string, startTime: number, fromCache: boolean = false): void {
    const duration = performance.now() - startTime
    this.apiCallTimes.set(endpoint, duration)
    
    // Update average API response time
    const times = Array.from(this.apiCallTimes.values())
    this.metrics.apiResponseTime = times.reduce((a, b) => a + b, 0) / times.length

    // Track cache hits
    if (fromCache) {
      this.cacheHits++
    } else {
      this.cacheMisses++
    }

    this.metrics.cacheHitRate = this.cacheHits / (this.cacheHits + this.cacheMisses) * 100
  }

  // Track preload effectiveness
  trackPreloadHit(): void {
    this.preloadHits++
    this.metrics.preloadHitRate = this.preloadHits / (this.preloadHits + this.preloadMisses) * 100
  }

  trackPreloadMiss(): void {
    this.preloadMisses++
    this.metrics.preloadHitRate = this.preloadHits / (this.preloadHits + this.preloadMisses) * 100
  }

  // Track UI interaction times
  trackInteraction(startTime: number): void {
    const duration = performance.now() - startTime
    this.interactionTimes.push(duration)
    
    // Keep only last 100 interactions
    if (this.interactionTimes.length > 100) {
      this.interactionTimes.shift()
    }
    
    // Calculate average
    this.metrics.uiInteractionTime = this.interactionTimes.reduce((a, b) => a + b, 0) / this.interactionTimes.length
  }

  // Get current performance targets
  getPerformanceTargets(): PerformanceTarget[] {
    return [
      {
        name: 'Page Load Time',
        target: 1000, // 1 second
        current: this.metrics.pageLoadTime,
        status: this.getStatus(this.metrics.pageLoadTime, 500, 1000, 2000)
      },
      {
        name: 'API Response Time',
        target: 67, // 67ms network limit
        current: this.metrics.apiResponseTime,
        status: this.getStatus(this.metrics.apiResponseTime, 0, 67, 200)
      },
      {
        name: 'UI Interaction Time',
        target: 16, // 60fps = 16ms per frame
        current: this.metrics.uiInteractionTime,
        status: this.getStatus(this.metrics.uiInteractionTime, 0, 16, 50)
      },
      {
        name: 'Preload Hit Rate',
        target: 90, // 90% of data should be preloaded
        current: this.metrics.preloadHitRate,
        status: this.getStatus(this.metrics.preloadHitRate, 90, 70, 50, true)
      },
      {
        name: 'Cache Hit Rate',
        target: 80, // 80% of requests should be cached
        current: this.metrics.cacheHitRate,
        status: this.getStatus(this.metrics.cacheHitRate, 80, 60, 40, true)
      },
      {
        name: 'Network Latency',
        target: 50, // 50ms network latency
        current: this.metrics.networkLatency,
        status: this.getStatus(this.metrics.networkLatency, 0, 50, 100)
      }
    ]
  }

  private getStatus(current: number, excellent: number, good: number, warning: number, higherIsBetter: boolean = false): 'excellent' | 'good' | 'warning' | 'poor' {
    if (higherIsBetter) {
      if (current >= excellent) return 'excellent'
      if (current >= good) return 'good'
      if (current >= warning) return 'warning'
      return 'poor'
    } else {
      if (current <= excellent) return 'excellent'
      if (current <= good) return 'good'
      if (current <= warning) return 'warning'
      return 'poor'
    }
  }

  // Get overall performance score
  getPerformanceScore(): number {
    const targets = this.getPerformanceTargets()
    const scores = targets.map(target => {
      switch (target.status) {
        case 'excellent': return 100
        case 'good': return 75
        case 'warning': return 50
        case 'poor': return 25
        default: return 0
      }
    })
    
    return Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
  }

  // Get recommendations for improvement
  getRecommendations(): string[] {
    const recommendations: string[] = []
    const targets = this.getPerformanceTargets()

    targets.forEach(target => {
      if (target.status === 'poor' || target.status === 'warning') {
        switch (target.name) {
          case 'Page Load Time':
            recommendations.push('Optimize bundle size and enable code splitting')
            break
          case 'API Response Time':
            recommendations.push('Implement more aggressive caching and preloading')
            break
          case 'UI Interaction Time':
            recommendations.push('Optimize React renders and use React.memo')
            break
          case 'Preload Hit Rate':
            recommendations.push('Improve predictive loading patterns')
            break
          case 'Cache Hit Rate':
            recommendations.push('Increase cache duration and implement better cache strategies')
            break
          case 'Network Latency':
            recommendations.push('Consider using a CDN or edge computing')
            break
        }
      }
    })

    return recommendations
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  // Reset metrics
  reset(): void {
    this.metrics = {
      pageLoadTime: 0,
      apiResponseTime: 0,
      uiInteractionTime: 0,
      preloadHitRate: 0,
      cacheHitRate: 0,
      networkLatency: 0,
      renderTime: 0
    }
    this.apiCallTimes.clear()
    this.preloadHits = 0
    this.preloadMisses = 0
    this.cacheHits = 0
    this.cacheMisses = 0
    this.interactionTimes = []
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const monitor = PerformanceMonitor.getInstance()

  React.useEffect(() => {
    monitor.trackPageLoad()
  }, [])

  const trackApiCall = React.useCallback((endpoint: string, startTime: number, fromCache: boolean = false) => {
    monitor.trackApiCall(endpoint, startTime, fromCache)
  }, [])

  const trackInteraction = React.useCallback((startTime: number) => {
    monitor.trackInteraction(startTime)
  }, [])

  const trackPreloadHit = React.useCallback(() => {
    monitor.trackPreloadHit()
  }, [])

  const trackPreloadMiss = React.useCallback(() => {
    monitor.trackPreloadMiss()
  }, [])

  return {
    trackApiCall,
    trackInteraction,
    trackPreloadHit,
    trackPreloadMiss,
    getMetrics: monitor.getMetrics.bind(monitor),
    getPerformanceTargets: monitor.getPerformanceTargets.bind(monitor),
    getPerformanceScore: monitor.getPerformanceScore.bind(monitor),
    getRecommendations: monitor.getRecommendations.bind(monitor),
    reset: monitor.reset.bind(monitor)
  }
}

// Performance standards for the app
export const PERFORMANCE_STANDARDS = {
  // Network performance (physical limitations)
  NETWORK_LATENCY_EXCELLENT: 0,    // Preloaded data
  NETWORK_LATENCY_GOOD: 67,        // Physical network limitation
  NETWORK_LATENCY_WARNING: 200,    // Acceptable for non-critical
  NETWORK_LATENCY_POOR: 500,       // Too slow

  // UI performance (60fps standard)
  UI_INTERACTION_EXCELLENT: 0,     // Instant feedback
  UI_INTERACTION_GOOD: 16,         // 60fps = 16ms per frame
  UI_INTERACTION_WARNING: 50,      // Noticeable delay
  UI_INTERACTION_POOR: 100,        // Sluggish

  // Preload effectiveness
  PRELOAD_HIT_RATE_TARGET: 90,     // 90% of data should be preloaded
  CACHE_HIT_RATE_TARGET: 80,       // 80% of requests should be cached

  // Page load performance
  PAGE_LOAD_EXCELLENT: 500,        // Half second
  PAGE_LOAD_GOOD: 1000,           // One second
  PAGE_LOAD_WARNING: 2000,        // Two seconds
  PAGE_LOAD_POOR: 3000,           // Three seconds
}

export default PerformanceMonitor 
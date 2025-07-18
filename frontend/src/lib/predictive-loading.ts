"use client"

// Predictive Loading System
// Preloads data before users even click to achieve 0ms feel

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { mutate } from 'swr'

interface PredictiveLoadingConfig {
  routes: {
    path: string
    preloadData: string[]
    priority: 'high' | 'medium' | 'low'
    preloadDelay?: number
  }[]
  hoverDelay: number
  mouseTrackingEnabled: boolean
}

class PredictiveLoader {
  private static instance: PredictiveLoader
  private preloadedData = new Map<string, any>()
  private preloadingPromises = new Map<string, Promise<any>>()
  private hoverTimeouts = new Map<string, NodeJS.Timeout>()
  private mousePosition = { x: 0, y: 0 }
  private lastMouseMove = 0
  
  static getInstance(): PredictiveLoader {
    if (!PredictiveLoader.instance) {
      PredictiveLoader.instance = new PredictiveLoader()
    }
    return PredictiveLoader.instance
  }

  // Preload data for a specific endpoint
  async preloadData(endpoint: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    if (this.preloadedData.has(endpoint) || this.preloadingPromises.has(endpoint)) {
      return
    }

    const token = localStorage.getItem('supabase.auth.token')
    if (!token) return

    const preloadPromise = this.fetchWithPriority(endpoint, token, priority)
    this.preloadingPromises.set(endpoint, preloadPromise)

    try {
      const data = await preloadPromise
      this.preloadedData.set(endpoint, data)
      
      // Pre-populate SWR cache
      mutate([endpoint, token], data, false)
      
      console.log(`✅ Preloaded: ${endpoint} (${priority} priority)`)
    } catch (error) {
      console.warn(`❌ Failed to preload: ${endpoint}`, error)
    } finally {
      this.preloadingPromises.delete(endpoint)
    }
  }

  // Fetch with priority-based timing
  private async fetchWithPriority(endpoint: string, token: string, priority: 'high' | 'medium' | 'low'): Promise<any> {
    // Add slight delay for lower priority requests to not block critical ones
    const delay = priority === 'high' ? 0 : priority === 'medium' ? 10 : 50
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  // Get preloaded data instantly
  getPreloadedData(endpoint: string): any | null {
    return this.preloadedData.get(endpoint) || null
  }

  // Clear preloaded data
  clearPreloadedData(endpoint?: string): void {
    if (endpoint) {
      this.preloadedData.delete(endpoint)
    } else {
      this.preloadedData.clear()
    }
  }

  // Track mouse movement for predictive loading
  trackMouseMovement(): void {
    if (typeof window === 'undefined') return

    const handleMouseMove = (e: MouseEvent) => {
      this.mousePosition = { x: e.clientX, y: e.clientY }
      this.lastMouseMove = Date.now()
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: true })
  }

  // Preload on hover with intelligent delay
  setupHoverPreloading(element: HTMLElement, endpoint: string, delay: number = 100): void {
    const handleMouseEnter = () => {
      const timeout = setTimeout(() => {
        this.preloadData(endpoint, 'high')
      }, delay)
      this.hoverTimeouts.set(endpoint, timeout)
    }

    const handleMouseLeave = () => {
      const timeout = this.hoverTimeouts.get(endpoint)
      if (timeout) {
        clearTimeout(timeout)
        this.hoverTimeouts.delete(endpoint)
      }
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)
  }

  // Preload based on user patterns
  preloadUserJourney(currentPath: string): void {
    const journeyMap: Record<string, string[]> = {
      '/dashboard': [
        '/api/ad-accounts',
        '/api/business-managers',
        '/api/transactions',
        '/api/organizations'
      ],
      '/dashboard/wallet': [
        '/api/transactions',
        '/api/topup-requests',
        '/api/subscriptions/current'
      ],
      '/dashboard/applications': [
        '/api/applications',
        '/api/business-managers'
      ],
      '/admin': [
        '/api/admin/applications',
        '/api/admin/organizations',
        '/api/admin/support'
      ],
      '/admin/applications': [
        '/api/admin/applications?status=pending,processing',
        '/api/admin/applications/history'
      ]
    }

    const preloadEndpoints = journeyMap[currentPath] || []
    preloadEndpoints.forEach((endpoint, index) => {
      // Stagger preloading to avoid overwhelming the server
      setTimeout(() => {
        this.preloadData(endpoint, index === 0 ? 'high' : 'medium')
      }, index * 50)
    })
  }

  // Preload likely next pages based on current page
  preloadLikelyNextPages(currentPath: string): void {
    const nextPageMap: Record<string, string[]> = {
      '/dashboard': [
        '/dashboard/wallet',
        '/dashboard/applications',
        '/dashboard/settings'
      ],
      '/dashboard/wallet': [
        '/dashboard/topup-requests',
        '/dashboard'
      ],
      '/admin': [
        '/admin/applications',
        '/admin/support',
        '/admin/organizations'
      ],
      '/admin/applications': [
        '/admin/applications/history',
        '/admin/support'
      ]
    }

    const nextPages = nextPageMap[currentPath] || []
    nextPages.forEach((page, index) => {
      // Preload the route
      setTimeout(() => {
        const router = document.createElement('link')
        router.rel = 'prefetch'
        router.href = page
        document.head.appendChild(router)
      }, index * 100)
    })
  }
}

// React hook for predictive loading
export const usePredictiveLoading = (config: PredictiveLoadingConfig) => {
  const router = useRouter()
  const loader = PredictiveLoader.getInstance()
  const currentPath = useRef<string>('')

  useEffect(() => {
    // Initialize mouse tracking
    if (config.mouseTrackingEnabled) {
      loader.trackMouseMovement()
    }

    // Get current path
    currentPath.current = window.location.pathname

    // Preload data for current route
    const currentRoute = config.routes.find(route => 
      currentPath.current.startsWith(route.path)
    )

    if (currentRoute) {
      // Preload data for current route
      currentRoute.preloadData.forEach((endpoint, index) => {
        setTimeout(() => {
          loader.preloadData(endpoint, currentRoute.priority)
        }, (currentRoute.preloadDelay || 0) + (index * 25))
      })

      // Preload likely user journey
      setTimeout(() => {
        loader.preloadUserJourney(currentPath.current)
      }, 500)

      // Preload likely next pages
      setTimeout(() => {
        loader.preloadLikelyNextPages(currentPath.current)
      }, 1000)
    }
  }, [config])

  const preloadOnHover = useCallback((element: HTMLElement, endpoint: string) => {
    loader.setupHoverPreloading(element, endpoint, config.hoverDelay)
  }, [config.hoverDelay])

  const getPreloadedData = useCallback((endpoint: string) => {
    return loader.getPreloadedData(endpoint)
  }, [])

  const preloadData = useCallback((endpoint: string, priority: 'high' | 'medium' | 'low' = 'medium') => {
    return loader.preloadData(endpoint, priority)
  }, [])

  return {
    preloadOnHover,
    getPreloadedData,
    preloadData,
    clearPreloadedData: loader.clearPreloadedData.bind(loader)
  }
}

// Default configuration for the app
export const defaultPredictiveConfig: PredictiveLoadingConfig = {
  routes: [
    {
      path: '/dashboard',
      preloadData: [
        '/api/ad-accounts',
        '/api/business-managers',
        '/api/organizations',
        '/api/transactions'
      ],
      priority: 'high',
      preloadDelay: 0
    },
    {
      path: '/dashboard/wallet',
      preloadData: [
        '/api/transactions',
        '/api/topup-requests',
        '/api/subscriptions/current'
      ],
      priority: 'high',
      preloadDelay: 0
    },
    {
      path: '/dashboard/applications',
      preloadData: [
        '/api/applications',
        '/api/business-managers'
      ],
      priority: 'high',
      preloadDelay: 0
    },
    {
      path: '/admin',
      preloadData: [
        '/api/admin/applications?status=pending,processing',
        '/api/admin/organizations',
        '/api/admin/support'
      ],
      priority: 'high',
      preloadDelay: 0
    },
    {
      path: '/admin/applications',
      preloadData: [
        '/api/admin/applications?status=pending,processing',
        '/api/admin/applications/history'
      ],
      priority: 'high',
      preloadDelay: 0
    }
  ],
  hoverDelay: 100,
  mouseTrackingEnabled: true
}

export default PredictiveLoader 
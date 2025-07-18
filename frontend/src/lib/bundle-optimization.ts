import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// Simple, webpack-friendly preloading system
export class SimplePreloader {
  private static instance: SimplePreloader
  private preloadedRoutes = new Set<string>()
  private linkElements = new Map<string, HTMLLinkElement>()

  static getInstance(): SimplePreloader {
    if (!SimplePreloader.instance) {
      SimplePreloader.instance = new SimplePreloader()
    }
    return SimplePreloader.instance
  }

  // Preload route using link prefetch
  preloadRoute(route: string): void {
    if (this.preloadedRoutes.has(route)) return

    // Create prefetch link element
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = route
    link.as = 'document'
    
    document.head.appendChild(link)
    this.linkElements.set(route, link)
    this.preloadedRoutes.add(route)
  }

  // Preload multiple routes
  preloadRoutes(routes: string[]): void {
    routes.forEach(route => this.preloadRoute(route))
  }

  // Check if route is preloaded
  isRoutePreloaded(route: string): boolean {
    return this.preloadedRoutes.has(route)
  }

  // Clean up preload links
  cleanup(): void {
    this.linkElements.forEach(link => {
      if (link.parentNode) {
        link.parentNode.removeChild(link)
      }
    })
    this.linkElements.clear()
    this.preloadedRoutes.clear()
  }
}

// Hook for simple preloading
export function useSimplePreloading() {
  const preloader = SimplePreloader.getInstance()

  useEffect(() => {
    // Preload critical routes
    const criticalRoutes = [
      '/dashboard',
      '/dashboard/wallet',
      '/dashboard/settings',
      '/admin',
      '/admin/applications',
      '/admin/support'
    ]
    
    // Preload after initial render
    requestIdleCallback(() => {
      preloader.preloadRoutes(criticalRoutes)
    })

    return () => {
      // Cleanup on unmount
      preloader.cleanup()
    }
  }, [preloader])

  const preloadRoute = useCallback((route: string) => {
    preloader.preloadRoute(route)
  }, [preloader])

  return { preloadRoute }
}

// Intersection observer for predictive loading
export function usePredictiveLoading() {
  const { preloadRoute } = useSimplePreloading()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const route = entry.target.getAttribute('data-preload-route')
            if (route) {
              preloadRoute(route)
            }
          }
        })
      },
      { rootMargin: '50px' }
    )

    // Observe all elements with data-preload-route
    const elements = document.querySelectorAll('[data-preload-route]')
    elements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [preloadRoute])
}

// Export for backward compatibility
export const BundleOptimizer = SimplePreloader
export const useAggressivePreloading = useSimplePreloading 
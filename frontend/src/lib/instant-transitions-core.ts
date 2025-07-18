import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

// Instant transition system for Framer-like smoothness
export class InstantTransitions {
  private static instance: InstantTransitions
  private pendingTransitions = new Set<string>()
  private preloadedRoutes = new Map<string, boolean>()
  private transitionCallbacks = new Map<string, () => void>()

  static getInstance(): InstantTransitions {
    if (!InstantTransitions.instance) {
      InstantTransitions.instance = new InstantTransitions()
    }
    return InstantTransitions.instance
  }

  // Preload route for instant navigation
  preloadRoute(route: string): void {
    if (this.preloadedRoutes.has(route)) return
    
    this.preloadedRoutes.set(route, true)
    
    // Simple route preloading - just mark as preloaded
    // The actual preloading will be handled by the useInstantNavigation hook
    // using the Next.js router.prefetch method
  }

  // Start transition with immediate UI feedback
  startTransition(route: string, callback?: () => void): void {
    this.pendingTransitions.add(route)
    if (callback) {
      this.transitionCallbacks.set(route, callback)
    }
    
    // Immediate UI feedback
    document.body.style.cursor = 'wait'
    
    // Add loading class for instant feedback
    document.body.classList.add('route-transitioning')
  }

  // Complete transition
  completeTransition(route: string): void {
    this.pendingTransitions.delete(route)
    
    const callback = this.transitionCallbacks.get(route)
    if (callback) {
      callback()
      this.transitionCallbacks.delete(route)
    }
    
    // Remove loading indicators
    document.body.style.cursor = 'default'
    document.body.classList.remove('route-transitioning')
  }

  // Check if route is transitioning
  isTransitioning(route: string): boolean {
    return this.pendingTransitions.has(route)
  }
}

// Hook for instant navigation
export function useInstantNavigation() {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const transitions = InstantTransitions.getInstance()

  const navigateInstantly = useCallback((route: string) => {
    setIsTransitioning(true)
    
    // Start transition immediately
    transitions.startTransition(route, () => {
      setIsTransitioning(false)
    })
    
    // Preload if not already preloaded
    transitions.preloadRoute(route)
    router.prefetch(route)
    
    // Navigate with optimistic UI
    requestAnimationFrame(() => {
      router.push(route)
      // Complete transition after navigation
      setTimeout(() => {
        transitions.completeTransition(route)
      }, 50)
    })
  }, [router, transitions])

  const preloadRoute = useCallback((route: string) => {
    transitions.preloadRoute(route)
    // Also prefetch using Next.js router for actual preloading
    router.prefetch(route)
  }, [transitions, router])

  return {
    navigateInstantly,
    preloadRoute,
    isTransitioning
  }
}

// Hook for hover-based preloading
export function useHoverPreload() {
  const router = useRouter()
  const transitions = InstantTransitions.getInstance()

  const handleMouseEnter = useCallback((route: string) => {
    transitions.preloadRoute(route)
    router.prefetch(route)
  }, [transitions, router])

  return { handleMouseEnter }
}

// Optimistic loading states
export function useOptimisticLoading() {
  const [optimisticStates, setOptimisticStates] = useState<Record<string, boolean>>({})

  const setOptimisticLoading = useCallback((key: string, loading: boolean) => {
    setOptimisticStates(prev => ({
      ...prev,
      [key]: loading
    }))
  }, [])

  const isOptimisticallyLoading = useCallback((key: string) => {
    return optimisticStates[key] || false
  }, [optimisticStates])

  return {
    setOptimisticLoading,
    isOptimisticallyLoading
  }
} 
import { useState, useEffect, useRef, ComponentType } from 'react'

interface LazyComponentOptions {
  delay?: number // Delay before loading (ms)
  preload?: boolean // Whether to preload in background
  priority?: 'low' | 'normal' | 'high'
  viewport?: boolean // Load when component enters viewport
}

export function useLazyComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: LazyComponentOptions = {}
) {
  const {
    delay = 0,
    preload = false,
    priority = 'normal',
    viewport = false
  } = options

  const [Component, setComponent] = useState<ComponentType<T> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const elementRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  const loadComponent = async () => {
    if (loadingRef.current || Component) return
    
    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      // Use requestIdleCallback for low priority loading
      if (priority === 'low' && 'requestIdleCallback' in window) {
        await new Promise(resolve => {
          window.requestIdleCallback(resolve)
        })
      }

      const module = await importFn()
      setComponent(() => module.default)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load component'))
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  // Viewport observer for lazy loading
  useEffect(() => {
    if (!viewport || Component) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadComponent()
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [viewport, Component])

  // Delayed loading
  useEffect(() => {
    if (viewport || Component) return

    if (preload || delay === 0) {
      loadComponent()
    } else if (delay > 0) {
      const timer = setTimeout(loadComponent, delay)
      return () => clearTimeout(timer)
    }
  }, [delay, preload, viewport, Component])

  return {
    Component,
    loading,
    error,
    elementRef,
    forceLoad: loadComponent
  }
}

// Specialized hooks for common use cases
export function useLazyChart(importFn: () => Promise<any>, visible = true) {
  return useLazyComponent(importFn, {
    delay: visible ? 500 : 2000,
    priority: 'low',
    preload: false
  })
}

export function useLazyTable(importFn: () => Promise<any>, priority: 'low' | 'normal' = 'normal') {
  return useLazyComponent(importFn, {
    delay: priority === 'low' ? 1000 : 200,
    priority,
    viewport: true
  })
}

export function useLazyModal(importFn: () => Promise<any>) {
  return useLazyComponent(importFn, {
    delay: 0, // Load immediately when needed
    priority: 'high',
    preload: false
  })
}

// Background preloader for admin components
export function useAdminComponentPreloader() {
  useEffect(() => {
    // Preload heavy admin components in the background after 3 seconds
    const timer = setTimeout(() => {
      // Preload existing admin components
      import('@/components/admin/admin-data-table').catch(() => {})
      
      // Note: Other components will be added as they are created
      // import('@/components/admin/admin-applications-table').catch(() => {})
      // import('@/components/admin/admin-organizations-table').catch(() => {})
      // import('@/components/admin/admin-transactions-table').catch(() => {})
      // import('@/components/admin/admin-analytics-charts').catch(() => {})
      // import('@/components/dashboard/advanced-charts').catch(() => {})
      // import('@/components/dashboard/detailed-tables').catch(() => {})
    }, 3000)

    return () => clearTimeout(timer)
  }, [])
} 
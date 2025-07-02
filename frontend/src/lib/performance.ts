// Performance optimization utilities

import React, { useCallback, useMemo, useRef } from 'react'

// Debounce hook for search inputs
export function useDebounce<T extends any[]>(
  callback: (...args: T) => void,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  return useCallback((...args: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay])
}

// Throttle hook for scroll events
export function useThrottle<T extends any[]>(
  callback: (...args: T) => void,
  delay: number
) {
  const lastRun = useRef(Date.now())
  
  return useCallback((...args: T) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args)
      lastRun.current = Date.now()
    }
  }, [callback, delay])
}

// Memoized component wrapper for expensive computations
export function useMemoizedComponent<T>(
  component: React.ComponentType<T>,
  props: T,
  deps: React.DependencyList
) {
  return useMemo(() => {
    return React.createElement(component as any, props)
  }, deps)
}

// Intersection observer hook for lazy loading
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) {
  const observerRef = useRef<IntersectionObserver>()
  
  const observe = useCallback((element: Element) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
    
    observerRef.current = new IntersectionObserver(callback, options)
    observerRef.current.observe(element)
  }, [callback, options])
  
  const disconnect = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
  }, [])
  
  return { observe, disconnect }
}

// Performance monitoring
export const performance = {
  mark: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(name)
    }
  },
  
  measure: (name: string, startMark: string, endMark?: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.measure(name, startMark, endMark)
      const measure = window.performance.getEntriesByName(name)[0]
      return measure?.duration || 0
    }
    return 0
  },
  
  clearMarks: () => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.clearMarks()
      window.performance.clearMeasures()
    }
  }
}

// Bundle size analyzer (development only)
export const bundleAnalyzer = {
  logComponentSize: (componentName: string, component: any) => {
    if (process.env.NODE_ENV === 'development') {
      const size = JSON.stringify(component).length
      console.log(`📦 ${componentName} size: ${(size / 1024).toFixed(2)}KB`)
    }
  }
}

// Memory usage monitor
export const memoryMonitor = {
  getUsage: () => {
    if (typeof window !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
      }
    }
    return null
  },
  
  logUsage: (label: string) => {
    const usage = memoryMonitor.getUsage()
    if (usage && process.env.NODE_ENV === 'development') {
      console.log(`🧠 ${label} - Memory: ${usage.used}MB / ${usage.total}MB (limit: ${usage.limit}MB)`)
    }
  }
} 
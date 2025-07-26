// Instant Performance Optimization System
// Makes every interaction feel like 0ms delay

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

// Preload critical resources immediately
const preloadCriticalResources = () => {
  // Preload critical fonts
  const fontLinks = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'
  ]
  
  fontLinks.forEach(href => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'style'
    link.href = href
    document.head.appendChild(link)
  })

  // Preload critical images
  const criticalImages = [
    '/adhub-icon.png',
    '/adhub-logo-placeholder.png'
  ]
  
  criticalImages.forEach(src => {
    const img = new Image()
    img.src = src
  })
}

// Instant navigation with prefetching
export const useInstantNavigation = () => {
  const router = useRouter()
  const prefetchedRoutes = useRef(new Set<string>())

  const prefetchRoute = useCallback((route: string) => {
    if (prefetchedRoutes.current.has(route)) return
    
    // Prefetch the route
    router.prefetch(route)
    prefetchedRoutes.current.add(route)
  }, [router])

  const navigateInstantly = useCallback((route: string) => {
    // Use replace for instant navigation without history
    router.replace(route)
  }, [router])

  return { prefetchRoute, navigateInstantly }
}

// Instant UI updates with optimistic rendering
export const useOptimisticUI = () => {
  const optimisticUpdates = useRef(new Map())

  const applyOptimisticUpdate = useCallback((key: string, update: any) => {
    optimisticUpdates.current.set(key, update)
    return () => optimisticUpdates.current.delete(key)
  }, [])

  const getOptimisticValue = useCallback((key: string) => {
    return optimisticUpdates.current.get(key)
  }, [])

  return { applyOptimisticUpdate, getOptimisticValue }
}

// ✅ FIXED: Instant form submissions with proper cleanup
export const useInstantForms = () => {
  const formRefs = useRef(new Map())

  const registerForm = useCallback((id: string, ref: any) => {
    formRefs.current.set(id, ref)
  }, [])

  const submitInstantly = useCallback((id: string) => {
    const form = formRefs.current.get(id)
    if (form) {
      // Show immediate feedback
      form.classList.add('submitting')
      // Submit in background
      setTimeout(() => form.submit(), 0)
    }
  }, [])

  // ✅ FIXED: Cleanup form refs on unmount
  useEffect(() => {
    return () => {
      formRefs.current.clear()
    }
  }, [])

  return { registerForm, submitInstantly }
}

// Instant data loading with aggressive caching
export const useInstantData = () => {
  const dataCache = useRef(new Map())
  const loadingStates = useRef(new Map())

  const getCachedData = useCallback((key: string) => {
    return dataCache.current.get(key)
  }, [])

  const setCachedData = useCallback((key: string, data: any) => {
    dataCache.current.set(key, data)
  }, [])

  const setLoadingState = useCallback((key: string, loading: boolean) => {
    loadingStates.current.set(key, loading)
  }, [])

  const isDataLoading = useCallback((key: string) => {
    return loadingStates.current.get(key) || false
  }, [])

  return { getCachedData, setCachedData, setLoadingState, isDataLoading }
}

// Instant animations with GPU acceleration
export const useInstantAnimations = () => {
  const animateInstantly = useCallback((element: HTMLElement, animation: string) => {
    element.style.transform = 'translateZ(0)' // Force GPU acceleration
    element.style.willChange = 'transform, opacity'
    
    // Apply instant animation
    element.classList.add(animation)
    
    // Clean up after animation
    setTimeout(() => {
      element.style.willChange = 'auto'
    }, 300)
  }, [])

  return { animateInstantly }
}

// Instant feedback system
export const useInstantFeedback = () => {
  const showInstantFeedback = useCallback((type: 'success' | 'error' | 'loading', message: string) => {
    // Create instant feedback element
    const feedback = document.createElement('div')
    feedback.className = `instant-feedback ${type}`
    feedback.textContent = message
    
    // Position and show
    feedback.style.position = 'fixed'
    feedback.style.top = '20px'
    feedback.style.right = '20px'
    feedback.style.zIndex = '9999'
    feedback.style.transform = 'translateZ(0)'
    
    document.body.appendChild(feedback)
    
    // Remove after delay
    setTimeout(() => {
      document.body.removeChild(feedback)
    }, 3000)
  }, [])

  return { showInstantFeedback }
}

// Initialize instant performance optimizations
export const initializeInstantPerformance = () => {
  // Preload critical resources
  preloadCriticalResources()
  
  // Optimize scroll performance
  document.documentElement.style.scrollBehavior = 'auto'
  
  // Disable smooth scrolling for instant feel
  document.documentElement.style.scrollBehavior = 'auto'
  
  // Optimize CSS animations
  const style = document.createElement('style')
  style.textContent = `
    * {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .instant-feedback {
      background: hsl(var(--background));
      border: 1px solid hsl(var(--border));
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.2s ease-out;
    }
    
    .instant-feedback.success {
      border-color: hsl(var(--success));
      color: hsl(var(--success));
    }
    
    .instant-feedback.error {
      border-color: hsl(var(--destructive));
      color: hsl(var(--destructive));
    }
    
    .instant-feedback.loading {
      border-color: hsl(var(--muted-foreground));
      color: hsl(var(--muted-foreground));
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(100%) translateZ(0);
        opacity: 0;
      }
      to {
        transform: translateX(0) translateZ(0);
        opacity: 1;
      }
    }
    
    .submitting {
      opacity: 0.7;
      pointer-events: none;
    }
    
    .instant-click {
      transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .instant-click:active {
      transform: scale(0.98) translateZ(0);
    }
  `
  document.head.appendChild(style)
}

// Hook for instant performance
export const useInstantPerformance = () => {
  useEffect(() => {
    initializeInstantPerformance()
  }, [])

  const instantNavigation = useInstantNavigation()
  const optimisticUI = useOptimisticUI()
  const instantForms = useInstantForms()
  const instantData = useInstantData()
  const instantAnimations = useInstantAnimations()
  const instantFeedback = useInstantFeedback()

  return {
    ...instantNavigation,
    ...optimisticUI,
    ...instantForms,
    ...instantData,
    ...instantAnimations,
    ...instantFeedback
  }
} 
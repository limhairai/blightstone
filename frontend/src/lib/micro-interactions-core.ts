import { useCallback, useEffect, useRef, useState } from 'react'

// Micro-interactions for native-like feel
export class MicroInteractions {
  private static instance: MicroInteractions
  private hapticSupported = false

  static getInstance(): MicroInteractions {
    if (!MicroInteractions.instance) {
      MicroInteractions.instance = new MicroInteractions()
    }
    return MicroInteractions.instance
  }

  constructor() {
    // Check for haptic feedback support
    this.hapticSupported = 'vibrate' in navigator
  }

  // Haptic feedback for different interaction types
  hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light'): void {
    if (!this.hapticSupported) return

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [20, 100, 20, 100, 20]
    }

    navigator.vibrate(patterns[type])
  }

  // Smooth scale animation
  scaleAnimation(element: HTMLElement, scale: number = 0.95, duration: number = 100): void {
    element.style.transform = `scale(${scale})`
    element.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`
    
    setTimeout(() => {
      element.style.transform = 'scale(1)'
    }, duration)
  }

  // Ripple effect
  createRipple(element: HTMLElement, event: MouseEvent): void {
    const rect = element.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    const ripple = document.createElement('div')
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      transform: scale(0);
      animation: ripple 0.6s linear;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      pointer-events: none;
    `

    // Add ripple keyframes if not already added
    if (!document.querySelector('#ripple-styles')) {
      const style = document.createElement('style')
      style.id = 'ripple-styles'
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(2);
            opacity: 0;
          }
        }
      `
      document.head.appendChild(style)
    }

    element.style.position = 'relative'
    element.style.overflow = 'hidden'
    element.appendChild(ripple)

    setTimeout(() => {
      ripple.remove()
    }, 600)
  }
}

// Hook for button interactions
export function useButtonInteractions() {
  const interactions = MicroInteractions.getInstance()

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const element = event.currentTarget
    interactions.scaleAnimation(element, 0.95, 100)
    interactions.hapticFeedback('light')
  }, [interactions])

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    interactions.createRipple(event.currentTarget, event.nativeEvent)
  }, [interactions])

  return { handleMouseDown, handleClick }
}

// Hook for smooth hover effects
export function useHoverEffects() {
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  return {
    isHovered,
    handleMouseEnter,
    handleMouseLeave,
    hoverProps: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    }
  }
}

// Hook for smooth loading states
export function useLoadingAnimation() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const startLoading = useCallback(() => {
    setIsLoading(true)
    setProgress(0)
    
    // Simulate smooth progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + Math.random() * 10
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const completeLoading = useCallback(() => {
    setProgress(100)
    setTimeout(() => {
      setIsLoading(false)
      setProgress(0)
    }, 200)
  }, [])

  return {
    isLoading,
    progress,
    startLoading,
    completeLoading
  }
}

// Hook for smooth scroll animations
export function useSmoothScroll() {
  const scrollToElement = useCallback((elementId: string, offset: number = 0) => {
    const element = document.getElementById(elementId)
    if (!element) return

    const elementPosition = element.offsetTop - offset
    
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    })
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [])

  return { scrollToElement, scrollToTop }
}

// Intersection observer for scroll-triggered animations
export function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
} 
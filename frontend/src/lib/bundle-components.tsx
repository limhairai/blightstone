import { useEffect, useCallback } from 'react'
import { useAggressivePreloading } from './bundle-optimization'

// Component for preloading on hover
export function PreloadOnHover({ 
  route, 
  children, 
  className = "" 
}: { 
  route: string
  children: React.ReactNode
  className?: string 
}) {
  const { preloadRoute } = useAggressivePreloading()

  const handleMouseEnter = useCallback(() => {
    preloadRoute(route)
  }, [route, preloadRoute])

  return (
    <div 
      className={className}
      onMouseEnter={handleMouseEnter}
    >
      {children}
    </div>
  )
}

// Resource hints for faster loading
export function ResourceHints() {
  useEffect(() => {
    // Add resource hints for critical assets
    const hints = [
      { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: '//api.stripe.com' },
      { rel: 'preconnect', href: '//fonts.gstatic.com' },
      { rel: 'modulepreload', href: '/_next/static/chunks/main.js' },
    ]

    hints.forEach(hint => {
      const link = document.createElement('link')
      link.rel = hint.rel
      link.href = hint.href
      if (hint.rel === 'preconnect') {
        link.crossOrigin = 'anonymous'
      }
      document.head.appendChild(link)
    })
  }, [])

  return null
}

// Critical CSS inlining
export function CriticalCSS() {
  useEffect(() => {
    // Inline critical CSS for instant rendering
    const criticalStyles = `
      .route-transitioning {
        pointer-events: none;
      }
      
      .route-transitioning * {
        cursor: wait !important;
      }
      
      .instant-feedback {
        transform: scale(0.98);
        transition: transform 0.1s ease-out;
      }
      
      .instant-feedback:active {
        transform: scale(0.95);
      }
    `

    const styleSheet = document.createElement('style')
    styleSheet.textContent = criticalStyles
    document.head.appendChild(styleSheet)

    return () => {
      document.head.removeChild(styleSheet)
    }
  }, [])

  return null
} 
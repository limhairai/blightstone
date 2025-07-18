import { useEffect, useState } from 'react'

// Skeleton loading component for instant feedback
export function SkeletonLoader({ 
  className = "",
  lines = 3,
  height = "h-4",
  spacing = "space-y-2"
}: {
  className?: string
  lines?: number
  height?: string
  spacing?: string
}) {
  return (
    <div className={`animate-pulse ${spacing} ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={`bg-gray-200 dark:bg-gray-700 rounded ${height} ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

// Page transition wrapper
export function PageTransition({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Immediate visibility for instant feel
    setIsVisible(true)
  }, [])

  return (
    <div 
      className={`transition-all duration-150 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
      } ${className}`}
    >
      {children}
    </div>
  )
} 
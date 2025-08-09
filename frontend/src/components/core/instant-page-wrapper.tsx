"use client"

import { ReactNode, useEffect, useState } from 'react'
import { Skeleton } from '../ui/skeleton'

interface InstantPageWrapperProps {
  children: ReactNode
  isLoading?: boolean
  fallback?: ReactNode
  prefetchKey?: string
  className?: string
}

/**
 * Wrapper component that overrides loading states for instant page loads
 * Uses localStorage to track if data has been prefetched
 */
export function InstantPageWrapper({ 
  children, 
  isLoading = false, 
  fallback,
  prefetchKey,
  className = ""
}: InstantPageWrapperProps) {
  const [showInstantContent, setShowInstantContent] = useState(false)
  const [hasCheckedPrefetch, setHasCheckedPrefetch] = useState(false)

  useEffect(() => {
    // Check if data has been prefetched
    const checkPrefetchStatus = () => {
      if (prefetchKey) {
        // Check if this specific data type was prefetched
        const prefetchTimestamp = localStorage.getItem(`blightstone_prefetch_${prefetchKey}`)
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
        
        if (prefetchTimestamp && parseInt(prefetchTimestamp) > fiveMinutesAgo) {
          // Data was recently prefetched, show content instantly
          setShowInstantContent(true)
        }
      } else {
        // No specific prefetch key, check general prefetch status
        const generalPrefetch = localStorage.getItem('blightstone_global_prefetch_complete')
        if (generalPrefetch) {
          setShowInstantContent(true)
        }
      }
      
      setHasCheckedPrefetch(true)
    }

    // Small delay to ensure prefetch check doesn't block rendering
    const timer = setTimeout(checkPrefetchStatus, 10)
    return () => clearTimeout(timer)
  }, [prefetchKey])

  // Store prefetch completion status
  useEffect(() => {
    if (!isLoading && hasCheckedPrefetch) {
      // Mark this data as available
      if (prefetchKey) {
        localStorage.setItem(`blightstone_prefetch_${prefetchKey}`, Date.now().toString())
      }
    }
  }, [isLoading, hasCheckedPrefetch, prefetchKey])

  // If data is prefetched, show content immediately regardless of loading state
  if (showInstantContent) {
    return <div className={className}>{children}</div>
  }

  // If still loading and no prefetch data, show fallback or skeleton
  if (isLoading && !showInstantContent) {
    return (
      <div className={className}>
        {fallback || <InstantPageSkeleton />}
      </div>
    )
  }

  // Default case - show content
  return <div className={className}>{children}</div>
}

/**
 * Default skeleton for instant page loading
 */
function InstantPageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-full" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}

/**
 * Hook to mark global prefetch as complete
 */
export function useMarkPrefetchComplete() {
  const markComplete = () => {
    localStorage.setItem('blightstone_global_prefetch_complete', Date.now().toString())
    console.log('🎯 Global prefetch marked as complete - future page loads will be instant!')
  }

  return markComplete
} 
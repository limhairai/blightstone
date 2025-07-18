import { useEffect, useState, useRef, useCallback, useMemo } from 'react'

// Virtual scrolling for 60fps performance on large lists
export interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
  scrollingDelay?: number
}

export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 5, scrollingDelay = 150 } = options
  
  const [scrollTop, setScrollTop] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollElementRef = useRef<HTMLDivElement>(null)
  const scrollingTimeoutRef = useRef<NodeJS.Timeout>()

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight)
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    )

    const start = Math.max(0, visibleStart - overscan)
    const end = Math.min(items.length - 1, visibleEnd + overscan)

    return { start, end }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => ({
      item,
      index: visibleRange.start + index
    }))
  }, [items, visibleRange])

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    setScrollTop(scrollTop)
    
    if (!isScrolling) {
      setIsScrolling(true)
    }

    // Clear existing timeout
    if (scrollingTimeoutRef.current) {
      clearTimeout(scrollingTimeoutRef.current)
    }

    // Set scrolling to false after delay
    scrollingTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, scrollingDelay)
  }, [isScrolling, scrollingDelay])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current)
      }
    }
  }, [])

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.start * itemHeight

  return {
    visibleItems,
    totalHeight,
    offsetY,
    isScrolling,
    scrollElementRef,
    handleScroll,
    scrollToIndex: (index: number) => {
      if (scrollElementRef.current) {
        scrollElementRef.current.scrollTop = index * itemHeight
      }
    }
  }
}

// Virtual list component
export function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  className = "",
  overscan = 5,
  scrollingDelay = 150
}: {
  items: T[]
  itemHeight: number
  height: number
  renderItem: (item: T, index: number, isScrolling: boolean) => React.ReactNode
  className?: string
  overscan?: number
  scrollingDelay?: number
}) {
  const {
    visibleItems,
    totalHeight,
    offsetY,
    isScrolling,
    scrollElementRef,
    handleScroll
  } = useVirtualScroll(items, {
    itemHeight,
    containerHeight: height,
    overscan,
    scrollingDelay
  })

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div
              key={index}
              style={{
                height: itemHeight,
                position: 'relative'
              }}
            >
              {renderItem(item, index, isScrolling)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Hook for smooth scrolling within virtual lists
export function useVirtualScrollTo() {
  const scrollToIndex = useCallback((
    container: HTMLElement,
    index: number,
    itemHeight: number,
    behavior: ScrollBehavior = 'smooth'
  ) => {
    const targetScrollTop = index * itemHeight
    container.scrollTo({
      top: targetScrollTop,
      behavior
    })
  }, [])

  const scrollToTop = useCallback((
    container: HTMLElement,
    behavior: ScrollBehavior = 'smooth'
  ) => {
    container.scrollTo({
      top: 0,
      behavior
    })
  }, [])

  return { scrollToIndex, scrollToTop }
}

// Optimized table with virtual scrolling
export function VirtualTable<T>({
  data,
  columns,
  rowHeight = 60,
  height = 400,
  className = "",
  headerHeight = 50
}: {
  data: T[]
  columns: Array<{
    key: string
    header: string
    width?: string
    render?: (item: T, index: number) => React.ReactNode
  }>
  rowHeight?: number
  height?: number
  className?: string
  headerHeight?: number
}) {
  const containerHeight = height - headerHeight

  const {
    visibleItems,
    totalHeight,
    offsetY,
    isScrolling,
    scrollElementRef,
    handleScroll
  } = useVirtualScroll(data, {
    itemHeight: rowHeight,
    containerHeight,
    overscan: 3
  })

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div
        className="bg-gray-50 dark:bg-gray-800 border-b"
        style={{ height: headerHeight }}
      >
        <div className="flex items-center h-full px-4">
          {columns.map((column, index) => (
            <div
              key={column.key}
              className={`font-medium text-sm text-gray-600 dark:text-gray-300 ${
                index === 0 ? 'flex-1' : ''
              }`}
              style={{ width: column.width }}
            >
              {column.header}
            </div>
          ))}
        </div>
      </div>

      {/* Virtual scrolling body */}
      <div
        ref={scrollElementRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {visibleItems.map(({ item, index }) => (
              <div
                key={index}
                className="flex items-center px-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                style={{ height: rowHeight }}
              >
                {columns.map((column, colIndex) => (
                  <div
                    key={column.key}
                    className={`text-sm ${colIndex === 0 ? 'flex-1' : ''}`}
                    style={{ width: column.width }}
                  >
                    {column.render ? column.render(item, index) : (item as any)[column.key]}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Infinite scroll with virtual scrolling
export function useInfiniteVirtualScroll<T>(
  fetchMore: (offset: number, limit: number) => Promise<T[]>,
  options: VirtualScrollOptions & {
    initialItems?: T[]
    threshold?: number
    pageSize?: number
  }
) {
  const { initialItems = [], threshold = 5, pageSize = 50 } = options
  const [items, setItems] = useState<T[]>(initialItems)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const virtualScroll = useVirtualScroll(items, options)

  // Load more items when near the end
  useEffect(() => {
    const { visibleItems } = virtualScroll
    const lastVisibleIndex = visibleItems[visibleItems.length - 1]?.index || 0
    
    if (
      !isLoading &&
      hasMore &&
      lastVisibleIndex >= items.length - threshold
    ) {
      setIsLoading(true)
      
      fetchMore(items.length, pageSize)
        .then(newItems => {
          if (newItems.length === 0) {
            setHasMore(false)
          } else {
            setItems(prev => [...prev, ...newItems])
          }
        })
        .catch(console.error)
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [virtualScroll.visibleItems, items.length, isLoading, hasMore, threshold, pageSize, fetchMore])

  return {
    ...virtualScroll,
    items,
    isLoading,
    hasMore,
    setItems
  }
}

// Performance monitoring for virtual scrolling
export function useVirtualScrollPerformance() {
  const [fps, setFps] = useState(60)
  const [scrollPerformance, setScrollPerformance] = useState<{
    averageFrameTime: number
    droppedFrames: number
  }>({
    averageFrameTime: 16.67,
    droppedFrames: 0
  })

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let frameTimes: number[] = []
    let droppedFrames = 0

    const measurePerformance = () => {
      const currentTime = performance.now()
      const frameTime = currentTime - lastTime
      
      frameTimes.push(frameTime)
      
      // Keep only last 60 frames
      if (frameTimes.length > 60) {
        frameTimes.shift()
      }

      // Count dropped frames (> 16.67ms indicates dropped frame)
      if (frameTime > 16.67) {
        droppedFrames++
      }

      // Calculate average frame time and FPS
      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
      const currentFps = Math.round(1000 / avgFrameTime)

      setFps(currentFps)
      setScrollPerformance({
        averageFrameTime: avgFrameTime,
        droppedFrames
      })

      lastTime = currentTime
      frameCount++

      requestAnimationFrame(measurePerformance)
    }

    const animationId = requestAnimationFrame(measurePerformance)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  return {
    fps,
    scrollPerformance,
    isPerformant: fps >= 55 && scrollPerformance.droppedFrames < 5
  }
} 
import { 
  useTransition, 
  useDeferredValue, 
  startTransition, 
  useCallback, 
  useMemo, 
  useRef, 
  useEffect,
  useState,
  memo,
  lazy,
  Suspense
} from 'react'

// React 18 concurrent features for smooth rendering
export function useOptimizedTransition() {
  const [isPending, startTransition] = useTransition()

  const runTransition = useCallback((callback: () => void) => {
    startTransition(callback)
  }, [])

  return { isPending, runTransition }
}

// Deferred value for non-urgent updates
export function useDeferredSearch(searchQuery: string) {
  const deferredQuery = useDeferredValue(searchQuery)
  const [isStale, setIsStale] = useState(false)

  useEffect(() => {
    if (searchQuery !== deferredQuery) {
      setIsStale(true)
    } else {
      setIsStale(false)
    }
  }, [searchQuery, deferredQuery])

  return { deferredQuery, isStale }
}

// Optimized list rendering with concurrent features
export function useOptimizedList<T>(
  items: T[],
  filterFn?: (item: T) => boolean,
  sortFn?: (a: T, b: T) => number
) {
  const [isPending, startTransition] = useTransition()
  const [filteredItems, setFilteredItems] = useState(items)

  const updateItems = useCallback(() => {
    startTransition(() => {
      let result = items
      
      if (filterFn) {
        result = result.filter(filterFn)
      }
      
      if (sortFn) {
        result = result.sort(sortFn)
      }
      
      setFilteredItems(result)
    })
  }, [items, filterFn, sortFn])

  useEffect(() => {
    updateItems()
  }, [updateItems])

  return { filteredItems, isPending, updateItems }
}

// Memoized component factory for performance
export function createMemoizedComponent<T>(
  Component: React.ComponentType<T>,
  propsAreEqual?: (prevProps: T, nextProps: T) => boolean
) {
  return memo(Component, propsAreEqual)
}

// Optimized table row component
export const OptimizedTableRow = memo(({ 
  item, 
  columns, 
  onRowClick,
  className = ""
}: {
  item: any
  columns: Array<{ key: string; render?: (item: any) => React.ReactNode }>
  onRowClick?: (item: any) => void
  className?: string
}) => {
  const handleClick = useCallback(() => {
    onRowClick?.(item)
  }, [item, onRowClick])

  return (
    <tr 
      className={`table-row hover-lift cursor-pointer ${className}`}
      onClick={handleClick}
    >
      {columns.map((column) => (
        <td key={column.key} className="px-4 py-2">
          {column.render ? column.render(item) : item[column.key]}
        </td>
      ))}
    </tr>
  )
})

// Lazy loading with suspense
export function createLazyComponent(importFn: () => Promise<{ default: React.ComponentType<any> }>) {
  const LazyComponent = lazy(importFn)
  
  return function LazyWrapper(props: any) {
    return (
      <Suspense fallback={<div className="loading-shimmer h-32 rounded-lg" />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// Optimized form with concurrent features
export function useOptimizedForm<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues)
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})

  const updateField = useCallback((field: keyof T, value: any) => {
    startTransition(() => {
      setValues(prev => ({ ...prev, [field]: value }))
      
      // Clear error for this field
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }))
      }
    })
  }, [errors])

  const validateField = useCallback((field: keyof T, validator: (value: any) => string | undefined) => {
    const error = validator(values[field])
    setErrors(prev => ({ ...prev, [field]: error }))
    return !error
  }, [values])

  const reset = useCallback(() => {
    startTransition(() => {
      setValues(initialValues)
      setErrors({})
    })
  }, [initialValues])

  return {
    values,
    errors,
    isPending,
    updateField,
    validateField,
    reset
  }
}

// Intersection observer for performance
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<HTMLElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    observerRef.current = new IntersectionObserver(callback, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    })

    observerRef.current.observe(target)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [callback, options])

  return targetRef
}

// Optimized image loading
export function OptimizedImage({
  src,
  alt,
  className = "",
  width,
  height,
  placeholder = "blur",
  ...props
}: {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  placeholder?: "blur" | "empty"
  [key: string]: any
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const targetRef = useIntersectionObserver(
    useCallback((entries) => {
      if (entries[0].isIntersecting && !isLoaded && !error) {
        const img = imgRef.current
        if (img) {
          img.src = src
        }
      }
    }, [src, isLoaded, error])
  )

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const handleError = useCallback(() => {
    setError(true)
  }, [])

  return (
    <div 
      ref={targetRef as any}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {!isLoaded && !error && placeholder === "blur" && (
        <div className="absolute inset-0 loading-shimmer" />
      )}
      
      <img
        ref={imgRef}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          Failed to load
        </div>
      )}
    </div>
  )
}

// Debounced search with concurrent features
export function useDebouncedSearch(
  searchFn: (query: string) => Promise<any[]>,
  delay: number = 300
) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const deferredQuery = useDeferredValue(query)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const searchResults = await searchFn(searchQuery)
      
      startTransition(() => {
        setResults(searchResults)
      })
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [searchFn])

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      search(deferredQuery)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [deferredQuery, delay, search])

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery)
  }, [])

  return {
    query,
    results,
    isLoading,
    isPending,
    updateQuery,
    isStale: query !== deferredQuery
  }
}

// Performance monitoring hook
export function useRenderingPerformance() {
  const [renderCount, setRenderCount] = useState(0)
  const [averageRenderTime, setAverageRenderTime] = useState(0)
  const renderTimes = useRef<number[]>([])
  const startTime = useRef<number>(0)

  useEffect(() => {
    startTime.current = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime.current
      
      renderTimes.current.push(renderTime)
      
      // Keep only last 100 render times
      if (renderTimes.current.length > 100) {
        renderTimes.current.shift()
      }
      
      const avgTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
      
      setRenderCount(prev => prev + 1)
      setAverageRenderTime(avgTime)
    }
  })

  return {
    renderCount,
    averageRenderTime,
    isPerformant: averageRenderTime < 16.67 // 60fps threshold
  }
}

// Optimized data fetching with concurrent features (FIXED: No infinite loops)
export function useOptimizedFetch<T>(
  fetchFn: () => Promise<T>,
  deps: React.DependencyList = []
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  // ✅ FIXED: Use ref to avoid stale closure and infinite loops
  const fetchFnRef = useRef(fetchFn)
  fetchFnRef.current = fetchFn

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await fetchFnRef.current()
      
      startTransition(() => {
        setData(result)
      })
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, []) // ✅ FIXED: Empty deps array - function is stable

  // ✅ FIXED: Handle deps changes separately
  useEffect(() => {
    fetchData()
  }, deps)

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    error,
    isLoading,
    isPending,
    refetch
  }
}

// Component for measuring rendering performance
export function RenderingProfiler({ 
  children, 
  onRender 
}: { 
  children: React.ReactNode
  onRender?: (id: string, phase: string, actualDuration: number) => void 
}) {
  const { renderCount, averageRenderTime, isPerformant } = useRenderingPerformance()

  useEffect(() => {
    if (onRender) {
      onRender('component', 'update', averageRenderTime)
    }
  }, [averageRenderTime, onRender])

  return (
    <div data-render-count={renderCount} data-performance={isPerformant ? 'good' : 'poor'}>
      {children}
    </div>
  )
} 
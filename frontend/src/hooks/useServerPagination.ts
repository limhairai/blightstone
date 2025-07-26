import { useState, useEffect, useCallback, useRef } from 'react';
import useSWR from 'swr';

interface PaginationOptions {
  endpoint: string;
  page: number;
  limit: number;
  filters?: Record<string, any>;
  sort?: { field: string; direction: 'asc' | 'desc' };
  enabled?: boolean;
}

interface PaginationResult<T> {
  data: T[];
  total: number;
  loading: boolean;
  error: any;
  refresh: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

export function useServerPagination<T = any>({
  endpoint,
  page,
  limit,
  filters = {},
  sort,
  enabled = true
}: PaginationOptions): PaginationResult<T> {
  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      }
    });
    
    // Add sorting
    if (sort) {
      params.set('sortField', sort.field);
      params.set('sortDirection', sort.direction);
    }
    
    return `${endpoint}?${params.toString()}`;
  }, [endpoint, page, limit, filters, sort]);

  const { data, error, mutate } = useSWR(
    enabled ? buildUrl() : null,
    fetcher
    // Using global SWR config for consistency
  );

  const loading = !data && !error;

  return {
    data: data?.items || [],
    total: data?.total || 0,
    loading,
    error,
    refresh: mutate,
    hasNextPage: data ? (page * limit) < data.total : false,
    hasPrevPage: page > 1
  };
}

// ✅ FIXED: Infinite scrolling hook with stable functions and proper cleanup
export function useInfiniteServerPagination<T = any>({
  endpoint,
  limit,
  filters = {},
  sort
}: Omit<PaginationOptions, 'page'>) {
  const [pages, setPages] = useState<T[][]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // ✅ FIXED: Use refs to avoid stale closures and infinite loops
  const currentPageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  
  // Keep refs in sync with state
  currentPageRef.current = currentPage;
  hasMoreRef.current = hasMore;
  loadingRef.current = loading;

  // ✅ FIXED: Stable loadMore function using refs
  const loadMoreRef = useRef<() => Promise<void>>();
  loadMoreRef.current = async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', currentPageRef.current.toString());
      params.set('limit', limit.toString());
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, value.toString());
        }
      });
      
      if (sort) {
        params.set('sortField', sort.field);
        params.set('sortDirection', sort.direction);
      }
      
      const response = await fetch(`${endpoint}?${params.toString()}`);
      const data = await response.json();
      
      if (data.items.length === 0) {
        setHasMore(false);
      } else {
        setPages(prev => [...prev, data.items]);
        setCurrentPage(prev => prev + 1);
        setHasMore((currentPageRef.current * limit) < data.total);
      }
    } catch (error) {
      console.error('Failed to load more data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Stable loadMore function that doesn't change
  const loadMore = useCallback(() => {
    return loadMoreRef.current?.();
  }, []);

  // ✅ FIXED: Reset and initial load with proper dependency management
  const resetAndLoad = useCallback(() => {
    setPages([]);
    setCurrentPage(1);
    setHasMore(true);
    // Small delay to ensure state is updated before loading
    setTimeout(() => loadMoreRef.current?.(), 0);
  }, []);

  // Reset when filters change
  useEffect(() => {
    resetAndLoad();
  }, [endpoint, JSON.stringify(filters), JSON.stringify(sort), resetAndLoad]);

  const allData = pages.flat();

  return {
    data: allData,
    loading,
    hasMore,
    loadMore,
    reset: resetAndLoad
  };
} 
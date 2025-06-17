import { useState, useEffect, useCallback } from 'react';
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
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 seconds
    }
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

// Specialized hook for infinite scrolling
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

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
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
        setHasMore((currentPage * limit) < data.total);
      }
    } catch (error) {
      console.error('Failed to load more data:', error);
    } finally {
      setLoading(false);
    }
  }, [endpoint, currentPage, limit, filters, sort, loading, hasMore]);

  // Reset when filters change
  useEffect(() => {
    setPages([]);
    setCurrentPage(1);
    setHasMore(true);
    loadMore();
  }, [endpoint, filters, sort]);

  const allData = pages.flat();

  return {
    data: allData,
    loading,
    hasMore,
    loadMore,
    reset: () => {
      setPages([]);
      setCurrentPage(1);
      setHasMore(true);
    }
  };
} 
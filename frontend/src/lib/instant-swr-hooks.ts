import useSWR from 'swr'
import { authenticatedFetcher } from './swr-config'

// Optimized SWR configuration for instant loading
const INSTANT_LOADING_CONFIG = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateOnMount: false, // Don't fetch on mount - use cache
  revalidateIfStale: false, // Use cached data immediately 
  dedupingInterval: 300000, // 5 minutes - very long since we prefetch
  errorRetryCount: 1, // Minimal retries for speed
  shouldRetryOnError: false, // Don't retry for speed
  loadingTimeout: 1000, // Fast timeout
  fallbackData: undefined, // Let components handle empty states
}

// Hook for instant transactions loading
export function useInstantTransactions(filters?: any) {
  const queryString = filters ? new URLSearchParams(filters).toString() : ''
  const cacheKey = [`/api/transactions${queryString ? `?${queryString}` : ''}`, 'instant']
  
  return useSWR(
    cacheKey,
    () => {
      // Since data is prefetched, this should hit cache immediately
      return authenticatedFetcher(cacheKey[0], 'cached')
    },
    INSTANT_LOADING_CONFIG
  )
}

// Hook for instant support tickets loading
export function useInstantSupportTickets(queryParams?: string) {
  const cacheKey = [`/api/support/tickets${queryParams ? `?${queryParams}` : ''}`, 'instant']
  
  return useSWR(
    cacheKey,
    () => authenticatedFetcher(cacheKey[0], 'cached'),
    INSTANT_LOADING_CONFIG
  )
}

// Hook for instant wallet data loading
export function useInstantWalletData(organizationId?: string) {
  const cacheKey = [`/api/transactions?organizationId=${organizationId}`, 'instant']
  
  return useSWR(
    organizationId ? cacheKey : null,
    () => authenticatedFetcher(cacheKey[0], 'cached'),
    INSTANT_LOADING_CONFIG
  )
}

// Hook for instant settings/organization data
export function useInstantOrganization(organizationId?: string) {
  const cacheKey = [`/api/organizations?id=${organizationId}`, 'instant']
  
  return useSWR(
    organizationId ? cacheKey : null,
    () => authenticatedFetcher(cacheKey[0], 'cached'),
    INSTANT_LOADING_CONFIG
  )
}

// Hook for instant business managers data
export function useInstantBusinessManagers() {
  const cacheKey = [`/api/business-managers`, 'instant']
  
  return useSWR(
    cacheKey,
    () => authenticatedFetcher(cacheKey[0], 'cached'),
    INSTANT_LOADING_CONFIG
  )
}

// Hook for instant pixels data
export function useInstantPixels(organizationId?: string) {
  const cacheKey = [`/api/organizations/${organizationId}/pixels`, 'instant']
  
  return useSWR(
    organizationId ? cacheKey : null,
    () => authenticatedFetcher(cacheKey[0], 'cached'),
    INSTANT_LOADING_CONFIG
  )
} 
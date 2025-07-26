import useSWR from 'swr'
import { authenticatedFetcher } from './swr-config'

// 🎯 BALANCED: Fast loading with proper data freshness
const INSTANT_LOADING_CONFIG = {
  revalidateOnFocus: true, // ✅ Refresh when returning to page
  revalidateOnReconnect: true, // ✅ Refresh on reconnect
  revalidateOnMount: true, // ✅ Fetch fresh data on mount
  revalidateIfStale: true, // ✅ Update stale data automatically
  dedupingInterval: 60000, // 1 minute - balanced approach
  errorRetryCount: 1, // Minimal retries for speed
  shouldRetryOnError: false, // Don't retry for speed
  loadingTimeout: 1000, // Fast timeout
  keepPreviousData: true, // ✅ Smooth transitions
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
import useSWR from 'swr'
import { useAuth } from '@/contexts/AuthContext'
import { useMemo } from 'react'

// Optimized fetcher with better error handling
export const authenticatedFetcher = async (url: string, token: string) => {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
    error.name = `${response.status}`
    throw error
  }
  
  return response.json()
}

// **GLOBAL SWR CONFIG** - Optimized for performance and UX
export const swrConfig = {
  // PERFORMANCE OPTIMIZATIONS
  dedupingInterval: 2000,          // 2s deduping to prevent excessive requests
  focusThrottleInterval: 5000,     // 5s throttling for focus events
  
  // CACHE SETTINGS FOR OPTIMAL PERFORMANCE
  compare: (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b), // Deep comparison for cache invalidation
  
  // REVALIDATION BEHAVIOR - Balanced for performance
  revalidateOnFocus: false,        // Don't spam API on focus (saves costs)
  revalidateOnReconnect: true,     // Revalidate on reconnect (user expects fresh data)
  revalidateOnMount: true,         // Always get fresh data on mount
  
  // CACHE BEHAVIOR - Optimized for snappy UX
  refreshInterval: 0,              // No automatic refresh (user-driven updates)
  revalidateIfStale: true,         // Revalidate if data is stale
  
  // ERROR HANDLING - Improved retry logic
  errorRetryInterval: 5000,        // Retry failed requests every 5 seconds (faster recovery)
  errorRetryCount: 3,              // Maximum 3 retry attempts
  shouldRetryOnError: (error: Error) => {
    // Don't retry on 4xx errors (client errors)
    if (error.name === '401' || error.name === '403' || error.name === '404') {
      return false
    }
    return true
  },
  onError: (error: Error) => {
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('SWR Error:', error)
    }
  },
  
  // Removed SWR debug logging
}

// **SPECIAL CONFIGS** - Only for specific use cases
export const realtimeConfig = {
  ...swrConfig,
  refreshInterval: 10 * 1000,      // Auto-refresh every 10 seconds
  revalidateOnFocus: true,         // Revalidate when user returns to tab
  revalidateOnReconnect: true,     // Revalidate when connection is restored
}

export const staticConfig = {
  ...swrConfig,
  revalidateOnMount: false,        // Don't revalidate static data
  refreshInterval: 0,              // No auto-refresh
}

// **STANDARD HOOKS** - All use the same config
export function useOrganizations() {
  const { session } = useAuth()
  
  return useSWR(
    session?.access_token ? ['/api/organizations', session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token),
    swrConfig // Use global config
  )
}

export function useCurrentOrganization(organizationId: string | null) {
  const { session } = useAuth()
  
  return useSWR(
    organizationId && session?.access_token 
      ? [`/api/organizations?id=${organizationId}`, session.access_token]
      : null,
    ([url, token]) => authenticatedFetcher(url, token),
    swrConfig // Use global config
  )
}

export function useBusinessManagers() {
  const { session } = useAuth()
  
  return useSWR(
    session?.access_token ? ['/api/business-managers', session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token),
    swrConfig // Use global config
  )
}

export function useAdAccounts(bmIdFilter?: string | null) {
  const { session } = useAuth()
  
  const apiUrl = bmIdFilter ? `/api/ad-accounts?bm_id=${encodeURIComponent(bmIdFilter)}` : '/api/ad-accounts'
  
  return useSWR(
    session?.access_token ? [apiUrl, session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token),
    swrConfig // Use global config
  )
}

export function useTransactions(filters?: {
  type?: string
  search?: string
  status?: string
  business_id?: string
  date?: string
  page?: number
  limit?: number
}) {
  const { session } = useAuth()
  
  const queryString = useMemo(() => {
    if (!filters) return ''
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, value.toString())
      }
    })
    return params.toString()
  }, [filters])
  
  const apiUrl = queryString ? `/api/transactions?${queryString}` : '/api/transactions'
  
  return useSWR(
    session?.access_token ? [apiUrl, session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token),
    swrConfig // Use global config
  )
}

export function useSubscriptionSWR(organizationId: string | null) {
  const { session } = useAuth()
  
  return useSWR(
    organizationId && session?.access_token
      ? [`/api/subscriptions/current?organizationId=${organizationId}`, session.access_token]
      : null,
    ([url, token]) => authenticatedFetcher(url, token),
    swrConfig // Use global config
  )
}

export function useBusinesses(organizationId: string | null) {
  const { session } = useAuth()
  
  return useSWR(
    organizationId && session?.access_token 
      ? [`/api/businesses?organization_id=${organizationId}`, session.access_token]
      : null,
    ([url, token]) => authenticatedFetcher(url, token),
    swrConfig // Use global config
  )
}

// **REALTIME HOOKS** - For data that changes frequently
export function useTopupRequests() {
  const { session } = useAuth()
  
  return useSWR(
    session?.access_token ? ['/api/topup-requests', session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token),
    swrConfig // Use standard config - no auto-refresh needed
  )
}

// Bulk data hook for dashboard - fetches everything needed with optimized caching
export function useDashboardData(organizationId: string | null) {
  const orgs = useOrganizations()
  const currentOrg = useCurrentOrganization(organizationId)
  const businessManagers = useBusinessManagers()
  const adAccounts = useAdAccounts()
  const transactions = useTransactions()

  const isLoading = orgs.isLoading || currentOrg.isLoading || businessManagers.isLoading || adAccounts.isLoading || transactions.isLoading
  const error = orgs.error || currentOrg.error || businessManagers.error || adAccounts.error || transactions.error

  return {
    organizations: orgs.data?.organizations || [],
    currentOrganization: currentOrg.data?.organizations?.[0] || null,
    businessManagers: businessManagers.data || [],
    adAccounts: adAccounts.data?.accounts || [],
    transactions: transactions.data?.transactions || [],
    isLoading,
    error,
    // Expose individual loading states for granular control
    isLoadingOrgs: orgs.isLoading,
    isLoadingCurrentOrg: currentOrg.isLoading,
    isLoadingBusinessManagers: businessManagers.isLoading,
    isLoadingAdAccounts: adAccounts.isLoading,
    isLoadingTransactions: transactions.isLoading,
    // Expose individual errors for debugging
    orgError: orgs.error,
    currentOrgError: currentOrg.error,
    businessManagersError: businessManagers.error,
    adAccountsError: adAccounts.error,
    transactionsError: transactions.error,
  }
} 
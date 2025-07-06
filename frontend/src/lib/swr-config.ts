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

// **PERFORMANCE OPTIMIZED** SWR configuration
export const swrConfig = {
  revalidateOnFocus: false,        // Don't revalidate when window gains focus
  revalidateOnReconnect: false,    // Don't revalidate when connection is restored
  revalidateOnMount: true,         // DO revalidate on mount to get initial data
  dedupingInterval: 60 * 1000,     // Dedupe requests within 60 seconds (increased from default 2s)
  focusThrottleInterval: 5 * 60 * 1000, // Throttle focus revalidation to 5 minutes
  errorRetryInterval: 30 * 1000,   // Retry failed requests every 30 seconds
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
  }
}

// Specialized hooks for common data patterns with aggressive caching
export function useOrganizations() {
  const { session } = useAuth()
  
  return useSWR(
    session?.access_token ? ['/api/organizations', session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      dedupingInterval: 10 * 60 * 1000, // Organizations change rarely - 10 minutes
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Allow initial mount, but cache aggressively after that
    }
  )
}

export function useCurrentOrganization(organizationId: string | null) {
  const { session } = useAuth()
  
  return useSWR(
    organizationId && session?.access_token 
      ? [`/api/organizations?id=${organizationId}`, session.access_token]
      : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      dedupingInterval: 1000, // Very short deduping interval for immediate responsiveness
      revalidateOnFocus: true, // Revalidate when user focuses tab
      revalidateOnReconnect: true, // Revalidate when connection is restored
      revalidateOnMount: true, // Always get fresh data on mount
      refreshInterval: 0, // No automatic polling
    }
  )
}

export function useBusinessManagers() {
  const { session } = useAuth()
  
  return useSWR(
    session?.access_token ? 'business-managers' : null,
    () => authenticatedFetcher('/api/business-managers', session!.access_token),
    {
      ...swrConfig,
      dedupingInterval: 30 * 1000, // Reduced to 30 seconds for immediate responsiveness
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: true, // Always get fresh data on mount
      refreshInterval: 0, // No automatic polling
    }
  )
}

export function useAdAccounts(bmIdFilter?: string | null) {
  const { session } = useAuth()
  
  const apiUrl = bmIdFilter ? `/api/ad-accounts?bm_id=${encodeURIComponent(bmIdFilter)}` : '/api/ad-accounts'
  const cacheKey = bmIdFilter ? `ad-accounts-${bmIdFilter}` : 'ad-accounts'
  
  return useSWR(
    session?.access_token ? cacheKey : null,
    () => authenticatedFetcher(apiUrl, session!.access_token),
    {
      ...swrConfig,
      dedupingInterval: 30 * 1000, // Reduced to 30 seconds for immediate responsiveness
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: true, // Always get fresh data on mount
      refreshInterval: 0, // No automatic polling
    }
  )
}

export function useTransactions(filters?: {
  type?: string
  search?: string
  status?: string
  business_id?: string
  date?: string
}) {
  const { session } = useAuth()
  
  const queryString = useMemo(() => {
    if (!filters) return ''
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    return params.toString()
  }, [filters])
  
  const apiUrl = queryString ? `/api/transactions?${queryString}` : '/api/transactions'
  const cacheKey = queryString ? `transactions-${queryString}` : 'transactions'
  
  return useSWR(
    session?.access_token ? cacheKey : null,
    () => authenticatedFetcher(apiUrl, session!.access_token),
    {
      ...swrConfig,
      dedupingInterval: 60 * 1000, // Transactions - 1 minute
      revalidateOnFocus: false,
      // Allow initial mount, but cache aggressively after that
      onError: (error) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('useTransactions error:', error);
        }
      },
      shouldRetryOnError: (error) => {
        if (error.message.includes('404') || error.message.includes('401') || error.message.includes('403')) {
          return false;
        }
        return true;
      }
    }
  )
}

// Optimized subscription hook with SWR
export function useSubscriptionSWR(organizationId: string | null) {
  const { session } = useAuth()
  
  return useSWR(
    organizationId && session?.access_token
      ? [`/api/subscriptions/current?organizationId=${organizationId}`, session.access_token]
      : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      dedupingInterval: 1000, // Very short deduping interval for immediate responsiveness
      revalidateOnFocus: true, // Revalidate when user focuses tab
      revalidateOnReconnect: true, // Revalidate when connection is restored
      revalidateOnMount: true, // Enable revalidation on mount to get fresh data
      refreshInterval: 0, // No automatic polling - we handle refreshes manually
      errorRetryCount: 5, // More retries for subscription data
      errorRetryInterval: 2000, // Faster retry interval
    }
  )
}

// Optimized businesses hook
export function useBusinesses(organizationId: string | null) {
  const { session } = useAuth()
  
  return useSWR(
    organizationId && session?.access_token 
      ? [`/api/businesses?organization_id=${organizationId}`, session.access_token]
      : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      dedupingInterval: 10 * 60 * 1000, // Businesses change rarely - 10 minutes
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: false,
    }
  )
}

// Topup requests hook
export function useTopupRequests() {
  const { session } = useAuth()
  
  return useSWR(
    session?.access_token ? ['/api/topup-requests', session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      dedupingInterval: 5 * 1000, // Reduced to 5 seconds for immediate responsiveness
      refreshInterval: 10 * 1000, // Auto-refresh every 10 seconds to catch admin changes
      revalidateOnFocus: true, // Revalidate when user returns to tab
      revalidateOnMount: true, // Always get fresh data on mount
      revalidateOnReconnect: true, // Revalidate when connection is restored
      focusThrottleInterval: 2000, // Throttle focus revalidation to 2 seconds
    }
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

  // Debug logging disabled - performance is now optimal
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('🔍 Dashboard Data Debug:', ...)
  // }

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
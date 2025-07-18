import useSWR, { useSWRConfig } from 'swr'
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

// 🚀 PERFORMANCE: Aggressive SWR configuration to minimize API calls
export const swrConfig = {
  // Increase deduplication window to prevent rapid duplicate calls
  dedupingInterval: 60000, // 60 seconds (increased from 30s)
  
  // Increase focus throttle to prevent excessive revalidation
  focusThrottleInterval: 120000, // 2 minutes (increased from 60s)
  
  // Disable automatic revalidation features that cause excessive calls
  revalidateOnFocus: false,
  revalidateOnReconnect: false, // Disable reconnect revalidation
  revalidateOnMount: true, // FIXED: Allow initial mount revalidation
  revalidateIfStale: false, // Don't automatically revalidate stale data
  
  // Increase error retry interval
  errorRetryInterval: 10000, // 10 seconds
  errorRetryCount: 2, // Reduce retry attempts
  
  // Longer refresh intervals
  refreshInterval: 0, // Disable automatic refresh by default
  
  // Keep data longer in cache
  shouldRetryOnError: false, // Don't retry on error by default
  
  // Use compare function to prevent unnecessary re-renders
  compare: (a: any, b: any) => {
    return JSON.stringify(a) === JSON.stringify(b)
  }
}

// **REAL-TIME HOOKS** - No caching, immediate updates
export function useOrganizations() {
  const { session } = useAuth()
  
  return useSWR(
    session?.access_token ? ['/api/organizations', session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      // Force immediate updates for critical data
      revalidateIfStale: true,
    }
  )
}

export function useCurrentOrganization(organizationId: string | null) {
  const { session } = useAuth()
  
  return useSWR(
    session?.access_token && organizationId ? [`/api/organizations?id=${organizationId}`, session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      // Critical data - always fresh
      revalidateIfStale: true,
    }
  )
}

export function useBusinessManagers() {
  const { session } = useAuth()
  
  return useSWR(
    session?.access_token ? ['/api/business-managers', session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      // Business managers change frequently
      revalidateIfStale: true,
    }
  )
}

export function useAdAccounts() {
  const { session } = useAuth()
  
  return useSWR(
    session?.access_token ? ['/api/ad-accounts', session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      // Ad accounts are dynamic
      revalidateIfStale: true,
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
  
  // If filters is undefined, disable the hook (for conditional loading)
  const shouldFetch = filters !== undefined
  
  // Build query string from filters
  const queryParams = new URLSearchParams()
  if (filters?.type) queryParams.append('type', filters.type)
  if (filters?.search) queryParams.append('search', filters.search)
  if (filters?.status) queryParams.append('status', filters.status)
  if (filters?.business_id) queryParams.append('business_id', filters.business_id)
  if (filters?.date) queryParams.append('date', filters.date)
  
  const queryString = queryParams.toString()
  const url = `/api/transactions${queryString ? `?${queryString}` : ''}`
  
  return useSWR(
    session?.access_token && shouldFetch ? [url, session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      // Transactions are critical financial data
      revalidateIfStale: true,
    }
  )
}

export function useTopupRequests() {
  const { session } = useAuth()
  
  return useSWR(
    session?.access_token ? ['/api/topup-requests', session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      // Topup requests are critical financial data
      revalidateIfStale: true,
    }
  )
}

// **SUBSCRIPTION HOOK** - Real-time subscription data
export function useSubscriptionSWR(organizationId: string | null) {
  const { session } = useAuth()
  
  return useSWR(
    session?.access_token && organizationId ? [`/api/subscriptions/current?organizationId=${organizationId}`, session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      // Subscription data is critical for limits
      revalidateIfStale: true,
    }
  )
}

// **OPTIMISTIC UPDATES HELPER**
export function useOptimisticUpdate() {
  const { mutate } = useSWRConfig()
  
  return {
    // Immediately update UI, then sync with server
    updateOptimistically: async (key: string, optimisticData: any, serverUpdate: () => Promise<any>) => {
      // 1. Immediately update UI
      mutate(key, optimisticData, { revalidate: false })
      
      try {
        // 2. Update server in background
        const serverData = await serverUpdate()
        
        // 3. Sync UI with server response
        mutate(key, serverData, { revalidate: false })
        
        return serverData
      } catch (error) {
        // 4. Revert on error
        mutate(key) // Revalidate to get real data
        throw error
      }
    }
  }
}

// Settings-specific hooks for optimized data fetching
export function usePixelData(organizationId: string | null) {
  const { session } = useAuth()
  
  return useSWR(
    session?.access_token && organizationId 
      ? [`/api/organizations/${organizationId}/pixels`, session.access_token] 
      : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      dedupingInterval: 120000, // 2 minutes - pixels don't change frequently
      revalidateOnFocus: false,
    }
  )
}

export function useTopupUsage(organizationId: string | null) {
  const { session } = useAuth()
  
  return useSWR(
    session?.access_token && organizationId 
      ? [`/api/topup-usage?organization_id=${organizationId}`, session.access_token] 
      : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      dedupingInterval: 300000, // 5 minutes - usage data changes slowly
      revalidateOnFocus: false,
    }
  )
}

export function usePaymentMethods(organizationId: string | null) {
  const { session } = useAuth()
  
  return useSWR(
    session?.access_token && organizationId 
      ? [`/api/payments/methods?organization_id=${organizationId}`, session.access_token] 
      : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      dedupingInterval: 600000, // 10 minutes - payment methods rarely change
      revalidateOnFocus: false,
    }
  )
}

export function useBillingHistory(organizationId: string | null) {
  const { session } = useAuth()
  
  return useSWR(
    session?.access_token && organizationId 
      ? [`/api/payments/billing/history?organization_id=${organizationId}&limit=10`, session.access_token] 
      : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      dedupingInterval: 300000, // 5 minutes - billing history changes slowly
      revalidateOnFocus: false,
    }
  )
}

// Bulk data hook for dashboard - fetches everything needed with smart caching
export function useDashboardData(organizationId: string | null) {
  const orgs = useOrganizations()
  const currentOrg = useCurrentOrganization(organizationId)
  const businessManagers = useBusinessManagers()
  const adAccounts = useAdAccounts()
  const transactions = useTransactions({})

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
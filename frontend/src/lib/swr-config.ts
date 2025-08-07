import useSWR, { useSWRConfig } from 'swr'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganizationStore } from './stores/organization-store'
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

// 🎯 BALANCED: Smart SWR configuration balancing performance with data freshness
export const swrConfig = {
  // Balanced deduplication to prevent duplicate calls but allow updates
  dedupingInterval: 30000, // 30 seconds (reduced from 60s for better freshness)
  
  // Reasonable focus throttle to prevent spam but allow navigation updates
  focusThrottleInterval: 60000, // 1 minute (reduced from 2 minutes)
  
  // CRITICAL: Enable smart revalidation for better user experience
  revalidateOnFocus: true, // ✅ Refresh when returning to page (navigation UX)
  revalidateOnReconnect: true, // ✅ Refresh on network reconnect
  revalidateOnMount: true, // ✅ Always fresh on initial mount
  revalidateIfStale: true, // ✅ CRITICAL: Update stale data automatically
  
  // Reasonable error handling
  errorRetryInterval: 5000, // 5 seconds (faster recovery)
  errorRetryCount: 2, // Keep retry attempts low
  
  // No automatic refresh (still controlled)
  refreshInterval: 0, // Manual/event-driven refreshes only
  
  // Performance optimizations
  shouldRetryOnError: false, // Don't auto-retry errors
  keepPreviousData: true, // ✅ Smooth transitions, show previous data while loading
  
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

export function useBusinessManagers(organizationId?: string | null) {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  
  // Use provided organizationId or fall back to current organization
  const orgId = organizationId || currentOrganizationId
  
  const url = orgId ? `/api/business-managers?organization_id=${orgId}` : '/api/business-managers'
  
  return useSWR(
    session?.access_token && orgId ? [url, session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      // Business managers change frequently
      revalidateIfStale: true,
    }
  )
}

export function useAdAccounts(organizationId?: string | null) {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  
  // Use provided organizationId or fall back to current organization
  const orgId = organizationId || currentOrganizationId
  
  const url = orgId ? `/api/ad-accounts?organization_id=${orgId}` : '/api/ad-accounts'
  
  return useSWR(
    session?.access_token && orgId ? [url, session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      // Ad accounts are dynamic
      revalidateIfStale: true,
    }
  )
}

export function useTransactions(organizationId?: string | null, filters?: {
  type?: string
  search?: string
  status?: string
  business_id?: string
  date?: string
}) {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  
  const orgId = organizationId || currentOrganizationId
  
  // If filters is undefined, disable the hook (for conditional loading)
  const shouldFetch = filters !== undefined && orgId
  
  // Build query string from filters
  const queryParams = new URLSearchParams()
  if (orgId) queryParams.append('organization_id', orgId)
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
  const businessManagers = useBusinessManagers(organizationId)
  const adAccounts = useAdAccounts(organizationId)
  const transactions = useTransactions(organizationId, {})

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

// Pages hook
export function usePages(organizationId?: string | null) {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  
  const orgId = organizationId || currentOrganizationId
  const shouldFetch = !!session?.access_token && !!orgId
  
  const url = shouldFetch ? `/api/pages?organization_id=${orgId}` : null
  
  return useSWR(
    url ? [url, session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
    }
  )
} 
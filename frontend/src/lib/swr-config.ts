import useSWR, { SWRConfiguration } from 'swr'
import { useAuth } from '../contexts/AuthContext'

// Optimized fetcher with error handling
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

// Authenticated fetcher
const authenticatedFetcher = async (url: string, token: string) => {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

// Optimized SWR configuration
export const swrConfig: SWRConfiguration = {
  fetcher,
  dedupingInterval: 5 * 60 * 1000, // 5 minutes deduplication
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  revalidateIfStale: false,
  errorRetryCount: 2,
  errorRetryInterval: 1000,
  refreshInterval: 0, // Disable auto refresh by default
  // Use stale data while revalidating for better UX
  keepPreviousData: true,
}

// Specialized hooks for common data patterns
export function useOrganizations() {
  return useSWR('/api/organizations', fetcher, {
    ...swrConfig,
    dedupingInterval: 10 * 60 * 1000, // Organizations change rarely
  })
}

export function useCurrentOrganization(organizationId: string | null) {
  return useSWR(
    organizationId ? `/api/organizations?id=${organizationId}` : null,
    fetcher,
    {
      ...swrConfig,
      dedupingInterval: 5 * 60 * 1000, // Current org data
    }
  )
}

export function useBusinessManagers(organizationId: string | null) {
  const { session } = useAuth()
  
  return useSWR(
    organizationId && session?.access_token 
      ? ['/api/business-managers', session.access_token] 
      : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      dedupingInterval: 3 * 60 * 1000, // Business managers change moderately
    }
  )
}

export function useAdAccounts(organizationId: string | null) {
  const { session } = useAuth()
  
  return useSWR(
    organizationId && session?.access_token 
      ? [`/api/ad-accounts?organization_id=${organizationId}`, session.access_token]
      : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      dedupingInterval: 2 * 60 * 1000, // Ad accounts change more frequently
    }
  )
}

export function useTransactions(organizationId: string | null) {
  return useSWR(
    organizationId ? `/api/transactions?organization_id=${organizationId}` : null,
    fetcher,
    {
      ...swrConfig,
      dedupingInterval: 1 * 60 * 1000, // Transactions are most dynamic
    }
  )
}

// Bulk data hook for dashboard - fetches everything needed in one optimized call
export function useDashboardData(organizationId: string | null) {
  const orgs = useOrganizations()
  const currentOrg = useCurrentOrganization(organizationId)
  const businessManagers = useBusinessManagers(organizationId)
  const adAccounts = useAdAccounts(organizationId)
  const transactions = useTransactions(organizationId)

  const isLoading = orgs.isLoading || currentOrg.isLoading || businessManagers.isLoading || adAccounts.isLoading || transactions.isLoading
  const error = orgs.error || currentOrg.error || businessManagers.error || adAccounts.error || transactions.error

  return {
    organizations: orgs.data?.organizations || [],
    currentOrganization: currentOrg.data?.organizations?.[0],
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
  }
} 
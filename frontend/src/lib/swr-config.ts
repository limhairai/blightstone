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
export const authenticatedFetcher = async (url: string, token: string) => {
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
  dedupingInterval: 10 * 60 * 1000, // 10 minutes deduplication - longer to reduce calls
  revalidateOnFocus: false,
  revalidateOnReconnect: false, // Don't revalidate on reconnect to reduce calls
  revalidateIfStale: false,
  errorRetryCount: 1, // Reduce retries to prevent flickering
  errorRetryInterval: 5000, // Longer interval between retries
  refreshInterval: 0, // Disable auto refresh by default
  // Use stale data while revalidating for better UX
  keepPreviousData: true,
  // Add fallback data to prevent empty states
  fallbackData: null,
}

// Specialized hooks for common data patterns
export function useOrganizations() {
  const { session } = useAuth()
  
  return useSWR(
    session?.access_token ? ['/api/organizations', session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      dedupingInterval: 5 * 60 * 1000, // Organizations change rarely - 5 minutes
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )
}

export function useCurrentOrganization(organizationId: string | null) {
  const { session } = useAuth()
  
  // Simplified: just check if we have the basic requirements
  // Since we fixed the 401 errors in the API, we don't need complex access checking here
  const shouldFetch = !!(organizationId && session?.access_token)
  
  // Debug logging (can be removed in production)
  // console.log('🔍 useCurrentOrganization debug:', {
  //   organizationId,
  //   hasSession: !!session,
  //   hasAccessToken: !!session?.access_token,
  //   shouldFetch,
  //   swrKey: shouldFetch ? `org-${organizationId}` : null,
  //   apiUrl: `/api/organizations?id=${organizationId}`
  // });
  
  const result = useSWR(
    shouldFetch ? `org-${organizationId}` : null,
    () => authenticatedFetcher(`/api/organizations?id=${organizationId}`, session.access_token!),
    {
      ...swrConfig,
      dedupingInterval: 2 * 60 * 1000, // 2 minutes - reasonable cache time
      revalidateOnMount: true, // Always revalidate on mount for current org data
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      onError: (error) => {
        // Only log non-auth errors to reduce noise
        if (!error.message.includes('401') && !error.message.includes('403')) {
          console.error('useCurrentOrganization error:', error);
        }
      },
      // Don't retry on authentication or permission errors
      shouldRetryOnError: (error) => {
        if (error.message.includes('401') || error.message.includes('403') || error.message.includes('404')) {
          return false;
        }
        return true;
      },
      // Return empty result on error to prevent component failures
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Don't retry auth errors
        if (error.message.includes('401') || error.message.includes('403')) {
          return;
        }
        // Don't retry more than 1 time for other errors
        if (retryCount >= 1) return;
        
        // Retry after 3 seconds
        setTimeout(() => revalidate({ retryCount }), 3000);
      },
      // Return empty organizations array on error to prevent component crashes
      fallbackData: { organizations: [] }  // Re-enabled to prevent crashes
    }
  );
  
  // Debug the result (can be removed in production)
  // console.log('🔍 useCurrentOrganization result:', {
  //   data: result.data,
  //   error: result.error?.message,
  //   isLoading: result.isLoading,
  //   isValidating: result.isValidating
  // });
  
  return result;
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
      onError: (error) => {
        console.error('useBusinessManagers error:', error);
      },
      // Don't retry on 404/401/403 errors - these indicate missing data or auth issues
      shouldRetryOnError: (error) => {
        if (error.message.includes('404') || error.message.includes('401') || error.message.includes('403')) {
          return false;
        }
        return true;
      }
    }
  )
}

export function useAdAccounts(organizationId: string | null) {
  const { session } = useAuth()
  
  return useSWR(
    organizationId && session?.access_token 
      ? ['/api/ad-accounts', session.access_token]
      : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      dedupingInterval: 2 * 60 * 1000, // Ad accounts change more frequently
      onError: (error) => {
        console.error('useAdAccounts error:', error);
      },
      // Don't retry on 404/401/403 errors - these indicate missing data or auth issues
      shouldRetryOnError: (error) => {
        if (error.message.includes('404') || error.message.includes('401') || error.message.includes('403')) {
          return false;
        }
        return true;
      }
    }
  )
}

export function useTransactions(organizationId: string | null) {
  const { session } = useAuth()
  
  return useSWR(
    organizationId && session?.access_token 
      ? ['/api/transactions', session.access_token]
      : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      ...swrConfig,
      dedupingInterval: 30 * 1000, // Reduced from 1 minute to 30 seconds for faster loading
      revalidateOnMount: true, // Always revalidate on mount for fresh data
      revalidateOnFocus: true, // Revalidate when user focuses the tab
      onError: (error) => {
        console.error('useTransactions error:', error);
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
    // Expose individual errors for debugging
    orgError: orgs.error,
    currentOrgError: currentOrg.error,
    businessManagersError: businessManagers.error,
    adAccountsError: adAccounts.error,
    transactionsError: transactions.error,
  }
} 
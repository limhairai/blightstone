/**
 * 🔧 Centralized Cache Key Management
 * 
 * Single source of truth for all SWR cache keys
 * Eliminates the fragmented cache key problem we identified in the audit
 */

/**
 * Authentication and User Data Keys
 */
export const AuthKeys = {
  user: () => '/api/auth/user',
  me: () => '/api/auth/me', 
  profile: () => '/api/profile',
} as const

/**
 * Organization Data Keys
 */
export const OrganizationKeys = {
  all: () => '/api/organizations',
  byId: (orgId: string) => `/api/organizations?id=${orgId}`,
  single: (orgId: string) => `/api/organizations/${orgId}`,
  activeBmCount: (orgId: string) => `/api/organizations/${orgId}/active-bm-count`,
  activeAccountCount: (orgId: string) => `/api/organizations/${orgId}/active-account-count`,
} as const

/**
 * Asset Management Keys
 */
export const AssetKeys = {
  businessManagers: () => '/api/business-managers',
  businessManagersByOrg: (orgId: string) => `/api/business-managers?organization_id=${orgId}`,
  
  adAccounts: () => '/api/ad-accounts', 
  adAccountsByOrg: (orgId: string) => `/api/ad-accounts?organization_id=${orgId}`,
  adAccountsByBm: (bmId: string) => `/api/ad-accounts?bm_id=${bmId}`,
  
  pixels: (orgId: string) => `/api/organizations/${orgId}/pixels`,
  domains: (orgId: string) => `/api/organizations/${orgId}/domains`,
} as const

/**
 * Financial Data Keys  
 */
export const FinancialKeys = {
  wallet: (orgId: string) => `/api/organizations/${orgId}/wallet`,
  walletTransactions: () => '/api/wallet/transactions',
  walletTransactionsByOrg: (orgId: string) => `/api/wallet/transactions?organizationId=${orgId}`,
  
  transactions: () => '/api/transactions',
  transactionsByOrg: (orgId: string) => `/api/transactions?organizationId=${orgId}`,
  
  topupRequests: () => '/api/topup-requests',
  topupRequestsByOrg: (orgId: string) => `/api/topup-requests?organizationId=${orgId}`,
} as const

/**
 * Subscription and Plan Keys
 */
export const SubscriptionKeys = {
  current: () => '/api/subscriptions/current',
  currentByOrg: (orgId: string) => `/api/subscriptions/current?organizationId=${orgId}`,
  usage: () => '/api/topup-usage',
  usageByOrg: (orgId: string) => `/api/topup-usage?organizationId=${orgId}`,
  
  // Hook-specific keys
  hook: () => 'subscription',
  hookByOrg: (orgId: string) => `subscription-${orgId}`,
  data: () => 'subscriptionData',
  dataByOrg: (orgId: string) => `subscriptionData-${orgId}`,
} as const

/**
 * Application and Admin Keys
 */
export const ApplicationKeys = {
  all: () => '/api/applications',
  bmApplications: () => '/api/bm-applications',
  adminApplications: () => '/api/admin/applications',
  adminDashboard: () => '/api/admin/dashboard-summary',
} as const

/**
 * Authenticated SWR Key Builder
 * For endpoints that require authentication tokens
 */
export const AuthenticatedKeys = {
  build: (endpoint: string, token: string) => [endpoint, token],
  
  // Common authenticated endpoints
  organizations: (token: string, orgId?: string) => 
    orgId ? [OrganizationKeys.byId(orgId), token] : [OrganizationKeys.all(), token],
    
  businessManagers: (token: string, orgId?: string) =>
    orgId ? [AssetKeys.businessManagersByOrg(orgId), token] : [AssetKeys.businessManagers(), token],
    
  adAccounts: (token: string, orgId?: string, bmId?: string) => {
    if (bmId) return [AssetKeys.adAccountsByBm(bmId), token]
    if (orgId) return [AssetKeys.adAccountsByOrg(orgId), token]
    return [AssetKeys.adAccounts(), token]
  },
  
  transactions: (token: string, orgId?: string) =>
    orgId ? [FinancialKeys.transactionsByOrg(orgId), token] : [FinancialKeys.transactions(), token],
} as const

/**
 * Cache Key Categories for Bulk Operations
 */
export const CacheCategories = {
  /**
   * All authentication and user-related keys
   */
  auth: [
    AuthKeys.user(),
    AuthKeys.me(),
    AuthKeys.profile(),
  ],
  
  /**
   * All organization-related keys for a specific org
   */
  organization: (orgId: string) => [
    OrganizationKeys.all(),
    OrganizationKeys.byId(orgId),
    OrganizationKeys.single(orgId),
    OrganizationKeys.activeBmCount(orgId),
    OrganizationKeys.activeAccountCount(orgId),
  ],
  
  /**
   * All asset-related keys for a specific org
   */
  assets: (orgId: string) => [
    AssetKeys.businessManagers(),
    AssetKeys.businessManagersByOrg(orgId),
    AssetKeys.adAccounts(),
    AssetKeys.adAccountsByOrg(orgId),
    AssetKeys.pixels(orgId),
    AssetKeys.domains(orgId),
  ],
  
  /**
   * All financial-related keys for a specific org
   */
  financial: (orgId: string) => [
    FinancialKeys.wallet(orgId),
    FinancialKeys.walletTransactions(),
    FinancialKeys.walletTransactionsByOrg(orgId),
    FinancialKeys.transactions(),
    FinancialKeys.transactionsByOrg(orgId),
    FinancialKeys.topupRequests(),
    FinancialKeys.topupRequestsByOrg(orgId),
  ],
  
  /**
   * All subscription-related keys for a specific org
   */
  subscription: (orgId: string) => [
    SubscriptionKeys.current(),
    SubscriptionKeys.currentByOrg(orgId),
    SubscriptionKeys.usage(),
    SubscriptionKeys.usageByOrg(orgId),
    SubscriptionKeys.hook(),
    SubscriptionKeys.hookByOrg(orgId),
    SubscriptionKeys.data(),
    SubscriptionKeys.dataByOrg(orgId),
  ],
} as const

/**
 * Helper function to validate cache keys during development
 */
export function validateCacheKey(key: string | string[]): boolean {
  if (typeof key === 'string') {
    return key.startsWith('/api/') || ['subscription', 'subscriptionData', 'user', 'profile', 'auth'].includes(key)
  }
  if (Array.isArray(key) && key.length === 2) {
    return typeof key[0] === 'string' && typeof key[1] === 'string' && key[0].startsWith('/api/')
  }
  return false
}

/**
 * Development helper to log cache key usage
 */
export function logCacheKeyUsage(operation: string, keys: (string | string[])[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔑 Cache ${operation}:`, keys.map(k => 
      Array.isArray(k) ? `${k[0]} (authenticated)` : k
    ))
  }
} 
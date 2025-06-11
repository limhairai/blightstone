// Central API configuration for AdHub
// This prevents API endpoint mismatches and provides consistent API calling

const API_BASE_URL = '/api/proxy'

// API endpoint paths
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    ME: `${API_BASE_URL}/auth/me`,
    TOKEN: `${API_BASE_URL}/auth/token`,
    REGISTER: `${API_BASE_URL}/auth/register`,
  },

  // User endpoints
  USERS: {
    PROFILE: `${API_BASE_URL}/users/profile`,
    LIST: `${API_BASE_URL}/users`,
  },

  // Organization endpoints
  ORGANIZATIONS: {
    LIST: `${API_BASE_URL}/organizations`,
    CREATE: `${API_BASE_URL}/organizations`,
    DETAILS: (orgId: string) => `${API_BASE_URL}/organizations/${orgId}`,
    MEMBERS: (orgId: string) => `${API_BASE_URL}/organizations/${orgId}/members`,
    INVITE: (orgId: string) => `${API_BASE_URL}/organizations/${orgId}/invite`,
  },

  // Ad Account endpoints
  AD_ACCOUNTS: {
    LIST: `${API_BASE_URL}/ad-accounts`,
    CREATE: `${API_BASE_URL}/ad-accounts`,
    DETAILS: (accountId: string) => `${API_BASE_URL}/ad-accounts/${accountId}`,
    ARCHIVE: (accountId: string) => `${API_BASE_URL}/ad-accounts/${accountId}/archive`,
    TAGS: (accountId: string) => `${API_BASE_URL}/ad-accounts/${accountId}/tags`,
    SYNC_STATUS: (accountId: string) => `${API_BASE_URL}/ad-accounts/${accountId}/sync-status`,
    SPEND_CAP: (accountId: string) => `${API_BASE_URL}/ad-accounts/${accountId}/spend-cap`,
    PAUSE: (accountId: string) => `${API_BASE_URL}/ad-accounts/${accountId}/pause`,
    RESUME: (accountId: string) => `${API_BASE_URL}/ad-accounts/${accountId}/resume`,
  },

  // Business endpoints
  BUSINESSES: {
    LIST: `${API_BASE_URL}/businesses`,
    CREATE: `${API_BASE_URL}/businesses`,
    DETAILS: (businessId: string) => `${API_BASE_URL}/businesses/${businessId}`,
  },

  // Wallet endpoints
  WALLET: {
    BALANCE: `${API_BASE_URL}/wallet/balance`,
    TRANSACTIONS: `${API_BASE_URL}/wallet/transactions`,
    TOPUP: `${API_BASE_URL}/wallet/topup`,
    DISTRIBUTE: `${API_BASE_URL}/wallet/distribute`,
    CONSOLIDATE: `${API_BASE_URL}/wallet/consolidate`,
  },

  // Admin endpoints
  ADMIN: {
    STATS: `${API_BASE_URL}/admin/stats`,
    CLIENTS: `${API_BASE_URL}/admin/clients`,
    ORGANIZATIONS: `${API_BASE_URL}/admin/organizations`,
    TRANSACTIONS: `${API_BASE_URL}/admin/transactions`,
    ACTIVITY: `${API_BASE_URL}/admin/activity`,
  },

  // Health check
  HEALTH: `${API_BASE_URL}/health/health`,
}

// Helper function to create authenticated headers
export function createAuthHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

// Helper function for API calls
export async function apiCall(
  endpoint: string, 
  options: RequestInit & { token?: string } = {}
) {
  const { token, ...fetchOptions } = options
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers as Record<string, string>
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  const response = await fetch(endpoint, {
    ...fetchOptions,
    headers
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      detail: `HTTP ${response.status}: ${response.statusText}` 
    }))
    throw new Error(errorData.detail || `API call failed: ${response.status}`)
  }
  
  return response.json()
}

// Environment detection
export const IS_PRODUCTION = process.env.NODE_ENV === 'production'
export const IS_STAGING = process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development' 
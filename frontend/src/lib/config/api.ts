import { ENV_CONFIG } from '../env-config'

/**
 * 🌍 API Configuration
 * PRODUCTION-READY API settings with environment-based URLs
 */

export const API_CONFIG = {
  // Base URLs from environment configuration
  baseUrl: ENV_CONFIG.API_URL,
  frontendUrl: ENV_CONFIG.FRONTEND_URL,
  
  // Request configuration
  timeout: 10000,
  retries: 3,
  
  // Headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Endpoints
  endpoints: {
    auth: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      verify: '/api/auth/verify',
      register: '/api/auth/register',
    },
    businesses: '/api/businesses',
    accounts: '/api/accounts',
    transactions: '/api/transactions',
    payments: '/api/payments',
    admin: '/api/admin',
  },
  
  // WebSocket configuration
  wsUrl: ENV_CONFIG.WS_URL,
  
  // Environment flags
  isDevelopment: ENV_CONFIG.IS_DEVELOPMENT,
  isProduction: ENV_CONFIG.IS_PRODUCTION,
  isStaging: ENV_CONFIG.IS_STAGING,
}

// ✅ SECURE: API URL builder
export function buildApiUrl(endpoint: string): string {
  const baseUrl = API_CONFIG.baseUrl.replace(/\/$/, '') // Remove trailing slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${baseUrl}${cleanEndpoint}`
}

// ✅ SECURE: Frontend URL builder
export function buildFrontendUrl(path: string): string {
  const baseUrl = API_CONFIG.frontendUrl.replace(/\/$/, '') // Remove trailing slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

// Export for backward compatibility
export const apiUrl = API_CONFIG.baseUrl
export const frontendUrl = API_CONFIG.frontendUrl

export default API_CONFIG

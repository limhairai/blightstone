/**
 * Centralized API Configuration
 * Replaces all hardcoded localhost URLs throughout the app
 */

// Environment validation
const requiredEnvVars = {
  BACKEND_URL: process.env.BACKEND_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
}

// Validate environment variables in production
if (process.env.NODE_ENV === 'production') {
  const missing = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

// API Configuration
export const API_CONFIG = {
  // Backend URL with fallback for development
  BACKEND_URL: process.env.BACKEND_URL || 
               process.env.NEXT_PUBLIC_API_URL || 
               (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : ''),
  
  // Request configuration
  TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000'),
  RETRIES: parseInt(process.env.API_RETRIES || '3'),
  
  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Endpoints
  ENDPOINTS: {
    // Admin endpoints
    ADMIN_ASSETS: '/api/admin/assets',
    ADMIN_APPLICATIONS: '/api/admin/applications',
    
    // Client endpoints
    CLIENT_ASSETS: '/api/client/assets',
    
    // Core endpoints
    APPLICATIONS: '/api/applications',
    BUSINESSES: '/api/businesses',
    ORGANIZATIONS: '/api/organizations',
    ACCESS_CODES: '/api/access-codes',
    AD_ACCOUNTS: '/api/ad-accounts',
    
    // Payment endpoints
    PAYMENT_INTENT: '/api/payments/intent',
    PAYMENT_SUCCESS: '/api/payments/success',
  }
}

// Utility function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.BACKEND_URL
  if (!baseUrl) {
    throw new Error('Backend URL not configured')
  }
  return `${baseUrl}${endpoint}`
}

// Utility function for API requests with retry logic
export const apiRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const url = buildApiUrl(endpoint)
  const config = {
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      ...API_CONFIG.DEFAULT_HEADERS,
      ...options.headers,
    },
    ...options,
  }

  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= API_CONFIG.RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.timeout)
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      return response
      
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on the last attempt
      if (attempt === API_CONFIG.RETRIES) {
        break
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt - 1) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError || new Error('API request failed after retries')
}

// Environment info for debugging
export const getApiInfo = () => ({
  backendUrl: API_CONFIG.BACKEND_URL,
  environment: process.env.NODE_ENV,
  timeout: API_CONFIG.TIMEOUT,
  retries: API_CONFIG.RETRIES,
  isProduction: process.env.NODE_ENV === 'production',
  hasBackendUrl: !!API_CONFIG.BACKEND_URL,
}) 
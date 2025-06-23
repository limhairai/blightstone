import { ENV_CONFIG } from './env-config'

/**
 * 🔒 Secure Environment Configuration
 * PRODUCTION-READY environment management with security best practices
 */

// ✅ SECURE: Runtime environment detection
export const RUNTIME_ENV = {
  IS_BROWSER: typeof window !== 'undefined',
  IS_SERVER: typeof window === 'undefined',
  IS_PRODUCTION: ENV_CONFIG.IS_PRODUCTION,
  IS_STAGING: ENV_CONFIG.IS_STAGING,
  IS_DEVELOPMENT: ENV_CONFIG.IS_DEVELOPMENT,
  NODE_ENV: process.env.NODE_ENV || 'development',
}

// ✅ SECURE: Secure configuration object
export const SECURE_CONFIG = {
  // Environment info
  ENVIRONMENT: RUNTIME_ENV.NODE_ENV,
  
  // URLs (no hardcoded localhost)
  BASE_URL: ENV_CONFIG.BASE_URL,
  API_URL: ENV_CONFIG.API_URL,
  FRONTEND_URL: ENV_CONFIG.FRONTEND_URL,
  BACKEND_URL: ENV_CONFIG.BACKEND_URL,
  
  // Domain configuration
  DOMAIN: ENV_CONFIG.DOMAIN,
  SECURE_COOKIES: ENV_CONFIG.SECURE_COOKIES,
  
  // Feature flags
  USE_DEMO_DATA: ENV_CONFIG.USE_DEMO_DATA,
  ENABLE_DEBUG: ENV_CONFIG.ENABLE_DEBUG,
  
  // External services (only public keys)
  STRIPE_PUBLISHABLE_KEY: ENV_CONFIG.STRIPE_PUBLISHABLE_KEY,
  SUPABASE_URL: ENV_CONFIG.SUPABASE_URL,
  SUPABASE_ANON_KEY: ENV_CONFIG.SUPABASE_ANON_KEY,
  
  // Security settings
  JWT_EXPIRATION: '7d',
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in ms
  
  // API configuration
  API_TIMEOUT: 10000,
  API_RETRIES: 3,
}

// ✅ SECURE: Environment validation
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check required production environment variables
  if (RUNTIME_ENV.IS_PRODUCTION) {
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      errors.push('NEXT_PUBLIC_APP_URL is required in production')
    }
    
    if (!process.env.NEXT_PUBLIC_API_URL) {
      errors.push('NEXT_PUBLIC_API_URL is required in production')
    }
    
    if (!process.env.JWT_SECRET) {
      errors.push('JWT_SECRET is required in production')
    }
    
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required in production')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// ✅ SECURE: Safe environment info for client-side
export function getClientSafeEnvInfo() {
  return {
    environment: RUNTIME_ENV.NODE_ENV,
    isDevelopment: RUNTIME_ENV.IS_DEVELOPMENT,
    isProduction: RUNTIME_ENV.IS_PRODUCTION,
    isStaging: RUNTIME_ENV.IS_STAGING,
    baseUrl: SECURE_CONFIG.BASE_URL,
    apiUrl: SECURE_CONFIG.API_URL,
    domain: SECURE_CONFIG.DOMAIN,
    useDemoData: SECURE_CONFIG.USE_DEMO_DATA,
    enableDebug: SECURE_CONFIG.ENABLE_DEBUG,
  }
}

// 🎯 Development logging
if (RUNTIME_ENV.IS_DEVELOPMENT) {
  const validation = validateEnvironment()
  
  console.log('🔒 Secure Environment Configuration:', getClientSafeEnvInfo())
  
  if (!validation.isValid) {
    console.warn('⚠️ Environment validation warnings:', validation.errors)
  }
}

export default SECURE_CONFIG

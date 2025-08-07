/**
 * 🌍 Environment Configuration
 * PRODUCTION-READY URL management with proper fallbacks
 */

// ✅ SECURE: Environment detection
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const IS_STAGING = process.env.VERCEL_ENV === 'preview' || process.env.ENVIRONMENT === 'staging'
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'

// ✅ SECURE: Get base URLs from environment variables with proper fallbacks
function getBaseUrl(): string {
  // 1. Check explicit environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // 2. Production URL
  if (IS_PRODUCTION) {
    return 'https://adhub.tech'
  }
  
  // 3. Staging URL
  if (IS_STAGING) {
    return 'https://staging.adhub.tech'
  }
  
  // 4. Development fallback
  return 'http://localhost:3000'
}

function getApiUrl(): string {
  // 1. Check explicit environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // 2. Production API URL
  if (IS_PRODUCTION) {
    return 'https://api.adhub.tech'
  }
  
  // 3. Staging API URL
  if (IS_STAGING) {
    return 'https://api-staging.adhub.tech'
  }
  
  // 4. Development fallback
  return 'http://localhost:8000'
}

// ✅ SECURE: Environment configuration
export const ENV_CONFIG = {
  // Environment flags
  IS_PRODUCTION,
  IS_STAGING,
  IS_DEVELOPMENT,
  
  // Base URLs
  BASE_URL: getBaseUrl(),
  API_URL: getApiUrl(),
  
  // Derived URLs
  FRONTEND_URL: getBaseUrl(),
  BACKEND_URL: getApiUrl(),
  
  // API endpoints
  API_BASE_URL: getApiUrl(),
  WS_URL: getApiUrl().replace('http', 'ws'),
  
  // Domain for cookies
  DOMAIN: IS_PRODUCTION ? 'adhub.tech' : (IS_STAGING ? 'staging.adhub.tech' : 'localhost'),
  
  // Feature flags
  ENABLE_DEBUG: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true' || IS_DEVELOPMENT,
  
  // Security
  SECURE_COOKIES: IS_PRODUCTION || IS_STAGING,
  
  // External services
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
}

// ✅ SECURE: Validation
if (IS_PRODUCTION && !process.env.NEXT_PUBLIC_APP_URL) {
  console.warn('⚠️ NEXT_PUBLIC_APP_URL not set in production')
}

if (IS_PRODUCTION && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn('⚠️ NEXT_PUBLIC_API_URL not set in production')
}

// 🎯 Development logging - REMOVED to reduce console noise
// if (IS_DEVELOPMENT) {
//   console.log('🌍 Environment Configuration:', {
//     NODE_ENV: process.env.NODE_ENV,
//     BASE_URL: ENV_CONFIG.BASE_URL,
//     API_URL: ENV_CONFIG.API_URL,
//   })
// }

// ✅ SECURE: Export for backward compatibility
export const {
  BASE_URL,
  API_URL,
  FRONTEND_URL,
  BACKEND_URL,
  API_BASE_URL,
  DOMAIN,
  ENABLE_DEBUG,
  SECURE_COOKIES,
} = ENV_CONFIG

export default ENV_CONFIG 
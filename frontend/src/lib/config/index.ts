/**
 * Master Configuration Index
 * Central export for all configuration modules
 */

export * from './api'
export * from './assets'
export * from './financial'
export * from './pricing-management'

import { API_CONFIG, getApiInfo } from './api'
import { ASSETS, getAssetInfo } from './assets'
import { DISPLAY_CONFIG } from './financial'

// Master configuration object
export const CONFIG = {
  API: API_CONFIG,
  ASSETS,
  FINANCIAL: DISPLAY_CONFIG,
  
  // App metadata
  APP: {
    NAME: process.env.NEXT_PUBLIC_APP_NAME || 'AdHub',
    VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    ENVIRONMENT: process.env.NODE_ENV || 'development',
    DEBUG: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG === 'true',
  },
  
  // Feature flags
  FEATURES: {
    USE_DEMO_DATA: process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true',
    ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    ENABLE_ERROR_REPORTING: process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true',
    MAINTENANCE_MODE: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true',
  },
  
  // External services
  SERVICES: {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID,
  }
}

// Simple validation
export const validateEnvironment = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  // Production requirements
  if (CONFIG.APP.ENVIRONMENT === 'production') {
    const requiredProdVars = [
      { key: 'BACKEND_URL', value: process.env.BACKEND_URL },
      { key: 'NEXT_PUBLIC_SUPABASE_URL', value: CONFIG.SERVICES.SUPABASE_URL },
      { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: CONFIG.SERVICES.SUPABASE_ANON_KEY },
    ]
    
    requiredProdVars.forEach(({ key, value }) => {
      if (!value) {
        errors.push(`Missing required production environment variable: ${key}`)
      }
    })
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Configuration diagnostics
export const getConfigDiagnostics = () => {
  const validation = validateEnvironment()
  
  return {
    environment: CONFIG.APP.ENVIRONMENT,
    version: CONFIG.APP.VERSION,
    debug: CONFIG.APP.DEBUG,
    features: CONFIG.FEATURES,
    validation,
    api: getApiInfo(),
    assets: getAssetInfo(),
    financial: { currency: DISPLAY_CONFIG.CURRENCY, symbol: DISPLAY_CONFIG.CURRENCY_SYMBOL },
    services: {
      hasSupabase: !!(CONFIG.SERVICES.SUPABASE_URL && CONFIG.SERVICES.SUPABASE_ANON_KEY),
      hasStripe: !!CONFIG.SERVICES.STRIPE_PUBLIC_KEY,
      hasAnalytics: !!CONFIG.SERVICES.ANALYTICS_ID,
    }
  }
}

// Initialize configuration (run validation on import)
const validation = validateEnvironment()
if (!validation.valid && CONFIG.APP.ENVIRONMENT === 'production') {
  console.error('❌ Configuration validation failed:', validation.errors)
  throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`)
} else if (!validation.valid && CONFIG.APP.DEBUG) {
  console.warn('⚠️ Configuration warnings:', validation.errors)
}

// Log configuration info in development
if (CONFIG.APP.DEBUG) {
  console.log('🔧 Configuration loaded:', {
    environment: CONFIG.APP.ENVIRONMENT,
    backendUrl: CONFIG.API.BACKEND_URL,
    useDemoData: CONFIG.FEATURES.USE_DEMO_DATA,
    hasSupabase: !!(CONFIG.SERVICES.SUPABASE_URL && CONFIG.SERVICES.SUPABASE_ANON_KEY),
  })
} 
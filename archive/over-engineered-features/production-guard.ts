/**
 * 🔒 Production Guard System
 * CRITICAL: Prevents demo data and development code from running in production
 */

// ✅ SECURE: Environment validation
export function validateProductionEnvironment(): void {
  if (process.env.NODE_ENV === 'production') {
    const dangerousFlags = [
      'NEXT_PUBLIC_USE_MOCK_DATA',
      'NEXT_PUBLIC_DEMO_MODE', 
      'NEXT_PUBLIC_USE_DEMO_DATA'
    ]
    
    for (const flag of dangerousFlags) {
      if (process.env[flag] === 'true') {
        const error = `🚨 PRODUCTION ERROR: ${flag}=true is not allowed in production!`
        console.error(error)
        throw new Error(error)
      }
    }
    
    // Validate required production environment variables
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_API_URL'
    ]
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        const error = `🚨 PRODUCTION ERROR: Required environment variable ${varName} is missing!`
        console.error(error)
        throw new Error(error)
      }
    }
    
    console.log('✅ Production environment validation passed')
  }
}

// ✅ SECURE: Demo data prevention
export function preventDemoDataInProduction(): void {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true') {
    const error = '🚨 CRITICAL: Demo data cannot be used in production!'
    console.error(error)
    throw new Error(error)
  }
}

// ✅ SECURE: Supabase validation
export function validateSupabaseConfiguration(): { hasSupabaseUrl: boolean; hasSupabaseKey: boolean } {
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (process.env.NODE_ENV === 'production') {
    if (!hasSupabaseUrl || !hasSupabaseKey) {
      const error = '🚨 PRODUCTION ERROR: Supabase configuration is required in production!'
      console.error(error)
      throw new Error(error)
    }
  }
  
  return { hasSupabaseUrl, hasSupabaseKey }
}

// ✅ SECURE: Data source validation
export function getValidatedDataSource(): 'demo' | 'supabase' {
  // In production, always use Supabase
  if (process.env.NODE_ENV === 'production') {
    preventDemoDataInProduction()
    validateSupabaseConfiguration()
    return 'supabase'
  }
  
  // In development, check the flag
  if (process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true') {
    console.log('🔧 Development: Using demo data')
    return 'demo'
  }
  
  // Use Supabase if configured
  const { hasSupabaseUrl, hasSupabaseKey } = validateSupabaseConfiguration()
  if (hasSupabaseUrl && hasSupabaseKey) {
    console.log('🔧 Development: Using Supabase data')
    return 'supabase'
  }
  
  // Fallback to demo data in development
  console.log('🔧 Development: Falling back to demo data (Supabase not configured)')
  return 'demo'
}

// ✅ SECURE: Initialize production guard
export function initializeProductionGuard(): void {
  try {
    validateProductionEnvironment()
    
    const dataSource = getValidatedDataSource()
    
    console.log(`🔒 Production Guard: Environment=${process.env.NODE_ENV}, DataSource=${dataSource}`)
    
  } catch (error) {
    console.error('🚨 Production Guard failed:', error)
    
    // In production, crash the app rather than show demo data
    if (process.env.NODE_ENV === 'production') {
      throw error
    }
  }
}

// ✅ SECURE: Runtime checks
export const PRODUCTION_GUARD = {
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  dataSource: getValidatedDataSource(),
  hasSupabase: validateSupabaseConfiguration(),
  
  // Prevent demo data leaks
  assertNotDemo(): void {
    if (this.dataSource === 'demo' && this.isProduction) {
      throw new Error('🚨 CRITICAL: Demo data detected in production!')
    }
  },
  
  // Ensure Supabase is available
  assertSupabase(): void {
    if (!this.hasSupabase.hasSupabaseUrl || !this.hasSupabase.hasSupabaseKey) {
      throw new Error('🚨 CRITICAL: Supabase configuration missing!')
    }
  }
}

// 🎯 Auto-initialize in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  initializeProductionGuard()
}

export default PRODUCTION_GUARD

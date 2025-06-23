/**
 * 🚨 PRODUCTION ENVIRONMENT GUARD
 * 
 * This module prevents development-only code from running in production.
 * It validates environment variables and throws errors if dangerous flags are set.
 */

interface EnvironmentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that the environment is properly configured for production
 */
export function validateProductionEnvironment(): EnvironmentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Only validate in production environment
  if (process.env.NODE_ENV !== 'production') {
    return { isValid: true, errors: [], warnings: [] };
  }
  
  console.log('🔒 Running production environment validation...');
  
  // Critical flags that MUST be false in production
  const dangerousFlags = [
    'NEXT_PUBLIC_USE_MOCK_DATA',
    'NEXT_PUBLIC_DEMO_MODE',
    'NEXT_PUBLIC_USE_DEMO_DATA',
    'NEXT_PUBLIC_DEBUG'
  ];
  
  for (const flag of dangerousFlags) {
    const value = process.env[flag];
    if (value === 'true') {
      errors.push(`CRITICAL: ${flag}=true is not allowed in production!`);
    }
  }
  
  // Required environment variables for production
  const requiredVars = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'BACKEND_URL'
  ];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      errors.push(`REQUIRED: ${varName} must be set in production`);
    } else if (value.includes('localhost') || value.includes('127.0.0.1')) {
      errors.push(`INVALID: ${varName} contains localhost URL in production`);
    }
  }
  
  // Check for development URLs
  const urlVars = [
    'NEXT_PUBLIC_API_URL',
    'BACKEND_URL'
  ];
  
  for (const varName of urlVars) {
    const value = process.env[varName];
    if (value) {
      if (value.includes(':3000') || value.includes(':8000')) {
        errors.push(`INVALID: ${varName} contains development port in production`);
      }
      if (value.startsWith('http://') && !value.includes('localhost')) {
        warnings.push(`WARNING: ${varName} uses HTTP instead of HTTPS`);
      }
    }
  }
  
  // Validate Stripe keys
  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (stripeKey) {
    if (stripeKey.startsWith('pk_test_')) {
      errors.push('CRITICAL: Using Stripe test key in production!');
    } else if (!stripeKey.startsWith('pk_live_')) {
      warnings.push('WARNING: Stripe key format not recognized');
    }
  }
  
  const isValid = errors.length === 0;
  
  // Log results
  if (errors.length > 0) {
    console.error('❌ Production environment validation FAILED:');
    errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️  Production environment warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  if (isValid && warnings.length === 0) {
    console.log('✅ Production environment validation passed');
  }
  
  return { isValid, errors, warnings };
}

/**
 * Throws an error if the environment is not production-ready
 */
export function requireProductionEnvironment(): void {
  const validation = validateProductionEnvironment();
  
  if (!validation.isValid) {
    const errorMessage = [
      '🚨 PRODUCTION DEPLOYMENT BLOCKED!',
      '',
      'The following critical issues must be fixed:',
      ...validation.errors.map(error => `  • ${error}`),
      '',
      'Fix these issues before deploying to production.'
    ].join('\n');
    
    throw new Error(errorMessage);
  }
}

/**
 * Guards against mock data usage in production
 */
export function guardAgainstMockData(context: string): void {
  if (process.env.NODE_ENV === 'production') {
    const mockFlags = [
      'NEXT_PUBLIC_USE_MOCK_DATA',
      'NEXT_PUBLIC_DEMO_MODE',
      'NEXT_PUBLIC_USE_DEMO_DATA'
    ];
    
    for (const flag of mockFlags) {
      if (process.env[flag] === 'true') {
        throw new Error(
          `🚨 PRODUCTION ERROR: Mock data detected in ${context}! ` +
          `${flag}=true is not allowed in production.`
        );
      }
    }
  }
}

/**
 * Guards against demo mode usage in production
 */
export function guardAgainstDemoMode(context: string): void {
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      throw new Error(
        `🚨 PRODUCTION ERROR: Demo mode detected in ${context}! ` +
        `Demo mode is not allowed in production.`
      );
    }
  }
}

/**
 * Safe environment checker that returns false in production
 */
export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Safe demo mode checker that returns false in production
 */
export function isDemoModeAllowed(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false; // Never allow demo mode in production
  }
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/**
 * Safe mock data checker that returns false in production
 */
export function isMockDataAllowed(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false; // Never allow mock data in production
  }
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || 
         process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true';
}

/**
 * Production-safe logging
 */
export const productionLogger = {
  error: (message: string, error?: Error) => {
    console.error(`[PRODUCTION ERROR] ${message}`, error);
  },
  warn: (message: string) => {
    console.warn(`[PRODUCTION WARNING] ${message}`);
  },
  info: (message: string) => {
    if (isDevelopmentMode()) {
      console.log(`[INFO] ${message}`);
    }
  },
  debug: (message: string) => {
    if (isDevelopmentMode()) {
      console.log(`[DEBUG] ${message}`);
    }
  }
};

export default {
  validateProductionEnvironment,
  requireProductionEnvironment,
  guardAgainstMockData,
  guardAgainstDemoMode,
  isDevelopmentMode,
  isDemoModeAllowed,
  isMockDataAllowed,
  productionLogger
}; 
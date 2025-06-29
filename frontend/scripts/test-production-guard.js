#!/usr/bin/env node

/**
 * Test script for production environment validation
 */

function validateProductionEnvironment() {
  const errors = [];
  const warnings = [];
  
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

function requireProductionEnvironment() {
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

// Test the validation
if (require.main === module) {
  console.log('🧪 Testing production environment validation...\n');
  
  console.log('Current environment variables:');
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`NEXT_PUBLIC_USE_MOCK_DATA: ${process.env.NEXT_PUBLIC_USE_MOCK_DATA}`);
  console.log(`NEXT_PUBLIC_DEMO_MODE: ${process.env.NEXT_PUBLIC_DEMO_MODE}`);
  console.log(`NEXT_PUBLIC_USE_DEMO_DATA: ${process.env.NEXT_PUBLIC_USE_DEMO_DATA}`);
  console.log(`BACKEND_URL: ${process.env.BACKEND_URL}`);
  console.log('');
  
  try {
    requireProductionEnvironment();
    console.log('✅ Production environment is safe for deployment');
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  validateProductionEnvironment,
  requireProductionEnvironment
}; 
import { ENV_CONFIG } from '../env-config'

// Environment configuration for AdHub
export const config = {
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  useDemoData: process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true',
  apiUrl: ENV_CONFIG.API_URL,
  supabaseUrl: ENV_CONFIG.SUPABASE_URL,
  supabaseAnonKey: ENV_CONFIG.SUPABASE_ANON_KEY
};

// Environment detection helpers
export const isStaging = () => config.environment === 'staging';
export const isProduction = () => config.environment === 'production';
export const isDevelopment = () => config.environment === 'development';
export const shouldUseAppData = () => config.useDemoData || isDevelopment();
export const isDemoMode = () => config.useDemoData;

// API configuration
export const getApiUrl = () => {
  if (shouldUseAppData()) {
    return null; // No API calls in demo mode
  }
  return config.apiUrl;
};

// Debug logging (only in development)
if (isDevelopment()) {
  console.log('🔧 AdHub Config:', {
    environment: config.environment,
    useDemoData: config.useDemoData,
    apiUrl: config.apiUrl
  });
}

import { ENV_CONFIG } from '../env-config'

// 🎯 Production-only configuration for AdHub
export const config = {
  // Environment detection
  isLocalDev: process.env.NODE_ENV === 'development',
  
  // API and Supabase configuration
  apiUrl: ENV_CONFIG.API_URL,
  supabaseUrl: ENV_CONFIG.SUPABASE_URL,
  supabaseAnonKey: ENV_CONFIG.SUPABASE_ANON_KEY
};

// Environment helpers
export const isLocalDevelopment = () => config.isLocalDev;
export const isDevelopment = isLocalDevelopment; // Alias for backward compatibility

// API configuration
export const getApiUrl = () => config.apiUrl;

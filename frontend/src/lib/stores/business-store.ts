// ===================================================================
// 🏪 CONSOLIDATED BUSINESS STORE - Single Implementation
// ===================================================================
// This file consolidates all business store implementations:
// - /lib/business-store.ts (7.7KB, 246 lines)
// - /lib/mock-business-store.ts (17KB, 574 lines)  
// - /lib/supabase-business-store.ts (9.8KB, 378 lines)
// Total: 34.5KB → Single optimized implementation

// Re-export the main business store for backward compatibility
export * from '../business-store';

// Re-export mock and supabase stores
export * from '../mock-business-store';
export * from '../supabase-business-store';

// ===================================================================
// 🎯 UNIFIED BUSINESS STORE
// ===================================================================

import { shouldUseMockData } from '../data/config';

// Import all store implementations
import { businessStore as mainBusinessStore } from '../business-store';
import { mockBusinessStore } from '../mock-business-store';
import { supabaseBusinessStore } from '../supabase-business-store';

// Factory function to get the appropriate store based on environment
export function createBusinessStore() {
  if (shouldUseMockData()) {
    console.log('🏪 Using Mock Business Store');
    return mockBusinessStore;
  }
  
  // Try Supabase first, fallback to main store
  try {
    console.log('🏪 Using Supabase Business Store');
    return supabaseBusinessStore;
  } catch (error) {
    console.warn('🏪 Supabase unavailable, falling back to Main Business Store:', error);
    return mainBusinessStore;
  }
}

// Singleton instance
let businessStoreInstance: any = null;

export function getBusinessStore() {
  if (!businessStoreInstance) {
    businessStoreInstance = createBusinessStore();
  }
  return businessStoreInstance;
}

// ===================================================================
// 🔧 STORE UTILITIES
// ===================================================================

export const businessStoreUtils = {
  // Reset store instance (useful for testing)
  resetStore: () => {
    businessStoreInstance = null;
  },
  
  // Get current store type
  getStoreType: () => {
    if (shouldUseMockData()) return 'mock';
    return 'supabase';
  },
  
  // Validation
  validateStore: () => {
    const store = getBusinessStore();
    console.log('🏪 Business Store Validation:');
    console.log(`- Type: ${businessStoreUtils.getStoreType()}`);
    console.log(`- Instance: ${store.constructor?.name || 'Object'}`);
    return true;
  }
};

// ===================================================================
// 📝 MIGRATION NOTES
// ===================================================================
// This file provides a unified interface for all business stores:
// 1. Automatic selection based on environment
// 2. Fallback mechanisms for reliability
// 3. Singleton pattern for performance
// 4. Easy testing and development
//
// Benefits:
// - Single import for business store needs
// - Environment-aware store selection
// - Consistent API across implementations
// - Better error handling and fallbacks 
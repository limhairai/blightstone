// ===================================================================
// 🚀 CONSOLIDATED MOCK DATA - Single Source of Truth
// ===================================================================

// Re-export everything from the original mock-data.ts for backward compatibility
export * from '../mock-data';

// Re-export admin mock data with explicit naming to avoid conflicts
export { 
  AdminMockDataGenerator,
  type MockClient,
  type MockBusiness as AdminMockBusiness,
  type MockAdAccount as AdminMockAdAccount,
  type MockApplication,
  type MockTransaction as AdminMockTransaction,
  type MockInventoryItem
} from '../mock-data/admin-mock-data';

// ===================================================================
// 📊 CONSOLIDATED ACCESS POINT
// ===================================================================

import { AdminMockDataGenerator } from '../mock-data/admin-mock-data';

// Utility to access all mock data in one place
export const getAllMockData = () => ({
  admin: AdminMockDataGenerator.getInstance()
}); 
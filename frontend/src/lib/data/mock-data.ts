// ===================================================================
// 🚀 CONSOLIDATED MOCK DATA - Single Source of Truth
// ===================================================================

// Re-export everything from the original mock-data.ts for backward compatibility
export * from '../mock-data';

// Re-export admin mock data with explicit naming to avoid conflicts
export { 
  AdminAppDataGenerator,
  type AppClient,
  type AppBusiness as AdminAppBusiness,
  type AppAdAccount as AdminAppAdAccount,
  type AppApplication,
  type AppTransaction as AdminAppTransaction,
  type AppInventoryItem
} from '../mock-data/admin-mock-data';

// ===================================================================
// 📊 CONSOLIDATED ACCESS POINT
// ===================================================================

import { AdminAppDataGenerator } from '../mock-data/admin-mock-data';

// Utility to access all mock data in one place
export const getAllMockData = () => ({
  admin: AdminAppDataGenerator.getInstance()
}); 
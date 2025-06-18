# Mock Data System Guide

## Overview

This application uses a centralized mock data system located in `src/lib/mock-data.ts` that serves as the single source of truth for all mock data across the application.

## Architecture

### 📁 Centralized Location
- **File**: `src/lib/mock-data.ts`
- **Purpose**: Single source of truth for all mock data
- **Benefits**: Consistency, easy maintenance, automatic data relationships

### 🏗️ Data Structure

#### Core Data Types

1. **MockBusiness** - Business/company information
   - Business details, status, industry
   - Account counts, balances, spending
   - BM IDs for active/suspended businesses
   - Domain verification status

2. **MockAccount** - Ad account information
   - Account details, platform, status
   - Balance, spend limits, quotas
   - Business relationships
   - Timezone and date information

3. **MockTransaction** - Transaction history
   - Spend, deposit, withdrawal records
   - Timestamps and account associations
   - Amount and type information

4. **MockFinancialData** - Core financial metrics
   - Wallet balance, available balance
   - Monthly spend, credit limits
   - Growth percentages

### 🔗 Data Relationships

The mock data maintains proper relationships:
- **Accounts → Businesses**: Each account belongs to a business
- **Business Metrics**: Automatically calculated from account data
- **Consistent Balances**: Business totals match sum of account balances
- **Account Counts**: Business account counts match actual accounts

## Usage

### Importing Data

```typescript
// Import specific data sets
import { MOCK_BUSINESSES, MOCK_ACCOUNTS, MOCK_FINANCIAL_DATA } from "@/lib/mock-data"

// Import types
import type { MockBusiness, MockAccount } from "@/lib/mock-data"

// Import helper functions
import { formatCurrency, getTotalAccountsBalance } from "@/lib/mock-data"
```

### Components Using Mock Data

#### Business Components
- `businesses-metrics.tsx` - Business overview statistics
- `businesses-table.tsx` - Business listing and management
- `businesses-view-toggle.tsx` - Grid/list view switching

#### Account Components  
- `compact-accounts-table.tsx` - Account grid view
- `accounts-table.tsx` - Account table view
- `accounts-metrics.tsx` - Account statistics
- `compact-filters.tsx` - Dynamic filtering

#### Layout Components
- `topbar.tsx` - Wallet balance display
- `compact-header-metrics.tsx` - Header statistics
- `organization-selector.tsx` - Business switching

## Data Validation

The system includes automatic validation to ensure data consistency:

```typescript
import { validateMockData } from "@/lib/mock-data"

const validation = validateMockData()
if (!validation.isValid) {
  console.warn('Data issues:', validation.errors)
}
```

### Validation Checks
- ✅ Business names in accounts match business records
- ✅ Business account counts match actual account data
- ✅ Business total balances match sum of account balances
- ✅ All required relationships are maintained

## Modifying Mock Data

### Adding New Businesses

```typescript
// Add to MOCK_BUSINESSES array
{
  id: "5",
  name: "New Company",
  status: "active",
  dateCreated: "Jan 15, 2024",
  accountsCount: 1, // Must match actual accounts
  totalBalance: 1500.0, // Must match sum of account balances
  totalSpend: 2000,
  monthlyQuota: 10000,
  industry: "Technology",
  description: "Description here",
  bmId: "1234567890123456", // Only for active/suspended
  domains: [{ domain: "company.com", verified: true }],
}
```

### Adding New Accounts

```typescript
// Add to MOCK_ACCOUNTS array
{
  id: 6,
  name: "New Campaign",
  business: "New Company", // Must match business name exactly
  adAccount: "6789012345678901",
  status: "active",
  balance: 1500.0, // Will be included in business total
  spendLimit: 3000.0,
  dateAdded: "Jan 16, 2024",
  quota: 8000,
  spent: 1200,
  platform: "Meta",
  timezone: "America/New_York",
}
```

### Updating Financial Data

```typescript
// Modify MOCK_FINANCIAL_DATA
export const MOCK_FINANCIAL_DATA = {
  walletBalance: 50000.00, // Main wallet balance
  availableBalance: 47500.00,
  monthlyAdSpend: 15000.00,
  creditLimit: 60000.00,
  monthlyGrowth: 15.2,
}
```

## Helper Functions

### Formatting
- `formatCurrency(amount)` - Format numbers as currency
- `formatRelativeTime(timestamp)` - Format timestamps
- `formatNumber(number)` - Format large numbers

### Calculations
- `getTotalAccountsBalance()` - Sum all account balances
- `getActiveAccountsCount()` - Count active accounts
- `getTotalSpentThisMonth()` - Calculate monthly spend
- `getRecentTransactions(limit)` - Get recent transactions

## Migration from Old System

### Deleted Files
- ❌ `src/data/mock-businesses.ts`
- ❌ `src/data/mock-accounts.ts`  
- ❌ `src/utils/mockAccounts.ts`

### Updated Imports
All components now import from `@/lib/mock-data` instead of separate files.

## Best Practices

### 1. Maintain Relationships
Always ensure business names in accounts match business records exactly.

### 2. Update Counts
When adding/removing accounts, update the corresponding business's `accountsCount`.

### 3. Balance Consistency  
Ensure business `totalBalance` equals the sum of its accounts' balances.

### 4. Use Validation
Run `validateMockData()` after making changes to catch inconsistencies.

### 5. Consistent Formatting
Use the provided helper functions for consistent number/currency formatting.

## Future Enhancements

### Real API Integration
When connecting to real APIs, replace imports:

```typescript
// From:
import { MOCK_BUSINESSES } from "@/lib/mock-data"

// To:
import { useBusinesses } from "@/hooks/api/use-businesses"
```

### Dynamic Data
The centralized system makes it easy to:
- Add real-time updates
- Implement optimistic updates
- Cache management
- State synchronization

## Troubleshooting

### Common Issues

1. **Data Inconsistency**: Run validation to identify issues
2. **Import Errors**: Ensure importing from `@/lib/mock-data`
3. **Type Errors**: Use proper TypeScript types from the same file
4. **Missing Data**: Check that all required relationships exist

### Debug Commands

```typescript
// Check data consistency
console.log(validateMockData())

// Inspect relationships
console.log('Businesses:', MOCK_BUSINESSES.map(b => b.name))
console.log('Account businesses:', [...new Set(MOCK_ACCOUNTS.map(a => a.business))])

// Verify calculations
console.log('Total balance:', getTotalAccountsBalance())
```

---

This centralized system provides a robust foundation for mock data that's easy to maintain, extend, and eventually replace with real API calls. 
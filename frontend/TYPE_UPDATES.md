# Type System Updates - Database Schema Alignment

This document outlines the updates made to align our TypeScript types with the actual database schema after recent migrations.

## Key Changes Made

### 1. Removed Deprecated Fields

**From Business Interface:**
- ❌ `business_type` - Removed in migration 20250625000007
- ❌ `industry` - Removed in migration 20250625000002  
- ❌ `spend_limit` - Removed in migration 20250625231450
- ❌ `description` - Removed in migration 20250625000007
- ❌ `campaign_objective` - Removed in migration 20250625000007
- ❌ `country` - Removed in migration 20250625000007
- ❌ `verification` - Removed in migration 20250627050000
- ❌ `website` - Removed in migration 20250627050000 (redundant with website_url)

**From Organization Interface:**
- ❌ `verification_status` - Removed in migration 20250627050000
- ❌ `support_channel_type` - Removed in migration 20250627050000
- ❌ `support_channel_contact` - Removed in migration 20250627050000
- ❌ `telegram_alerts_enabled` - Removed in migration 20250627050000
- ❌ `telegram_alert_thresholds` - Removed in migration 20250627050000

**From Wallet Interface:**
- ❌ `currency` - Removed in migration 20250627050000 (always USD)

**From User Profile Interface:**
- ❌ `telegram_id` - Removed in migration 20250627050000

**From Ad Account Interface:**
- ❌ `platform` - Removed in migration 20250625000007 (always Meta/Facebook)
- ❌ `spend_limit` - Removed in migration 20250625231450
- ❌ `quota` - Never existed in database

### 2. Consolidated Account Types

We had duplicate account types. Now we have:

- **`AdAccount`** - Primary interface matching database schema
- **`AppAccount`** - Legacy interface for backward compatibility
- **`Account`** - Simple interface for basic use cases

### 3. Updated Database-Aligned Types

**Business (Current Schema):**
```typescript
interface Business {
  id: string;
  organization_id: string;
  name: string;
  business_id: string | null;
  status: string;
  website_url: string | null;
  landing_page: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}
```

**Organization (Current Schema):**
```typescript
interface Organization {
  id: string;
  name: string;
  owner_id: string;
  plan_id?: string;
  avatar_url?: string;
  balance?: number; // Deprecated - use wallet balance
  monthly_spent?: number;
  total_spent?: number;
  current_team_members_count: number;
  current_businesses_count: number;
  current_ad_accounts_count: number;
  current_monthly_spend_cents: number;
  ad_spend_monthly?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_subscription_status?: string;
  last_payment_at?: string;
  created_at: string;
  updated_at: string;
}
```

**Wallet (Current Schema):**
```typescript
interface Wallet {
  id: string;
  organization_id: string;
  balance_cents: number; // Always in USD cents
  created_at: string;
  updated_at: string;
}
```

**AdAccount (Current Schema):**
```typescript
interface AdAccount {
  id: string;
  business_id: string;
  user_id: string;
  name: string;
  account_id: string;
  status: AdAccountStatus;
  balance: number;
  spent: number;
  last_activity: string | null;
  created_at: string;
  updated_at: string;
}
```

**Transaction (Current Schema):**
```typescript
interface Transaction {
  id: string;
  organization_id: string;
  wallet_id: string;
  business_id?: string;
  type: "deposit" | "withdrawal" | "spend" | "refund";
  amount_cents: number;
  status: TransactionStatus;
  description?: string;
  metadata?: Record<string, any>;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}
```

## Simplification Philosophy

The recent updates follow a **simplified business model**:

1. **Businesses** - Just name, website, and basic status (no complex verification workflows)
2. **Organizations** - Core fields only (no telegram/support integrations)
3. **Wallets** - Always USD, balance in cents (no multi-currency complexity)
4. **Ad Accounts** - Always Meta/Facebook platform (no multi-platform complexity)

## Migration Strategy

1. **Primary Types**: Use `AdAccount`, `Business`, `Transaction`, `Organization` for new code
2. **Legacy Support**: Keep `AppAccount`, `AppBusiness` etc. for backward compatibility
3. **Gradual Migration**: Update components one by one to use new types
4. **Centralized Exports**: Import from `@/types` for consistency

## Files Updated

- `frontend/src/types/business.ts` - Removed verification, website fields
- `frontend/src/types/account.ts` - Consolidated account types
- `frontend/src/types/ad-account.ts` - Already accurate
- `frontend/src/types/transaction.ts` - Updated to match database
- `frontend/src/types/organization.ts` - **NEW** - Removed telegram/support fields
- `frontend/src/types/user.ts` - Removed telegram_id
- `frontend/src/types/index.ts` - **NEW** - Central export file
- `frontend/src/services/supabase-service.ts` - Updated imports
- `supabase/migrations/20250627050000_remove_unnecessary_fields.sql` - **NEW** - Database cleanup

## Next Steps

1. Run the new migration to clean up database schema
2. Update components to use new simplified types
3. Remove legacy types once all components are updated  
4. Add proper validation for required fields
5. Consider adding Zod schemas for runtime validation 
# Business Store System

This document explains the new unified business store system that can switch between mock data and Supabase database operations.

## Overview

The business store system provides a unified interface for managing businesses and ad accounts, with the ability to switch between:
- **Mock Store**: In-memory data for development and testing
- **Supabase Store**: Real database operations with persistent data

## Configuration

The store type is determined by environment variables:

```bash
# Use Supabase (production or when explicitly enabled)
NEXT_PUBLIC_USE_SUPABASE=true

# Use Mock Store (default for development)
# NEXT_PUBLIC_USE_SUPABASE=false (or not set)
```

## Features

### Mock Store
- ✅ In-memory data storage
- ✅ Simulated approval workflows (3s for businesses, 2s for ad accounts)
- ✅ Real-time UI updates via custom events
- ✅ Realistic demo data with proper relationships
- ✅ Resets on page refresh

### Supabase Store
- ✅ Persistent database storage
- ✅ Real user authentication and RLS policies
- ✅ Proper foreign key relationships
- ✅ Same approval workflow simulation
- ✅ Real-time UI updates via custom events
- ✅ Demo data seeding function

## Database Schema

### Businesses Table
```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  business_id TEXT UNIQUE NOT NULL, -- Facebook Business Manager ID
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended', 'inactive')),
  verification TEXT NOT NULL DEFAULT 'pending' CHECK (verification IN ('verified', 'not_verified', 'pending')),
  landing_page TEXT,
  website TEXT,
  business_type TEXT,
  description TEXT,
  country TEXT DEFAULT 'US',
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Ad Accounts Table
```sql
CREATE TABLE ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_id TEXT UNIQUE NOT NULL, -- Platform-specific account ID
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'paused', 'error')),
  balance DECIMAL(10,2) DEFAULT 0,
  spent DECIMAL(10,2) DEFAULT 0,
  spend_limit DECIMAL(10,2) DEFAULT 5000,
  platform TEXT NOT NULL CHECK (platform IN ('Meta', 'TikTok')),
  last_activity TEXT DEFAULT 'Just created',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Interface

Both stores implement the same interface:

```typescript
interface BusinessStore {
  getBusinesses(): Promise<Business[]>
  getBusiness(id: string): Promise<Business | null>
  createBusiness(data: CreateBusinessData): Promise<Business>
  createAdAccount(data: CreateAdAccountData): Promise<AdAccount>
  getApprovedBusinesses(): Promise<Business[]>
  getAdAccountsForBusiness(businessId: string): Promise<AdAccount[]>
  updateBusinessStatus(businessId: string, status: string, verification?: string): Promise<void>
  updateAdAccountStatus(accountId: string, status: string): Promise<void>
  addBalance(accountId: string, amount: number): Promise<void>
  seedDemoData(): Promise<void>
  clearAllData(): Promise<void>
  getStoreType(): 'supabase' | 'mock'
}
```

## Demo Data

### Seeding Demo Data

**Mock Store**: Demo data is automatically available
**Supabase Store**: Use the demo data panel or call:

```typescript
await businessStore.seedDemoData()
```

### Demo Data Includes

- 3 sample businesses:
  - My E-Commerce Store (active, verified)
  - Blog Network (pending, pending verification)
  - Affiliate Marketing Hub (active, verified)
- 5 ad accounts for Meta (Facebook & Instagram)
- Realistic spend data, balances, and account statuses
- Proper business → ad account relationships

## Real-time Updates

Both stores use custom browser events for real-time UI updates:

```typescript
// Business approval
window.addEventListener('businessApproved', (event) => {
  console.log('Business approved:', event.detail.businessId)
})

// Ad account activation
window.addEventListener('adAccountActivated', (event) => {
  console.log('Ad account activated:', event.detail.accountId)
})
```

## Components

### Enhanced Businesses View
- Main businesses list with ad account summaries
- Metrics cards with aggregated data
- Search and filtering
- Real-time updates

### Business Detail View
- Individual business information
- Associated ad accounts table
- Business-specific metrics
- Contextual ad account creation

### Create Business Dialog
- Full form validation
- Success states with approval workflow
- Real-time notifications

### Create Ad Account Dialog
- Business validation and selection
- Platform and spend limit configuration
- Success feedback with activation process

### Demo Data Panel
- Seed demo data
- Clear all data
- Store type indicator
- Environment information

## Usage Examples

### Switch to Supabase
```bash
# In your .env.local file
NEXT_PUBLIC_USE_SUPABASE=true
```

### Create a Business
```typescript
const business = await businessStore.createBusiness({
  businessName: "My New Business",
  website: "https://example.com",
  businessType: "ecommerce",
  description: "A sample business",
  country: "US",
  timezone: "America/New_York"
})
```

### Create an Ad Account
```typescript
const account = await businessStore.createAdAccount({
  businessId: "business-uuid",
  name: "Marketing Campaign",
  spendLimit: 5000
})
```

## Migration

The system includes Supabase migrations to set up the database schema:

```bash
# Apply migrations
npx supabase migration up

# Reset database (development only)
npx supabase db reset
```

## Production Deployment

1. Set `NEXT_PUBLIC_USE_SUPABASE=true` in production environment
2. Ensure Supabase project is properly configured
3. Run migrations on production database
4. Test with demo data seeding

## Development Workflow

1. **Development**: Use mock store for fast iteration
2. **Testing**: Switch to Supabase to test real database operations
3. **Demo**: Use demo data panel to quickly populate data
4. **Production**: Deploy with Supabase enabled

This system provides the best of both worlds - fast development with mock data and production-ready database integration with the same codebase. 
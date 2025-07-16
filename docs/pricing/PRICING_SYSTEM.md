# AdHub Pricing System

## Overview

AdHub uses a feature flag-based pricing system that allows you to easily toggle between different pricing models and features. This system is designed to support the transition from the old complex pricing model to the new simplified model.

## Current Pricing Models

### Active Pricing Model ✅
**Status**: Currently enabled and active

```
Starter: $79/month + 1% ad spend fee
- 3 Business Managers
- 15 Ad Accounts
- Unlimited Replacements
- No Spend Limits

Growth: $299/month + 1% ad spend fee
- 3 Business Managers
- 20 Ad Accounts
- Unlimited Replacements
- No Spend Limits

Scale: $799/month + 1% ad spend fee
- 10 Business Managers
- 50 Ad Accounts
- Unlimited Replacements
- No Spend Limits
```

**Feature Flag Status:**
- ✅ New pricing model: **ENABLED**
- ❌ Monthly topup limits: **DISABLED** (feature flag off)
- ✅ Ad spend fees: **ENABLED** (1% across all plans)
- ❌ Domain limits: **DISABLED**
- ❌ Team limits: **DISABLED**

### Legacy Pricing Model (Disabled)
**Status**: Available but disabled via feature flags

- Complex tiered ad spend fees (3-6%)
- Monthly topup limits (Starter: $3K/month, Growth: $6K/month)
- Domain limits
- Team member limits

**Monthly Topup Limits Ready**: The system has complete topup limit functionality implemented:
- ✅ Database functions (`get_monthly_topup_usage`, `can_make_topup_request`)
- ✅ API endpoints (`/api/topup-limits`)
- ✅ Frontend components with limit checking
- ✅ Migration files with proper limits set
- ❌ **Currently disabled** via `enableTopupLimits: false`

*Ready to enable instantly if needed for specific plans or regulatory requirements.*

## Feature Flags

The pricing system is controlled by feature flags in `frontend/src/lib/config/pricing-config.ts`:

- `enableTopupLimits`: Monthly topup limits per plan
- `enableAdSpendFees`: Percentage-based ad spend fees
- `enableDomainLimits`: Domain tracking limits
- `enableTeamLimits`: Team member limits
- `newPricingModel.enabled`: New simplified pricing model

## Managing Pricing Features

### Using the Toggle Script

```bash
# View current configuration
node scripts/toggle-pricing-features.js

# Disable all old features (recommended for new model)
node scripts/toggle-pricing-features.js topup-limits false
node scripts/toggle-pricing-features.js domain-limits false
node scripts/toggle-pricing-features.js team-limits false

# Enable/disable ad spend fees
node scripts/toggle-pricing-features.js ad-spend-fees true   # Enable 1% fee
node scripts/toggle-pricing-features.js ad-spend-fees false # Disable all fees
```

### Manual Configuration

Edit `frontend/src/lib/config/pricing-config.ts`:

```typescript
export const PRICING_CONFIG: PricingConfig = {
  // Feature flags - set to false to disable old features
  enableTopupLimits: false,     // Remove monthly topup limits
  enableAdSpendFees: true,      // Keep 1% ad spend fee
  enableDomainLimits: false,    // Remove domain limits
  enableTeamLimits: false,      // Remove team limits
  
  // New pricing model
  newPricingModel: {
    enabled: true,
    plans: {
      starter: {
        price: 79,
        businessManagers: 3,
        adAccounts: 15,
        adSpendFee: 1, // 1% or 0 for no fee
        unlimitedReplacements: true,
      },
      // ... other plans
    },
  },
};
```

## Implementation Details

### How Feature Flags Work

1. **API Level**: Routes check feature flags before applying limits
2. **Component Level**: UI components conditionally render based on flags
3. **Database Level**: Existing database functions remain but are bypassed
4. **Upgrade Dialog**: Plan upgrade dialog uses new pricing config when enabled

### Code Examples

```typescript
// In API routes
import { shouldEnableTopupLimits } from '@/lib/config/pricing-config';

if (shouldEnableTopupLimits()) {
  // Check topup limits
}

// In React components
import { shouldEnableAdSpendFees } from '@/lib/config/pricing-config';

if (shouldEnableAdSpendFees()) {
  // Show fee calculation
}
```

## Migration Strategy

### Phase 1: Feature Flags (Current)
- All old features disabled by default
- New pricing model enabled
- Easy rollback if needed

### Phase 2: Database Cleanup (Future)
- Remove unused database columns
- Clean up old migration files
- Simplify database schema

### Phase 3: Code Cleanup (Future)
- Remove old pricing logic
- Simplify components
- Remove feature flag system

## Rollback Plan

If you need to rollback to the old pricing model:

```bash
# Enable old features
node scripts/toggle-pricing-features.js topup-limits true
node scripts/toggle-pricing-features.js ad-spend-fees true
node scripts/toggle-pricing-features.js domain-limits true
node scripts/toggle-pricing-features.js team-limits true

# Disable new pricing
node scripts/toggle-pricing-features.js new-pricing false
```

## Testing

### Test Different Configurations

1. **New Model (No Fees)**:
   ```bash
   node scripts/toggle-pricing-features.js ad-spend-fees false
   ```

2. **New Model (With 1% Fee)**:
   ```bash
   node scripts/toggle-pricing-features.js ad-spend-fees true
   ```

3. **Legacy Model**:
   ```bash
   node scripts/toggle-pricing-features.js topup-limits true
   node scripts/toggle-pricing-features.js ad-spend-fees true
   ```

### Verify Changes

- Check topup dialogs for fee calculations
- Test topup request submissions
- Verify plan limit enforcement
- Check pricing display in UI
- Test upgrade dialog shows correct pricing
- Verify ad spend fees are hidden when disabled

## Database Schema

The database schema supports both pricing models:

- `plans.monthly_topup_limit_cents` - Used when topup limits enabled
- `topup_requests.fee_amount_cents` - Used when ad spend fees enabled
- `topup_requests.plan_fee_percentage` - Used when ad spend fees enabled

When features are disabled, these columns are ignored but remain for rollback purposes.

## Best Practices

1. **Always test in development** before changing production flags
2. **Use the toggle script** instead of manual editing when possible
3. **Document any custom configurations** for your team
4. **Monitor customer feedback** after pricing changes
5. **Keep rollback plan ready** in case of issues

## Troubleshooting

### Common Issues

1. **Feature flags not working**: Check import paths and function calls
2. **Database errors**: Ensure migrations are up to date
3. **UI not updating**: Clear browser cache and restart development server
4. **Inconsistent pricing**: Verify all feature flags are set correctly

### Debug Commands

```bash
# Check current configuration
grep -A 20 "PRICING_CONFIG" frontend/src/lib/config/pricing-config.ts

# Find feature flag usage
grep -r "shouldEnable" frontend/src/

# Check database schema
psql -c "\d plans" your_database_name
``` 
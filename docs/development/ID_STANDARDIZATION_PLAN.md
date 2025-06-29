# ID Standardization Plan

## Current Problem
We have multiple ID fields that should reference the same thing, causing confusion:
- `business_managers.bm_id` (UUID) - internal database ID
- `business_managers.dolphin_business_manager_id` (TEXT) - Dolphin API ID
- `dolphin_assets.asset_id` (UUID) - internal database ID  
- `dolphin_assets.dolphin_asset_id` (TEXT) - **THE SOURCE OF TRUTH** from Dolphin API
- Various other ID fields in different tables

## Gradual Refactoring Plan

### ✅ Phase 1: Fix Immediate Bugs (DONE)
- [x] Fixed business manager detail API to use correct table (`business_managers` not `businesses`)
- [x] Fixed column references (`bm_id` not `id`)
- [x] Updated asset bindings to use correct tables
- [x] Created ID utility functions for standardization

### 🔄 Phase 2: Standardize Column Names (NEXT)
- [ ] Rename `bm_id` → `business_manager_id` for clarity
- [ ] Rename `asset_id` → `internal_id` to distinguish from Dolphin IDs
- [ ] Update all references to use new column names
- [ ] Add database migration

### 📋 Phase 3: Create Abstraction Layer (FUTURE)
- [ ] Create database views that hide complexity
- [ ] Add helper functions for consistent data access
- [ ] Update APIs to use abstraction layer
- [ ] Maintain backward compatibility

### 🎯 Phase 4: Clean Schema (LONG TERM)
- [ ] Make `dolphin_asset_id` the primary key
- [ ] Remove redundant tables (`business_managers`, `ad_accounts`)
- [ ] Use only `dolphin_assets` + `client_asset_bindings`
- [ ] Major version bump

## Files Already Updated

### APIs Fixed
- `frontend/src/app/api/admin/business-managers/[bmId]/route.ts` - Fixed to use `bm_id`
- `frontend/src/app/api/business-managers/route.ts` - Fixed DELETE operation
- `frontend/src/app/api/admin/asset-bindings/route.ts` - Fixed table references
- `frontend/src/app/api/admin/businesses/[businessId]/route.ts` - Updated to use business_managers table

### Utilities Added
- `frontend/src/lib/id-utils.ts` - Helper functions for ID standardization

## Next Steps
1. Test current fixes to ensure business manager detail page works
2. Plan Phase 2 column renaming migration
3. Gradually update components to use ID utility functions
4. Monitor for any remaining ID-related bugs

## Benefits of Gradual Approach
- ✅ No breaking changes during development
- ✅ Can test each phase independently  
- ✅ Easier to rollback if issues arise
- ✅ Maintains system stability
- ✅ Clear migration path to clean schema 
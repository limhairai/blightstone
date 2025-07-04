# Semantic ID Migration Guide

This directory contains scripts and documentation for migrating from generic `id` fields to semantic IDs throughout the AdHub application.

## 🎯 **Migration Goals**

**Problem**: Generic `id` fields cause confusion and bugs
- `application.id` vs `asset.id` vs `binding.id` - which is which?
- API responses mixing different ID types
- Frontend components accessing wrong ID fields
- Database queries using wrong column names

**Solution**: Semantic IDs that clearly indicate their purpose
- `application.application_id` → `applicationId` (frontend)
- `asset.asset_id` → `assetId` (frontend)  
- `asset_binding.binding_id` → `bindingId` (frontend)
- `profiles.profile_id` → `profileId` (frontend)

## 📋 **Migration Process**

### Phase 1: Database Migration
```bash
# Run the database migration
python scripts/migration/run_semantic_id_migration.py
```

This will:
- ✅ Add semantic primary key columns
- ✅ Update foreign key references
- ✅ Update stored functions
- ✅ Recreate indexes
- ✅ Create TypeScript type definitions

### Phase 2: Backend Updates (Manual)
Update these critical files:
- `backend/app/api/endpoints/admin.py`
- `backend/app/api/endpoints/applications.py`
- `backend/app/api/endpoints/assets.py`
- `backend/app/services/subscription_service.py`

**Key Changes**:
```python
# Before
.eq("id", application_id)

# After  
.eq("application_id", application_id)  # for application table
.eq("asset_id", asset_id)             # for asset table
.eq("binding_id", binding_id)         # for asset_binding table
.eq("profile_id", profile_id)         # for profiles table
```

### Phase 3: Frontend Updates (Manual)
Update these critical files:
- `frontend/src/types/application.ts`
- `frontend/src/types/asset.ts`
- `frontend/src/components/admin/applications-table.tsx`
- `frontend/src/components/admin/assets-table.tsx`
- `frontend/src/app/admin/applications/page.tsx`
- `frontend/src/app/admin/assets/page.tsx`

**Key Changes**:
```typescript
// Before
interface Application {
  id: string;
  // ...
}

// After
interface Application {
  applicationId: string;
  // ...
}
```

## 🔄 **Field Mapping Reference**

| Database (snake_case) | Frontend (camelCase) | Description |
|----------------------|---------------------|-------------|
| `application_id`     | `applicationId`     | Application primary key |
| `asset_id`           | `assetId`           | Asset primary key |
| `binding_id`         | `bindingId`         | Asset binding primary key |
| `profile_id`         | `profileId`         | Profile primary key |
| `fulfillment_id`     | `fulfillmentId`     | Application fulfillment primary key |

## 🧪 **Testing Checklist**

After migration, verify:
- [ ] Applications page loads correctly
- [ ] Assets page loads correctly  
- [ ] Asset binding/unbinding works
- [ ] Organization detail page shows assets
- [ ] Admin panel functions work
- [ ] API responses use correct field names
- [ ] No TypeScript compilation errors
- [ ] All database queries work correctly

## 🚀 **Benefits**

1. **Eliminates ID Confusion**: Clear semantic naming prevents mixing up different entity IDs
2. **Follows Industry Standards**: Matches patterns used by Stripe, Shopify, Slack, etc.
3. **Improves Code Readability**: `application.applicationId` is much clearer than `application.id`
4. **Prevents Bugs**: Type safety and semantic naming catch errors at compile time
5. **Better Developer Experience**: IntelliSense and code completion work better

## 📁 **Files Created**

- `supabase/migrations/20250109000000_implement_semantic_ids.sql` - Database migration
- `frontend/src/types/generated/semantic-ids.ts` - TypeScript type definitions
- `SEMANTIC_ID_MIGRATION_SUMMARY.md` - Detailed migration summary

## ⚠️ **Important Notes**

1. **Test Thoroughly**: This is a breaking change that affects the entire application
2. **Backup First**: Ensure you have database backups before running the migration
3. **Coordinate Deployment**: Backend and frontend changes must be deployed together
4. **Monitor Carefully**: Watch for any issues after deployment

## 🔧 **Troubleshooting**

**Database Migration Fails**:
- Check Supabase CLI is installed and working
- Ensure you're in the project root directory
- Check database connection

**API Errors After Migration**:
- Verify all `.eq("id", ...)` calls are updated to use semantic column names
- Check API response field transformations

**Frontend Compilation Errors**:
- Update TypeScript interfaces to use semantic IDs
- Check component prop types match new interfaces
- Verify API call parameter names

## 📞 **Support**

If you encounter issues during migration:
1. Check the migration summary document
2. Verify all manual updates were completed
3. Test individual components in isolation
4. Roll back if critical issues arise 
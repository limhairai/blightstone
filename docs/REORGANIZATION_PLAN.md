# 🗂️ Repository Reorganization Plan

## 📊 Current Issues

### Root Directory Clutter (24 files + 17 directories)
The root directory has become cluttered with various files that should be organized into logical groups.

## 🎯 Proposed Structure

```
adhub/
├── 📁 database/                    # All database-related files
│   ├── schema/
│   │   ├── actual_schema.sql
│   │   └── setup-admin-user.sql
│   ├── migrations/                 # Move from supabase/migrations/
│   └── adhub.db
│
├── 📁 config/                      # All configuration files
│   ├── jest.config.js
│   ├── jest.setup.js
│   ├── playwright.config.ts
│   ├── .babelrc
│   ├── .eslintrc.json
│   ├── tsconfig.json
│   └── sentry/
│       ├── sentry.client.config.ts
│       └── sentry.server.config.ts
│
├── 📁 scripts/                     # Keep existing but reorganize
│   ├── database/
│   │   ├── update_transaction_crud.js
│   │   ├── update_account_crud.js
│   │   └── update_crud_operations.js
│   ├── testing/                    # Move from root
│   │   ├── test-integration.tsx
│   │   ├── test-org.js
│   │   └── test-org-creation.js
│   └── [existing scripts structure]
│
├── 📁 tests/                       # E2E tests (keep existing)
├── 📁 docs/                        # Documentation (reorganize)
│   ├── api/
│   │   └── STRIPE_TEST_CARDS.md    # Move from root
│   └── [existing docs structure]
│
├── 📁 frontend/                    # Keep as-is
├── 📁 backend/                     # Keep as-is
├── 📁 telegram-bot/                # Keep as-is
├── 📁 tools/                       # Keep as-is
├── 📁 archive/                     # Keep as-is
├── 📁 backups/                     # Keep as-is
│
└── 📄 Root files (minimal)
    ├── package.json
    ├── package-lock.json
    ├── .gitignore
    └── README.md
```

## 🚀 Implementation Steps

### Step 1: Create New Directory Structure
```bash
mkdir -p database/schema
mkdir -p config/sentry
mkdir -p scripts/database
mkdir -p scripts/testing
mkdir -p docs/api
```

### Step 2: Move Database Files
```bash
mv actual_schema.sql database/schema/
mv setup-admin-user.sql database/schema/
mv adhub.db database/
```

### Step 3: Move Configuration Files
```bash
mv jest.config.js config/
mv jest.setup.js config/
mv playwright.config.ts config/
mv .babelrc config/
mv sentry.client.config.ts config/sentry/
mv sentry.server.config.ts config/sentry/
```

### Step 4: Move Scripts
```bash
mv update_transaction_crud.js scripts/database/
mv update_account_crud.js scripts/database/
mv update_crud_operations.js scripts/database/
mv test-integration.tsx scripts/testing/
mv test-org.js scripts/testing/
mv test-org-creation.js scripts/testing/
```

### Step 5: Move Documentation
```bash
mv STRIPE_TEST_CARDS.md docs/api/
```

### Step 6: Update Import Paths
- Update all import statements to reflect new file locations
- Update package.json script paths
- Update config file references

## 📋 Files to Move

### Database Files → `database/`
- ✅ `actual_schema.sql` → `database/schema/`
- ✅ `setup-admin-user.sql` → `database/schema/`
- ✅ `adhub.db` → `database/`

### Configuration Files → `config/`
- ✅ `jest.config.js` → `config/`
- ✅ `jest.setup.js` → `config/`
- ✅ `playwright.config.ts` → `config/`
- ✅ `.babelrc` → `config/`
- ✅ `sentry.client.config.ts` → `config/sentry/`
- ✅ `sentry.server.config.ts` → `config/sentry/`

### Scripts → `scripts/database/`
- ✅ `update_transaction_crud.js` → `scripts/database/`
- ✅ `update_account_crud.js` → `scripts/database/`
- ✅ `update_crud_operations.js` → `scripts/database/`

### Test Files → `scripts/testing/`
- ✅ `test-integration.tsx` → `scripts/testing/`
- ✅ `test-org.js` → `scripts/testing/`
- ✅ `test-org-creation.js` → `scripts/testing/`

### Documentation → `docs/api/`
- ✅ `STRIPE_TEST_CARDS.md` → `docs/api/`

## 🔧 Configuration Updates Needed

### 1. Update package.json
```json
{
  "scripts": {
    "test": "jest --config=config/jest.config.js",
    "test:e2e": "playwright test --config=config/playwright.config.ts"
  }
}
```

### 2. Update Jest Config Path
```javascript
// config/jest.config.js
setupFilesAfterEnv: ['<rootDir>/config/jest.setup.js']
```

### 3. Update Playwright Config
```typescript
// config/playwright.config.ts
// Update any relative paths
```

### 4. Update Sentry Imports
```typescript
// Update any files importing Sentry configs
import './config/sentry/sentry.client.config'
```

## 🎯 Benefits

### Cleaner Root Directory
- Reduce root files from 24 to ~4 essential files
- Easier navigation and understanding
- Better developer experience

### Logical Grouping
- Database files together
- Configuration files together
- Scripts organized by purpose
- Documentation properly categorized

### Easier Maintenance
- Clear separation of concerns
- Easier to find related files
- Better for new developers joining project

## ⚠️ Considerations

### Git History
- Use `git mv` to preserve file history
- Consider creating a migration commit

### CI/CD Updates
- Update any GitHub Actions workflows
- Update deployment scripts
- Update Docker configurations if any

### Documentation Updates
- Update README files
- Update any setup guides
- Update development documentation

## 🏁 Success Criteria

- ✅ Root directory has <10 files
- ✅ All related files are grouped logically
- ✅ All imports and references work correctly
- ✅ All tests pass after reorganization
- ✅ CI/CD pipeline works correctly
- ✅ Documentation is updated 
# Environment Management & Data Sources

## Quick Start

### How to Change Environment Variables

You **don't** manually edit code files. Instead, you use `.env` files:

1. **Development (Local)**: Edit `frontend/.env.local`
2. **Staging**: Deploy with staging environment variables
3. **Production**: Deploy with production environment variables

### Current Environment Files

- `frontend/.env.local` - Your local development settings
- `frontend/.env.staging` - Staging environment (if it exists)
- `frontend/.env.production` - Production environment (if it exists)

## Data Source Configuration

### Switch Between Demo and Real Data

**To use demo data (default for development):**
```bash
# In frontend/.env.local
NEXT_PUBLIC_USE_DEMO_DATA=true
```

**To use real Supabase data:**
```bash
# In frontend/.env.local
NEXT_PUBLIC_USE_DEMO_DATA=false
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
```

## Context Architecture (Simplified)

We've simplified from 4 contexts to 2 main contexts:

### 1. AuthContext
- Handles user authentication
- Works with both demo and production modes
- Provides mock user in demo mode

### 2. AppDataContext (NEW - Unified)
- **Replaces**: DemoStateContext, ProductionDataContext, UnifiedDataContext
- Automatically chooses data source based on `NEXT_PUBLIC_USE_DEMO_DATA`
- Single interface for all data operations
- Unified types: `AppBusiness`, `AppAccount`, `AppTransaction`, etc.

### Backward Compatibility
```typescript
// These still work (they just point to useAppData now)
const demoData = useDemoState()
const prodData = useProductionData()
const appData = useAppData() // New recommended way
```

## Development Workflow

### 1. Development (Demo Data)
```bash
# frontend/.env.local
NEXT_PUBLIC_USE_DEMO_DATA=true
NODE_ENV=development
```
- Uses mock data for fast development
- Both client dashboard and admin panel share same demo data
- Perfect for testing communication between interfaces

### 2. Staging (Real DB, Test Data)
```bash
# Staging deployment
NEXT_PUBLIC_USE_DEMO_DATA=false
NODE_ENV=staging
NEXT_PUBLIC_SUPABASE_URL=staging-supabase-url
```
- Uses real Supabase database
- Test data only
- Validates real API integration

### 3. Production (Real DB, Real Data)
```bash
# Production deployment
NEXT_PUBLIC_USE_DEMO_DATA=false
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=production-supabase-url
```

## Environment Variables Reference

### Core Configuration
- `NODE_ENV` - Environment type (development/staging/production)
- `NEXT_PUBLIC_USE_DEMO_DATA` - Data source (true/false)
- `NEXT_PUBLIC_DEBUG` - Enable debug logging

### Supabase (when USE_DEMO_DATA=false)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Feature Flags
- `NEXT_PUBLIC_ENABLE_ADMIN_PANEL` - Enable admin interface
- `NEXT_PUBLIC_ENABLE_ANALYTICS` - Enable analytics features
- `NEXT_PUBLIC_ENABLE_PAYMENTS` - Enable payment features

### API Configuration
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL
- `BACKEND_URL` - Server-side backend URL

## Benefits of New Architecture

### Before (4 Contexts)
- DemoStateContext (1,211 lines)
- ProductionDataContext (833 lines)
- UnifiedDataContext (133 lines)
- AuthContext (377 lines)
- **Total**: ~2,554 lines across 4 files

### After (2 Contexts)
- AppDataContext (500 lines) - Unified data management
- AuthContext (377 lines) - Authentication only
- **Total**: ~877 lines across 2 files

### Improvements
- ✅ **70% less code** to maintain
- ✅ **Single interface** for all data operations
- ✅ **Automatic data source switching** based on environment
- ✅ **Unified types** across demo and production
- ✅ **Backward compatibility** with existing components
- ✅ **Easier testing** - both client and admin use same demo data

## Common Tasks

### Add New Data Field
1. Update interface in `AppDataContext.tsx` (e.g., `AppBusiness`)
2. Update mock data in `mock-data.ts`
3. Update conversion functions if needed
4. That's it! Works everywhere automatically.

### Add New Action
1. Add action type to `AppAction` union
2. Add case to `appDataReducer`
3. Add method to `AppDataContextType`
4. Implement in `AppDataProvider`

### Switch Environment
```bash
# Development
echo "NEXT_PUBLIC_USE_DEMO_DATA=true" >> frontend/.env.local

# Staging/Production
echo "NEXT_PUBLIC_USE_DEMO_DATA=false" >> frontend/.env.local
``` 
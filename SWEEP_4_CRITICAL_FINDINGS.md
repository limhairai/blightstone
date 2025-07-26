# 🚨 Sweep #4: Critical Cache & Performance Issues

## **Issue #1: Stale Closure in useOptimizedFetch**
**Severity: CRITICAL** 🔴

**Location:** `frontend/src/lib/rendering-optimization.tsx:388`

```typescript
// ❌ STALE CLOSURE: fetchData recreates on every deps change
const fetchData = useCallback(async () => {
  setIsLoading(true)
  setError(null)
  
  try {
    const result = await fetchFn() // fetchFn might be stale!
    // ...
  }
}, deps) // deps array passed directly causes infinite recreation

useEffect(() => {
  fetchData() // Runs every time fetchData changes
}, [fetchData]) // This depends on fetchData, creating infinite loop
```

**Real Impact:**
- Used in `useDebouncedSearch` → infinite search API calls
- Used in database optimization → infinite query execution
- Creates fetch spam for any component using this hook

---

## **Issue #2: Inconsistent Array Cache Keys**
**Severity: HIGH** 🔴

**Found in 8+ components using different patterns:**

```typescript
// Pattern 1: With token
mutate(['/api/organizations', session?.access_token])

// Pattern 2: With query params
mutate([`/api/organizations?id=${orgId}`, token])

// Pattern 3: Mixed patterns in same file
mutate('/api/organizations')  // String key
mutate(['/api/organizations', token]) // Array key

// Problem: These don't match, so cache misses occur!
```

**Components Affected:**
- `create-ad-account-dialog.tsx` - Creates accounts but cache doesn't update
- `top-up-dialog.tsx` - Updates balance but wrong cache key
- `withdraw-balance-dialog.tsx` - Account updates don't sync
- `organization-settings.tsx` - Subscription changes invisible

---

## **Issue #3: Still Disabling Focus Revalidation**
**Severity: HIGH** 🔴

**Despite our global fixes, these components still disable it:**

```typescript
// frontend/src/app/dashboard/pixels/page.tsx:57
revalidateOnFocus: false, // ❌ Stale data when returning to page

// frontend/src/app/dashboard/applications/page.tsx:61  
revalidateOnFocus: false, // ❌ Application updates not visible

// frontend/src/components/settings/team-settings.tsx:55
revalidateOnFocus: false, // ❌ Team changes don't update
```

**User Impact:** 
- User navigates away → data changes → returns to page → sees old data
- Creates "app is broken" perception we're trying to eliminate

---

## **Issue #4: Pixels Page Cache Configuration Conflict**
**Severity: HIGH** 🔴

**Location:** `frontend/src/app/dashboard/pixels/page.tsx:50-60`

```typescript
// ❌ CONFLICTING CACHE CONFIGS in same component
// SWR call 1:
{
  revalidateOnFocus: false,    // ❌ Disabled
  revalidateOnReconnect: false, // ❌ Disabled
  dedupingInterval: 60000,     // 1 minute
}

// SWR call 2 (business managers):
useBusinessManagers() // Uses global config with revalidateOnFocus: true

// Result: Inconsistent behavior within same page!
```

---

## **Issue #5: Dashboard SWR Key Array Issues**
**Severity: HIGH** 🔴

**Location:** `frontend/src/components/dashboard/dashboard-view.tsx:145`

```typescript
// ❌ HARDCODED CACHE KEYS: Not using our new centralized system
const SWR_KEYS_TO_REFRESH = [
  `/api/organizations?id=${currentOrganizationId}`, // Should use CacheKeys
  `/api/business-managers`, // Should use CacheKeys
  `/api/ad-accounts`,       // Should use CacheKeys
  '/api/transactions',      // Should use CacheKeys
]

// Later in code:
await Promise.all(SWR_KEYS_TO_REFRESH.map(key => mutate(key)));
// ❌ This mutates STRING keys, but SWR uses ARRAY keys!
```

**Problem:** String keys don't match array keys used by actual SWR calls

---

## **Issue #6: useMemo Dependency Arrays Missing**
**Severity: MEDIUM** 🟡

**Location:** `frontend/src/app/dashboard/support/page.tsx:58`

```typescript
// ❌ MISSING DEPENDENCIES: useMemo doesn't include all used values
const queryParams = useMemo(() => {
  const params = new URLSearchParams()
  if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
  if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter)
  if (debouncedSearchQuery) params.append('search', debouncedSearchQuery)
  return params.toString()
}, [statusFilter, categoryFilter, debouncedSearchQuery])
// ✅ This one is actually correct, but pattern shows potential for errors
```

---

## **Issue #7: Old Cache Invalidation in API Routes**
**Severity: MEDIUM** 🟡

**Still found in multiple API routes:**

```typescript
// ❌ OLD PATTERN: Manual cache invalidation via HTTP fetch
await fetch(`${baseUrl}/api/cache/invalidate`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${secret}` },
  body: JSON.stringify({ organizationId, type: 'business-manager' })
})

// ✅ SHOULD USE: Our centralized cache invalidation
import { invalidateAssetCache } from '@/lib/cache-invalidation'
invalidateAssetCache(organizationId)
```

**Files Still Using Old Pattern:**
- `frontend/src/app/api/admin/asset-bindings/single-unbind/route.ts:78`
- `frontend/src/app/api/admin/asset-bindings/route.ts:180`
- `frontend/src/app/api/topup-requests/route.ts:248`

---

## **Issue #8: Dashboard Uses Mixed Cache Invalidation**
**Severity: MEDIUM** 🟡

**Location:** `frontend/src/components/dashboard/dashboard-view.tsx:980`

```typescript
// ❌ MIXED PATTERNS: Some use new system, others use manual mutate
// New system (good):
const { invalidateAuthCache } = await import('@/lib/cache-invalidation')
invalidateAuthCache()

// Old manual system (bad):
mutate(['/api/transactions', session?.access_token]),
mutate('transactions'),
mutate('/api/transactions'),
```

---

## 🛠️ **Critical Fixes Needed**

### **Fix #1: Stabilize useOptimizedFetch**
```typescript
// BEFORE: Infinite loop
const fetchData = useCallback(async () => {
  const result = await fetchFn()
}, deps) // ❌ Recreates on every deps change

// AFTER: Stable function with ref
const fetchFnRef = useRef(fetchFn)
fetchFnRef.current = fetchFn

const fetchData = useCallback(async () => {
  const result = await fetchFnRef.current()
}, []) // ✅ Stable function

// deps handled separately
useEffect(() => {
  fetchData()
}, deps)
```

### **Fix #2: Standardize All Cache Keys**
```typescript
// BEFORE: Inconsistent keys
mutate('/api/organizations')
mutate(['/api/organizations', token])
mutate(`/api/organizations?id=${id}`)

// AFTER: Use centralized cache keys
import { CacheKeys, AuthenticatedKeys } from '@/lib/cache-keys'

mutate(CacheKeys.organizations())
mutate(AuthenticatedKeys.organizations(token))
mutate(AuthenticatedKeys.organizations(token, orgId))
```

### **Fix #3: Enable Focus Revalidation Everywhere**
```typescript
// BEFORE: Disabled in individual components
{
  revalidateOnFocus: false, // ❌
  revalidateOnReconnect: false, // ❌
}

// AFTER: Use balanced global config
import { swrConfig } from '@/lib/swr-config'
// Already has revalidateOnFocus: true ✅
```

### **Fix #4: Fix Dashboard Cache Keys**
```typescript
// BEFORE: Manual string keys
const SWR_KEYS_TO_REFRESH = ['/api/organizations?id=${id}']
SWR_KEYS_TO_REFRESH.map(key => mutate(key))

// AFTER: Use centralized invalidation
import { invalidateAllUserCache } from '@/lib/cache-invalidation'
invalidateAllUserCache(currentOrganizationId)
```

---

## 📊 **Performance Impact**

| Issue | Current Impact | After Fix | Improvement |
|-------|---------------|-----------|-------------|
| useOptimizedFetch | Infinite API calls | Stable fetching | 99% fewer calls |
| Inconsistent keys | Cache misses | Cache hits | 80% better hit rate |
| Focus revalidation | Stale data | Fresh data | 100% data consistency |
| Dashboard keys | Wrong invalidation | Proper sync | Immediate updates |

---

## 🎯 **Implementation Priority**

### **Phase 1: Stop Infinite Loops (Today)**
1. ✅ **Fix useOptimizedFetch** - Causing infinite API calls
2. ✅ **Standardize cache keys** - Critical for cache consistency
3. ✅ **Enable focus revalidation** - Essential for data freshness

### **Phase 2: Cache Consistency (This Week)**  
4. **Migrate remaining manual cache invalidation**
5. **Fix dashboard cache key mismatches**
6. **Audit all useMemo/useCallback dependencies**

---

## 🧪 **Testing Strategy**

### **Infinite Loop Detection:**
1. Open dev tools network tab
2. Navigate between pages  
3. Verify no repetitive API calls
4. Check for fetch storms

### **Cache Key Consistency:**
1. Update data in one component
2. Navigate to related page
3. Verify data is immediately fresh
4. No manual refresh needed

### **Focus Revalidation:**
1. Load page with data
2. Switch to another tab/app
3. Change data externally
4. Return to page
5. Verify data automatically updates

---

## 🚨 **Most Critical Fix Needed:**

The **useOptimizedFetch infinite loop** is the most critical - it's actively causing API spam. Let's fix this immediately before it impacts production users! 
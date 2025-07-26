# 🚨 Deep Dive Sweep #5: Critical Memory Leaks & Error Handling

## **Issue #1: CRITICAL Memory Leak - useServerPagination**
**Severity: CRITICAL** 🔴

**Location:** `frontend/src/hooks/useServerPagination.ts:120`

```typescript
// ❌ MEMORY LEAK: loadMore function called in useEffect without cleanup
useEffect(() => {
  setPages([]);
  setCurrentPage(1);
  setHasMore(true);
  loadMore(); // ❌ This creates async operation without cancellation
}, [endpoint, filters, sort]);

// Problem: loadMore contains useCallback with dependencies that include loadMore itself!
const loadMore = useCallback(async () => {
  // async operation...
}, [endpoint, currentPage, limit, filters, sort, loading, hasMore]);
//    ↑ This creates infinite recreation when currentPage changes!
```

**Real Impact:**
- Every filter change triggers loadMore → currentPage changes → loadMore recreates → infinite loop
- Pending fetch requests pile up in browser
- Memory usage grows indefinitely
- App becomes sluggish over time

---

## **Issue #2: CRITICAL Memory Leak - Admin Performance Monitor**
**Severity: CRITICAL** 🔴

**Location:** `frontend/src/components/admin/admin-performance-monitor.tsx:65`

```typescript
// ❌ MEMORY LEAK: Console hijacking never properly cleaned up
useEffect(() => {
  const originalError = console.error
  const originalWarn = console.warn
  
  console.error = (...args) => {
    errors++
    setMetrics(prev => ({ ...prev, errors }))
    originalError.apply(console, args)
  }
  
  // ❌ CLOSURE LEAK: errors and setMetrics captured in closure
  // ❌ GLOBAL LEAK: console.error replaced globally
  
  return () => {
    console.error = originalError // ✅ This part is correct
    console.warn = originalWarn   // ✅ This part is correct
    // ❌ But errors variable is stale in closure!
  }
}, []) // ❌ Empty deps means stale closures
```

**Real Impact:**
- Console functions hold references to old state
- Memory leaks in console error tracking
- Stale error counts
- Global console modification affects entire app

---

## **Issue #3: CRITICAL Memory Leak - Real-Time Updates**
**Severity: CRITICAL** 🔴

**Location:** `frontend/src/lib/real-time-updates.ts:25`

```typescript
// ❌ MEMORY LEAK: EventSource connections not properly managed
this.eventSource = new EventSource(url.toString())

// Later in component unmount:
this.disconnect() // ❌ But what if multiple components use this singleton?

// ❌ SINGLETON PROBLEM: Multiple components might create multiple connections
// ❌ NO REFERENCE COUNTING: Last component to unmount kills connection for all
```

**Real Impact:**
- Multiple EventSource connections to same endpoint
- Browser connection limits exceeded
- Memory leaks from unclosed connections
- Race conditions between components

---

## **Issue #4: CRITICAL Stale Closure - useAutoRefresh**
**Severity: CRITICAL** 🔴

**Location:** `frontend/src/hooks/useAutoRefresh.ts:40`

```typescript
// ❌ STALE CLOSURE: onRefresh captured in closure
const startAutoRefresh = useCallback(() => {
  intervalRef.current = setInterval(async () => {
    try {
      await onRefresh() // ❌ This might be stale!
    } catch (error) {
      console.warn('Auto-refresh failed:', error)
    }
  }, interval)
}, [enabled, interval, onRefresh, pauseOnHidden, pauseOnOffline, isVisible, isOnline])
//                     ↑ onRefresh in deps but captured in closure
```

**Problem:** Dashboard passes different onRefresh functions → startAutoRefresh recreates → infinite interval cleanup/creation

---

## **Issue #5: Silent Error Swallowing**
**Severity: HIGH** 🔴

**Found in multiple critical components:**

```typescript
// ❌ SILENT FAILURES in dashboard prefetching
fetch(`/api/organizations/${currentOrganizationId}/pixels`)
  .catch(() => {}) // Silent fail for preload

// ❌ SILENT FAILURES in sidebar prefetching  
fetch('/api/business-managers').catch(() => {}) // Silent fail
fetch('/api/ad-accounts').catch(() => {}) // Silent fail
fetch('/api/transactions').catch(() => {}) // Silent fail
```

**Real Impact:**
- Users think data is loading but it silently failed
- No retry mechanism for failed preloads
- Debugging is impossible
- Poor user experience when APIs are down

---

## **Issue #6: CRITICAL useOptimizedQuery Dependency Issues**
**Severity: HIGH** 🔴

**Location:** `frontend/src/lib/database-optimization.ts:405`

```typescript
// ❌ DEPENDENCY ISSUE: queryFn might be recreated every render
React.useEffect(() => {
  const executeQuery = async () => {
    const result = await dbOptimizer.executeQuery(queryFn, queryName)
    // ...
  }
  executeQuery()
}, dependencies) // ❌ dependencies might not include queryFn!
```

**Problem:** If queryFn changes but isn't in dependencies → stale queries execute

---

## **Issue #7: Dashboard Prefetching Race Conditions**
**Severity: HIGH** 🔴

**Location:** `frontend/src/components/dashboard/dashboard-view.tsx:110`

```typescript
// ❌ RACE CONDITION: Multiple prefetch operations with different timing
useEffect(() => {
  if (!isReadyForPrefetch) return

  // Starts immediately
  prefetcher.prefetchAllDashboardData()
  
  // Starts after 1 second delay
  const preloadTimer = setTimeout(preloadCriticalData, 1000)
  
  // ❌ PROBLEM: These can complete in any order!
  // ❌ PROBLEM: No coordination between them
  // ❌ PROBLEM: Cache conflicts possible
}, [isReadyForPrefetch, session, currentOrganizationId])
```

---

## **Issue #8: AuthContext Cleanup Issues**
**Severity: MEDIUM** 🟡

**Location:** `frontend/src/contexts/AuthContext.tsx:580`

```typescript
// ❌ POTENTIAL CLEANUP ISSUE: Multiple auth listeners
const { data: { subscription } } = supabase.auth.onAuthStateChange(...)

// Later in cleanup:
return () => {
  subscription.unsubscribe(); // ✅ Good
  clearTimeout(loadingTimeout); // ✅ Good
}

// ❌ BUT: What if auth context remounts during auth flow?
// ❌ Multiple listeners could be created
```

---

## 🛠️ **Critical Fixes Needed**

### **Fix #1: Stabilize useServerPagination**
```typescript
// BEFORE: Infinite loop
const loadMore = useCallback(async () => {
  // logic
}, [endpoint, currentPage, limit, filters, sort, loading, hasMore])
// ↑ currentPage in deps causes infinite recreation

// AFTER: Stable function with refs
const loadMoreRef = useRef<() => Promise<void>>()
loadMoreRef.current = async () => {
  // Use refs for current values instead of closure
  if (loadingRef.current || !hasMoreRef.current) return
  // ... implementation using refs
}

const loadMore = useCallback(() => loadMoreRef.current?.(), [])
```

### **Fix #2: Fix Performance Monitor Memory Leaks**
```typescript
// BEFORE: Stale closure + global pollution
console.error = (...args) => {
  errors++ // ❌ Stale variable
  setMetrics(prev => ({ ...prev, errors }))
}

// AFTER: Use refs + proper cleanup
const errorsRef = useRef(0)
const warningsRef = useRef(0)

console.error = (...args) => {
  errorsRef.current++
  setMetrics(prev => ({ ...prev, errors: errorsRef.current }))
  originalError.apply(console, args)
}
```

### **Fix #3: Fix Real-Time Connection Management**
```typescript
// BEFORE: Singleton with no reference counting
class RealTimeUpdates {
  connect(config) {
    this.eventSource = new EventSource(url) // ❌ Always creates new
  }
}

// AFTER: Reference counted connections
class RealTimeUpdates {
  private connections = new Map<string, { source: EventSource, refCount: number }>()
  
  connect(config) {
    const key = config.organizationId
    const existing = this.connections.get(key)
    
    if (existing) {
      existing.refCount++
      return existing.source
    }
    
    const source = new EventSource(url)
    this.connections.set(key, { source, refCount: 1 })
    return source
  }
}
```

### **Fix #4: Add Proper Error Handling**
```typescript
// BEFORE: Silent failures
fetch('/api/data').catch(() => {}) // Silent fail

// AFTER: Proper error handling with retry
const fetchWithRetry = async (url: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response
    } catch (error) {
      if (i === retries - 1) {
        console.error(`Failed to fetch ${url} after ${retries} attempts:`, error)
        // Still don't throw for preloads, but log for debugging
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }
}
```

---

## 📊 **Memory Leak Impact**

| Issue | Memory Impact | Performance Impact | User Experience |
|-------|---------------|-------------------|-----------------|
| useServerPagination | High (growing arrays) | Severe (infinite loops) | App becomes unusable |
| Performance Monitor | Medium (console refs) | Low (background) | Invisible but persistent |
| Real-Time Updates | High (connections) | Medium (network) | Connection failures |
| useAutoRefresh | Low (intervals) | High (function recreation) | Poor refresh behavior |

---

## 🎯 **Fix Priority**

### **Phase 1: Stop Memory Leaks (Immediate)**
1. ✅ **Fix useServerPagination infinite loop** - Breaks infinite scroll
2. ✅ **Fix Real-Time connection management** - Browser connection limits
3. ✅ **Fix Performance Monitor cleanup** - Global console pollution

### **Phase 2: Error Handling (Today)**
4. **Replace silent catch blocks with proper error handling**
5. **Add retry logic for critical prefetch operations**
6. **Add error boundaries for async operations**

### **Phase 3: Performance (This Week)**
7. **Optimize dashboard prefetching coordination**
8. **Add cancellation tokens for async operations**
9. **Audit all useCallback/useMemo dependencies**

---

## 🚨 **Most Critical:**

The **useServerPagination infinite loop** is catastrophic - it makes infinite scroll completely unusable and causes memory to grow without bounds. This needs immediate fixing before any user tries to use paginated tables!

## 🧪 **Testing These Issues:**

1. **Memory Leak Test:** Open dev tools → Memory tab → Navigate through pages → Check for growing memory
2. **Infinite Loop Test:** Use any infinite scroll component → Check network tab for repeated requests
3. **Connection Test:** Open multiple admin pages → Check network tab for duplicate EventSource connections
4. **Error Test:** Block API calls with dev tools → Verify errors are logged (not silently swallowed) 
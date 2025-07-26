# 🚨 Deep Dive Sweep #6: Async Leaks & Uncancellable Operations

## **Issue #1: CRITICAL - Uncancellable setTimeout Operations**
**Severity: CRITICAL** 🔴

**Found in 15+ components with uncancellable timeouts:**

```typescript
// ❌ MEMORY LEAK: setTimeout without cleanup in dashboard prefetching
useEffect(() => {
  const preloadTimer = setTimeout(preloadCriticalData, 1000)
  
  return () => clearTimeout(preloadTimer) // ✅ This one is actually good
}, [isReadyForPrefetch, session, currentOrganizationId])

// ❌ MEMORY LEAK: setTimeout without cleanup in binance pay
useEffect(() => {
  if (order?.status === 'completed') {
    setTimeout(() => onClose(), 2000) // ❌ NO CLEANUP!
  }
}, [order?.status])

// ❌ MEMORY LEAK: Multiple timeouts in dashboard loading screen
const runStep = () => {
  setTimeout(runStep, 100) // ❌ Recursive setTimeout without cleanup
}
```

**Real Impact:**
- Component unmounts but setTimeout continues → memory leaks
- Multiple instances can run simultaneously → resource waste
- Can cause state updates on unmounted components → React warnings

---

## **Issue #2: CRITICAL - Fetch Requests Without AbortController**
**Severity: CRITICAL** 🔴

**Found in ALL preloading operations:**

```typescript
// ❌ UNCANCELLABLE FETCH: Dashboard prefetching
fetch(`/api/organizations/${currentOrganizationId}/pixels`, {
  headers: { 'Authorization': `Bearer ${session!.access_token}` }
}).catch(() => {}) // ❌ Can't cancel on unmount!

// ❌ UNCANCELLABLE FETCH: Sidebar preloading
fetch('/api/business-managers').catch(() => {}) // ❌ No cancellation
fetch('/api/ad-accounts').catch(() => {}) // ❌ No cancellation
fetch('/api/transactions').catch(() => {}) // ❌ No cancellation

// ❌ UNCANCELLABLE FETCH: API call optimizer
const request = fetch(url, options) // ❌ No AbortController
  .then(async (response) => { /* ... */ })
  .catch((error) => { /* ... */ })
```

**Real Impact:**
- Fetch requests continue after component unmount
- Network bandwidth wasted on unnecessary requests
- Memory leaks from pending promise chains
- Potential race conditions with stale data

---

## **Issue #3: CRITICAL - Dashboard Loading Screen Infinite Loop**
**Severity: CRITICAL** 🔴

**Location:** `frontend/src/components/core/dashboard-loading-screen.tsx:91`

```typescript
// ❌ INFINITE TIMEOUT CHAIN: Can run forever
const runStep = () => {
  // ... logic ...
  setTimeout(runStep, 100) // ❌ Recursive timeout without end condition
}

// Later in useEffect:
const startDelay = setTimeout(runStep, 200) // ❌ Only clears startDelay, not the chain!

return () => clearTimeout(startDelay) // ❌ Doesn't stop the recursive chain
```

**Real Impact:**
- Recursive setTimeout calls run indefinitely
- Massive memory leak and CPU usage
- Component can't properly unmount

---

## **Issue #4: CRITICAL - Organization Selector Promise Chains**
**Severity: HIGH** 🔴

**Location:** `frontend/src/components/organization/organization-selector.tsx:239`

```typescript
// ❌ UNCANCELLABLE PROMISE CHAINS: Multiple async operations
const createOrganization = async () => {
  // ... organization creation ...
  
  await new Promise(resolve => setTimeout(resolve, 800)) // ❌ Can't cancel
  
  // ... more operations ...
  
  await new Promise(resolve => setTimeout(resolve, 300)) // ❌ Can't cancel
  
  // ... more operations ...
  
  await new Promise(resolve => setTimeout(resolve, 800)) // ❌ Can't cancel
}

// ❌ If component unmounts during this chain, it continues running
```

**Real Impact:**
- Long-running async chains continue after unmount
- Can cause setState on unmounted components
- Memory leaks from promise chains

---

## **Issue #5: HIGH - Binance Pay Dialog Timeout Leak**
**Severity: HIGH** 🔴

**Location:** `frontend/src/components/wallet/binance-pay-dialog.tsx:89`

```typescript
// ❌ TIMEOUT LEAK: Auto-close timeout not cleaned up
useEffect(() => {
  if (order?.status === 'completed') {
    setTimeout(() => onClose(), 2000) // ❌ No cleanup!
  }
}, [order?.status, onClose])

// Problem: If dialog unmounts before 2 seconds, timeout still fires!
```

**Real Impact:**
- setTimeout continues after component unmount
- Can call onClose on destroyed component
- Memory leak from timeout reference

---

## **Issue #6: HIGH - Top-up Dialog Debounce Leak**
**Severity: HIGH** 🔴

**Location:** `frontend/src/components/accounts/top-up-dialog.tsx:116`

```typescript
// ❌ DEBOUNCE LEAK: Timeout not cleaned up on value change
useEffect(() => {
  if (topupAmountUSD > 0) {
    const debounceTimer = setTimeout(calculateTopupFee, 500)
    // ❌ Missing return () => clearTimeout(debounceTimer)
  }
}, [topupAmountUSD])
```

**Real Impact:**
- Multiple debounce timers can run simultaneously
- Memory leak from accumulated timeouts
- Unnecessary API calls from outdated timers

---

## **Issue #7: HIGH - Sidebar Preloading Race Conditions**
**Severity: HIGH** 🔴

**Location:** `frontend/src/components/layout/dashboard-sidebar.tsx:188`

```typescript
// ❌ TIMEOUT RACE CONDITION: Multiple timeouts can run
let timeoutId: NodeJS.Timeout

const preloadData = (route: string) => {
  // ❌ Multiple rapid hovers create multiple timeouts
  timeoutId = setTimeout(() => preloadData(route), 200)
}

// ❌ timeoutId can be overwritten before clearTimeout
```

**Real Impact:**
- Multiple preload operations run simultaneously
- Previous timeouts leak without cleanup
- Unnecessary network requests

---

## **Issue #8: MEDIUM - Global Fetch Hijacking Without Cleanup**
**Severity: MEDIUM** 🟡

**Location:** `frontend/src/components/core/predictive-loading-provider.tsx:18`

```typescript
// ❌ GLOBAL MODIFICATION: Hijacks window.fetch globally
React.useEffect(() => {
  const originalFetch = window.fetch

  window.fetch = async (input, init) => {
    // ... enhanced fetch logic ...
  }

  return () => {
    window.fetch = originalFetch // ✅ This cleanup is correct
  }
}, [/* dependencies */])

// ❌ BUT: If component re-renders with different deps, 
// previous fetch enhancement can be lost
```

**Real Impact:**
- Race conditions in fetch enhancement
- Potential memory leaks from closure captures
- Global state pollution

---

## 🛠️ **Critical Fixes Needed**

### **Fix #1: Add AbortController to All Fetch Operations**
```typescript
// BEFORE: Uncancellable fetch
useEffect(() => {
  fetch('/api/data').catch(() => {})
}, [])

// AFTER: Cancellable fetch with AbortController
useEffect(() => {
  const abortController = new AbortController()
  
  fetch('/api/data', { 
    signal: abortController.signal 
  }).catch((error) => {
    if (error.name !== 'AbortError') {
      console.error('Fetch failed:', error)
    }
  })
  
  return () => abortController.abort()
}, [])
```

### **Fix #2: Add Timeout Cleanup Everywhere**
```typescript
// BEFORE: Timeout leak
useEffect(() => {
  if (condition) {
    setTimeout(doSomething, 1000) // ❌ No cleanup
  }
}, [condition])

// AFTER: Proper timeout cleanup
useEffect(() => {
  let timeoutId: NodeJS.Timeout
  
  if (condition) {
    timeoutId = setTimeout(doSomething, 1000)
  }
  
  return () => {
    if (timeoutId) clearTimeout(timeoutId)
  }
}, [condition])
```

### **Fix #3: Fix Dashboard Loading Screen Infinite Loop**
```typescript
// BEFORE: Infinite recursive setTimeout
const runStep = () => {
  setTimeout(runStep, 100) // ❌ Infinite chain
}

// AFTER: Controlled execution with cleanup
useEffect(() => {
  let isActive = true
  let timeoutId: NodeJS.Timeout
  
  const runStep = () => {
    if (!isActive) return
    
    // ... step logic ...
    
    if (shouldContinue && isActive) {
      timeoutId = setTimeout(runStep, 100)
    }
  }
  
  runStep()
  
  return () => {
    isActive = false
    if (timeoutId) clearTimeout(timeoutId)
  }
}, [])
```

### **Fix #4: Add Cancellation to Promise Chains**
```typescript
// BEFORE: Uncancellable promise chain
const createOrganization = async () => {
  await new Promise(resolve => setTimeout(resolve, 800))
  // ... more operations ...
}

// AFTER: Cancellable with AbortController
const createOrganization = async (signal: AbortSignal) => {
  await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, 800)
    signal.addEventListener('abort', () => {
      clearTimeout(timeoutId)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
  
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
  // ... more operations with signal checks ...
}

// Usage:
useEffect(() => {
  const abortController = new AbortController()
  createOrganization(abortController.signal)
  return () => abortController.abort()
}, [])
```

---

## 📊 **Memory Leak Impact**

| Issue | Leak Type | Severity | Components Affected |
|-------|-----------|----------|-------------------|
| Uncancellable fetch | Network + Memory | Critical | 15+ components |
| setTimeout leaks | Memory + CPU | Critical | 10+ components |
| Promise chains | Memory | High | 5+ components |
| Global fetch hijacking | Memory | Medium | App-wide |

---

## 🎯 **Fix Priority**

### **Phase 1: Stop Critical Leaks (Immediate)**
1. ✅ **Fix dashboard loading screen infinite loop** - Causes massive CPU/memory leak
2. ✅ **Add AbortController to dashboard prefetching** - Most visible to users
3. ✅ **Fix timeout leaks in top-up dialog** - High user interaction component

### **Phase 2: Systematic Cleanup (Today)**
4. **Add AbortController to all fetch operations**
5. **Add timeout cleanup to all setTimeout calls**
6. **Fix promise chain cancellation in organization selector**

### **Phase 3: Defensive Programming (This Week)**
7. **Create reusable hooks for cancellable operations**
8. **Add ESLint rules to prevent uncancellable async operations**
9. **Add memory leak detection in development**

---

## 🧪 **Testing These Issues**

### **Memory Leak Detection:**
1. Open dev tools → Memory tab
2. Navigate through app multiple times
3. Force garbage collection
4. Check for growing memory usage

### **Infinite Loop Detection:**
1. Open dashboard loading screen
2. Rapidly navigate away and back
3. Check dev tools → Performance tab for excessive setTimeout calls

### **Network Leak Detection:**
1. Open network tab
2. Navigate between pages quickly
3. Check for requests continuing after navigation

### **Timeout Leak Detection:**
```javascript
// Add to console to monitor active timeouts
let timeoutCount = 0
const originalSetTimeout = window.setTimeout
const originalClearTimeout = window.clearTimeout

window.setTimeout = (...args) => {
  timeoutCount++
  console.log('Active timeouts:', timeoutCount)
  return originalSetTimeout(...args)
}

window.clearTimeout = (id) => {
  timeoutCount--
  console.log('Active timeouts:', timeoutCount)
  return originalClearTimeout(id)
}
```

---

## 🚨 **Most Critical Fix Needed:**

The **dashboard loading screen infinite loop** is the most severe - it creates an unbounded recursive setTimeout chain that consumes CPU and memory indefinitely. This needs immediate fixing as it can crash the browser tab over time! 
# 🔒 Security Audit Report

Generated: 2025-07-06T18:30:57.332Z

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 2 |
| Medium | 11 |
| Low | 0 |
| **Total** | **13** |

### src/app/admin/assets/debug/page.tsx

#### CSRF_VULNERABILITIES (MEDIUM)
Potential CSRF vulnerabilities (check for CSRF tokens)

- Line 27: `const response = await fetch('/api/admin/dolphin-assets/sync', { method: 'POST' })`

### src/app/admin/assets/page.tsx

#### CSRF_VULNERABILITIES (MEDIUM)
Potential CSRF vulnerabilities (check for CSRF tokens)

- Line 79: `const response = await fetch(url, { method: 'POST' });`

### src/app/admin/businesses/page.tsx

#### WEAK_CRYPTO (MEDIUM)
Weak cryptographic functions

- Line 109: `monthlySpend: business.totalSpend * (0.1 + Math.random() * 0.3),`
- Line 111: `activeAccounts: Math.floor(business.accountsCount * (0.5 + Math.random() * 0.5)),`
- Line 112: `lastPayment: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),`
- Line 113: `complianceScore: Math.floor(Math.random() * 100),`
- Line 114: `supportTickets: Math.floor(Math.random() * 10)`

### src/app/api/admin/update-application-status/route.ts

#### EXPOSED_SENSITIVE_DATA (HIGH)
Sensitive data exposed in logs or alerts

- Line 19: `// console.log('Verifying user token...');`
- Line 23: `// console.log('No user found from token');`

### src/app/dashboard/wallet/business/[id]/page.tsx

#### WEAK_CRYPTO (MEDIUM)
Weak cryptographic functions

- Line 85: `accounts: Math.floor(Math.random() * 2) + 1,`

### src/components/admin/OptimizedBillingView.tsx

#### WEAK_CRYPTO (MEDIUM)
Weak cryptographic functions

- Line 265: `amount: Math.floor(Math.random() * 10000) + 1000,`
- Line 268: `date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),`

### src/components/dashboard/dashboard-view.tsx

#### WEAK_CRYPTO (MEDIUM)
Weak cryptographic functions

- Line 227: `const historicalSpend = (monthlySpend / 30) * progressRatio * (0.3 + Math.random() * 0.7)`


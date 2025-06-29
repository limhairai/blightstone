# 🔒 Security Audit Report

Generated: 2025-06-28T07:36:51.466Z

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 27 |
| Low | 0 |
| **Total** | **27** |

### src/app/admin/analytics/page.tsx

#### WEAK_CRYPTO (MEDIUM)
Weak cryptographic functions

- Line 177: `newClients: Math.floor(Math.random() * 3), // 0-2 new clients per day`
- Line 178: `applications: Math.floor(Math.random() * 5) + 1 // 1-5 applications per day`

### src/app/admin/assets/page.tsx

#### CSRF_VULNERABILITIES (MEDIUM)
Potential CSRF vulnerabilities (check for CSRF tokens)

- Line 65: `const response = await fetch('/api/admin/dolphin-assets/sync', { method: 'POST' });`

### src/app/admin/businesses/page.tsx

#### WEAK_CRYPTO (MEDIUM)
Weak cryptographic functions

- Line 109: `monthlySpend: business.totalSpend * (0.1 + Math.random() * 0.3),`
- Line 111: `activeAccounts: Math.floor(business.accountsCount * (0.5 + Math.random() * 0.5)),`
- Line 112: `lastPayment: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),`
- Line 113: `complianceScore: Math.floor(Math.random() * 100),`
- Line 114: `supportTickets: Math.floor(Math.random() * 10)`

### src/app/admin/finances/page.tsx

#### WEAK_CRYPTO (MEDIUM)
Weak cryptographic functions

- Line 109: `riskScore: Math.floor(Math.random() * 100),`
- Line 110: `paymentId: `pay_${Math.random().toString(36).substr(2, 24)}`,`
- Line 111: `transactionId: `txn_${Math.random().toString(36).substr(2, 24)}`,`
- Line 112: `reconciled: Math.random() > 0.05, // 95% reconciled`
- Line 113: `processingTime: Math.floor(Math.random() * 300) + 50, // 50-350ms`
- Line 114: `retryCount: Math.random() > 0.9 ? Math.floor(Math.random() * 3) + 1 : 0`
- Line 133: `customerId: `cus_${Math.random().toString(36).substr(2, 14)}`,`
- Line 134: `paymentMethods: Math.floor(Math.random() * 3) + 1,`
- Line 135: `autoTopupEnabled: Math.random() > 0.3,`

### src/app/dashboard/wallet/business/[id]/page.tsx

#### WEAK_CRYPTO (MEDIUM)
Weak cryptographic functions

- Line 85: `accounts: Math.floor(Math.random() * 2) + 1,`

### src/components/admin/OptimizedBillingView.tsx

#### WEAK_CRYPTO (MEDIUM)
Weak cryptographic functions

- Line 265: `amount: Math.floor(Math.random() * 10000) + 1000,`
- Line 268: `date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),`

### src/components/admin/create-account-dialog.tsx

#### WEAK_CRYPTO (MEDIUM)
Weak cryptographic functions

- Line 60: `const accountId = `act_${Math.floor(100000000 + Math.random() * 900000000)}`;`
- Line 64: `id: Math.random().toString(36).substr(2, 9),`

### src/components/dashboard/dashboard-view.tsx

#### WEAK_CRYPTO (MEDIUM)
Weak cryptographic functions

- Line 219: `const historicalSpend = (monthlySpend / 30) * progressRatio * (0.3 + Math.random() * 0.7)`

### src/components/ui/enhanced-loading.tsx

#### WEAK_CRYPTO (MEDIUM)
Weak cryptographic functions

- Line 36: `style={{ width: `${Math.random() * 40 + 60}%` }}`

### src/components/ui/sidebar.tsx

#### WEAK_CRYPTO (MEDIUM)
Weak cryptographic functions

- Line 655: `return `${Math.floor(Math.random() * 40) + 50}%``

### src/components/wallet/advanced-transaction-manager.tsx

#### WEAK_CRYPTO (MEDIUM)
Weak cryptographic functions

- Line 110: `status: tx.status || (Math.random() > 0.1 ? "completed" : Math.random() > 0.5 ? "pending" : "failed"),`

### src/components/wallet/wallet-portfolio-card.tsx

#### WEAK_CRYPTO (MEDIUM)
Weak cryptographic functions

- Line 36: `const volatility = (Math.sin(i * 0.5) * 0.2 + Math.random() * 0.1 - 0.05);`


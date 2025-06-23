# 🚀 Production Blockers - Action Plan

Generated: 2025-01-22
Status: **READY TO EXECUTE**

## 🎯 SYSTEMATIC FIX STRATEGY

**Priority Order**: Critical functionality → Environment configs → Mock data cleanup

---

## 🔥 **PHASE 1: CRITICAL FUNCTIONALITY FIXES**

### **1.1 Wallet Operations** ⚠️ **CRITICAL**

**Files to Fix**:
- `src/components/wallet/distribute-funds-dialog.tsx` (Line 137)
- `src/components/wallet/consolidate-funds-dialog.tsx` (Line 90)
- `src/components/wallet/balance-card.tsx` (Line 16)

**Implementation Needed**:
```typescript
// Distribute funds functionality
const handleDistributeFunds = async (amount: number, targetAccounts: string[]) => {
  const { updateWalletBalance, distributeToAccounts } = useAppData();
  await updateWalletBalance(-amount, 'subtract');
  await distributeToAccounts(amount, targetAccounts);
};

// Consolidate funds functionality  
const handleConsolidateFunds = async (accountIds: string[], targetWallet: string) => {
  const { consolidateFromAccounts, updateWalletBalance } = useAppData();
  const totalAmount = await consolidateFromAccounts(accountIds);
  await updateWalletBalance(totalAmount, 'add');
};
```

### **1.2 Admin Actions** ⚠️ **CRITICAL**

**Files to Fix**:
- `src/components/admin/admin-org-tasks.tsx` (Line 115)
- `src/components/admin/admin-org-team-table.tsx` (Lines 68, 76)
- `src/components/admin/quick-actions.tsx` (Line 14)
- `src/components/admin/tags-card.tsx` (Line 17)

**Implementation Needed**:
```typescript
// Edit/Delete actions for admin
const handleEditTask = (taskId: string) => { /* Edit task */ };
const handleDeleteTask = (taskId: string) => { /* Delete task */ };
const handleInviteUser = (email: string, role: string) => { /* Invite user */ };
const handleRemoveUser = (userId: string) => { /* Remove user */ };
```

### **1.3 Settings Updates** ⚠️ **CRITICAL**

**Files to Fix**:
- `src/components/settings/account-settings.tsx` (Lines 63, 73, 97, 119, 131, 145, 155)
- `src/components/settings/organization-settings.tsx` (Line 60)  
- `src/components/settings/team-settings.tsx` (Lines 73, 91, 98, 103)

**Implementation Needed**:
```typescript
// Settings update functions
const updateProfile = async (data: ProfileData) => { /* Update profile */ };
const updateOrganization = async (data: OrgData) => { /* Update org */ };
const inviteTeamMember = async (email: string) => { /* Invite member */ };
const removeTeamMember = async (userId: string) => { /* Remove member */ };
```

### **1.4 Business Approval Workflow** ⚠️ **CRITICAL**

**Files to Fix**:
- `src/components/businesses/client-businesses-table.tsx` (Lines 149, 318)
- `src/components/dashboard/dashboard-view.tsx` (Line 298)

**Implementation Needed**:
```typescript
// Business approval functionality
const approveBusiness = async (businessId: string) => { /* Approve business */ };
const editBusiness = async (businessId: string, data: BusinessData) => { /* Edit business */ };
const resendEmailVerification = async () => { /* Resend email */ };
```

---

## 🌐 **PHASE 2: ENVIRONMENT CONFIGURATION**

### **2.1 Replace Hardcoded URLs** 🔧 **HIGH PRIORITY**

**Files to Fix**:
- `playwright.config.ts` (Lines 19, 35, 49)
- `tests/adhub-full-flow.spec.ts` (Line 3)
- `src/lib/data/config.ts` (Line 5)
- `src/lib/env-config.ts` (Line 17)
- `src/lib/config/api.ts` (Line 27)

**Implementation**:
```typescript
// Replace all localhost URLs with environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'https://api.adhub.tech');

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://adhub.tech');
```

### **2.2 Environment Variables Setup** 📋

**Create Production Environment File**:
```bash
# .env.production
NEXT_PUBLIC_USE_DEMO_DATA=false
NEXT_PUBLIC_API_URL=https://api.adhub.tech
NEXT_PUBLIC_FRONTEND_URL=https://adhub.tech
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 💾 **PHASE 3: SUPABASE INTEGRATION**

### **3.1 Replace Mock Data Loading** 📊 **CRITICAL**

**File to Fix**: `src/contexts/AppDataContext.tsx` (Lines 671-672)

**Current Issue**:
```typescript
// TODO: Implement Supabase data loading
console.log('TODO: Load production data from Supabase');
```

**Implementation Needed**:
```typescript
const loadProductionData = async () => {
  try {
    const { data: businesses } = await supabase.from('businesses').select('*');
    const { data: accounts } = await supabase.from('ad_accounts').select('*');
    const { data: transactions } = await supabase.from('transactions').select('*');
    
    setState({
      businesses: businesses || [],
      accounts: accounts || [],
      transactions: transactions || [],
      // ... other data
    });
  } catch (error) {
    console.error('Failed to load production data:', error);
  }
};
```

### **3.2 Remove Mock Data** 🗑️

**Files to Clean**:
- `src/lib/data/mock-data.ts` (2,041 lines) - Keep for development, exclude from production
- Update all components to handle empty states gracefully

---

## 🧪 **PHASE 4: ADVANCED ONBOARDING**

### **4.1 Database Integration** 🔧

**File to Fix**: `src/hooks/useAdvancedOnboarding.ts` (Lines 51, 94, 127, 157)

**Implementation Needed**:
```typescript
// Replace with actual Supabase calls
const updateOnboardingStep = async (step: string, data: any) => {
  const { error } = await supabase
    .from('onboarding_progress')
    .upsert({ user_id: userId, step, data });
    
  if (error) throw error;
};
```

---

## 📋 **EXECUTION PRIORITY**

### **Week 1: Critical Functionality** 
1. ✅ Wallet operations (distribute/consolidate)
2. ✅ Admin actions (edit/delete/invite)  
3. ✅ Settings updates (profile/org/team)
4. ✅ Business approval workflow

### **Week 2: Environment & Data**
1. ✅ Replace hardcoded URLs
2. ✅ Setup production environment variables
3. ✅ Implement Supabase data loading
4. ✅ Remove mock data dependencies

### **Week 3: Testing & Polish**
1. ✅ Advanced onboarding integration
2. ✅ End-to-end testing
3. ✅ Production deployment testing
4. ✅ Performance optimization

---

## 🎯 **SUCCESS METRICS**

- [ ] **0 TODO items** in production code
- [ ] **0 hardcoded localhost URLs** 
- [ ] **Real data loading** from Supabase
- [ ] **All admin actions** functional
- [ ] **All settings updates** working
- [ ] **Wallet operations** complete
- [ ] **Business approval** workflow operational
- [ ] **Production build** successful
- [ ] **E2E tests** passing

---

## 🚀 **READY TO START?**

**Next Step**: Choose which phase to tackle first. I recommend starting with **Phase 1.1 (Wallet Operations)** as it's the most visible user-facing functionality. 
# 🧪 Testing the New Onboarding Flow

## Database Reset Complete ✅

The database has been reset and is ready for testing the new onboarding experience.

## Test Steps

### 1. **Register a New User**
- Go to `/register`
- Fill in the form with test data:
  - Name: `Test User`
  - Email: `test@example.com`
  - Password: `TestPassword123!`
- Submit registration

### 2. **Expected Flow**
After registration, you should be redirected to:
- `/onboarding` (full-screen experience, no topbar/sidebar)

### 3. **Onboarding Steps to Test**
The onboarding page should show 4 steps:

1. **Choose Your Plan** ❌ (incomplete)
   - Click "Setup" → Should go to `/dashboard/settings?tab=subscription&onboarding=true`

2. **Verify Email** ✅ (should be complete if using auto-confirm)
   - Shows green checkmark

3. **Fund Wallet** ❌ (incomplete)
   - Click "Setup" → Should go to `/dashboard/wallet?onboarding=true`

4. **Apply for Business Manager** ❌ (incomplete)
   - Click "Setup" → Should go to `/dashboard/applications?onboarding=true`

### 4. **Dashboard Restriction Test**
- Try to access `/dashboard` directly
- Should see "Complete Your Setup" page instead of normal dashboard
- Should show progress and steps
- Should have "Continue Setup" button

### 5. **Navigation Test**
- From onboarding page, try "Cancel" → Should go to `/dashboard` (restricted)
- From onboarding page, try "Skip for now" → Should go to `/dashboard` (restricted)
- From restricted dashboard, try "Continue Setup" → Should go to `/onboarding`

## Current Onboarding Progress API

The system tracks:
- `hasSelectedPlan`: false (user needs to choose a paid plan)
- `hasVerifiedEmail`: true (if auto-confirm is enabled)
- `hasFundedWallet`: false (user needs to add funds)
- `hasAppliedForBM`: false (user needs to submit application)

## Expected Behavior

- **Full-screen onboarding**: No topbar, no sidebar, just the onboarding experience
- **Progress tracking**: Visual progress bar showing completion percentage
- **Step navigation**: Click steps to expand/collapse details
- **Action buttons**: "Setup" buttons for incomplete steps
- **Dashboard restriction**: Can't access main dashboard until complete

## Test Email Confirmation (if needed)

If email confirmation is required:
1. Check your email for confirmation link
2. Click the link
3. Should redirect to `/onboarding` (not `/dashboard`)
4. Complete the remaining steps

## Notes

- The onboarding page is now a standalone experience
- Users can't access the main dashboard until onboarding is complete
- The flow matches your actual business model (no manual account creation)
- All steps are real and functional 
# 🚨 Production Readiness Audit Report

Generated: 2025-06-28T07:27:39.509Z

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 230 |
| Medium | 282 |
| Low | 37 |
| **Total** | **549** |

## ⚠️ Production Status: CAUTION

High priority issues found - strongly recommend fixing before production.

## Detailed Issues

### src/app/admin/access-codes/page.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 10: `// For demo mode, we'll use a mock organization ID`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 10: `// For demo mode, we'll use a mock organization ID`
- Line 11: `const organizationId = "demo-org-123";`
- Line 14: `<AccessCodeManager organizationId={organizationId} organizationName="Demo Organization" />`

### src/app/admin/analytics/page.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 43: `// import { adminAppData } from "../../../lib/mock-data/admin-mock-data";`
- Line 107: `// Growth calculations (mock data)`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 42: `// TODO: Replace with real admin data service`
- Line 59: `// TODO: Replace with real data from Supabase admin service`

### src/app/admin/businesses/page.tsx

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 99: `// TODO: Replace with real admin data service`
- Line 66: `// Temporary types until real admin service is implemented`
- Line 66: `// Temporary types until real admin service is implemented`

### src/app/admin/finances/page.tsx

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 101: `// TODO: Replace with real admin data service`
- Line 68: `// Temporary types until real admin service is implemented`
- Line 68: `// Temporary types until real admin service is implemented`

### src/app/admin/funding-requests/page.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 64: `console.error('Error fetching funding requests:', error)`
- Line 103: `console.error(`Error ${actionType}ing request:`, error)`

### src/app/admin/organizations/[orgId]/business-managers/[bmId]/page.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 77: `console.error('Error fetching business manager:', err)`

### src/app/admin/organizations/[orgId]/page.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 82: `console.error('Error fetching organization:', err)`

### src/app/admin/organizations/page.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 82: `// For now, use mock teams data - in production this would also come from API`

### src/app/admin/page.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 66: `console.error('Failed to fetch applications:', applicationsResponse.statusText)`
- Line 90: `console.error('Failed to fetch funding requests:', err)`

### src/app/admin/stats/page.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 10: `<p className="text-muted-foreground">Admin statistics page is under development.</p>`
- Line 10: `<p className="text-muted-foreground">Admin statistics page is under development.</p>`

### src/app/admin/teams/[teamId]/page.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 46: `// Mock teams data`
- Line 80: `// Mock organizations data`

### src/app/admin/teams/page.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 98: `console.error(err);`

### src/app/admin/workflow/page.tsx

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 99: `// TODO: Replace with real admin data service`
- Line 64: `// Temporary types until real admin service is implemented`
- Line 64: `// Temporary types until real admin service is implemented`

### src/app/api/access-codes/[id]/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 39: `console.error('Error deleting access code:', error);`

### src/app/api/access-codes/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 46: `console.error('Error fetching access codes:', error);`
- Line 85: `console.error('Error creating access code:', error);`

### src/app/api/ad-accounts/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 43: `console.error('Error fetching ad accounts:', adAccountsError);`
- Line 74: `console.error('Error in ad-accounts API:', error);`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 80: `// TODO: PATCH and DELETE handlers need to be implemented for Dolphin assets`

### src/app/api/admin/asset-bindings/cascade-unbind/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 27: `console.error('Error finding ad accounts:', adAccountsError);`
- Line 70: `console.error('Server error during cascade unbinding:', error);`

### src/app/api/admin/asset-bindings/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 62: `console.error("Warning: Could not fetch the selected Business Manager asset to store its external ID.");`
- Line 119: `console.error(`Warning: Failed to update ad_account_application status: ${appUpdateError.message}`);`
- Line 127: `console.error('Fulfillment or binding error:', error);`
- Line 158: `console.error(`Failed to update business after unbinding: ${updateError.message}`);`
- Line 165: `console.error('Server error during unbinding:', error);`

### src/app/api/admin/asset-bindings/single-unbind/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 34: `console.error('Server error during single asset unbinding:', error);`

### src/app/api/admin/business-managers/[bmId]/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 61: `console.error('Error fetching ad accounts:', adAccountsError)`
- Line 99: `console.error('Error fetching business manager details:', error)`

### src/app/api/admin/businesses/[businessId]/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 51: `console.error('Error fetching ad accounts:', adAccountsError)`
- Line 85: `console.error('Error fetching business details:', error)`

### src/app/api/admin/dolphin/route.ts

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 3: `// Mock Dolphin accounts for demo`
- Line 4: `const mockDolphinAccounts = [`
- Line 40: `const availableAccounts = mockDolphinAccounts.filter(account => account.status === 'available')`
- Line 69: `const dolphinAccount = mockDolphinAccounts.find(acc => acc.id === dolphin_account_id)`
- Line 125: `name: `Facebook Account #${mockDolphinAccounts.length + 1}`,`
- Line 132: `mockDolphinAccounts.push(newAccount)`
- Line 137: `synced_accounts: mockDolphinAccounts.length,`
- Line 138: `available_accounts: mockDolphinAccounts.filter(acc => acc.status === 'available').length`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 3: `// Mock Dolphin accounts for demo`
- Line 122: `// Add a new "synced" account for demo`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 48: `console.error('Error fetching Dolphin accounts:', error)`
- Line 103: `console.error('Error binding Dolphin account:', error)`
- Line 141: `console.error('Error syncing with Dolphin:', error)`

### src/app/api/admin/dolphin-assets/all-assets/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 59: `console.error('Admin assets API error:', error)`

### src/app/api/admin/dolphin-assets/bind/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 53: `console.error('Admin bind asset API error:', error);`

### src/app/api/admin/dolphin-assets/client/[organization_id]/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 45: `console.log('🔍 Frontend API: Calling backend URL:', backendUrl.toString())`
- Line 55: `console.log('🔍 Frontend API: Backend response status:', response.status)`
- Line 59: `console.log('🔍 Frontend API: Backend error:', errorData)`
- Line 64: `console.log('🔍 Frontend API: Backend data:', data)`
- Line 68: `console.error('Client assets API error:', error)`

### src/app/api/admin/dolphin-assets/debug/binding-check/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 49: `console.error('Admin debug binding check API error:', error)`
- Line 30: `const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/dolphin-assets/debug/binding-check``
- Line 49: `console.error('Admin debug binding check API error:', error)`

### src/app/api/admin/dolphin-assets/sync/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 42: `console.error("Backend sync error:", errorData);`
- Line 50: `console.error('Admin sync API proxy error:', error);`

### src/app/api/admin/dolphin-assets/unbind/[binding_id]/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 62: `console.error('Unbind API error:', error)`

### src/app/api/admin/dolphin-health/route.ts

#### HARDCODED_VALUES (HIGH)
Hardcoded localhost/development URLs

- Line 3: `const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';`
- Line 3: `const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';`

### src/app/api/admin/fulfill-bm-application/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 49: `console.error('Error fulfilling application:', error);`

### src/app/api/admin/get-associated-ad-accounts/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 30: `console.error("Error fetching associated ad accounts:", error);`
- Line 36: `console.error("Failed to fetch associated ad accounts:", error);`

### src/app/api/admin/organizations/[orgId]/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 82: `console.error('Error fetching organization details:', error)`

### src/app/api/admin/organizations/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 16: `console.error('Error fetching organizations for admin:', error);`

### src/app/api/admin/teams/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 19: `console.error('Error fetching teams:', error)`
- Line 30: `console.error('Error fetching organizations:', orgError);`
- Line 58: `console.error('Error in GET /api/admin/teams:', error)`
- Line 78: `console.error('Error creating team:', error)`
- Line 84: `console.error('Error in POST /api/admin/teams:', error)`

### src/app/api/admin/teams/setup/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 35: `console.error('Error creating teams table:', createError)`
- Line 49: `console.error('Error adding team_id column:', alterError)`
- Line 72: `console.error('Error creating initial team:', insertError)`
- Line 81: `console.error('Error setting up teams:', error)`

### src/app/api/admin/transactions/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 24: `console.error('Supabase error:', error)`
- Line 48: `console.error('Error fetching transactions:', error)`

### src/app/api/admin/unbound-assets/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 26: `console.error("Error fetching unbound assets:", error);`
- Line 34: `console.error("Failed to fetch unbound assets:", error);`

### src/app/api/admin/update-application-status/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 48: `console.error('Error updating application status:', error);`

### src/app/api/auth/me/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 42: `console.error('Profile fetch error:', profileError)`
- Line 58: `console.error('Auth check error:', error)`

### src/app/api/auth/promote/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 31: `console.error('Error checking existing superusers:', countError)`
- Line 46: `console.error('Error listing users:', userError)`
- Line 72: `console.error('Error creating superuser profile:', upsertError)`
- Line 145: `console.error('Error promoting user:', updateError)`
- Line 159: `console.error('Promotion error:', error)`

### src/app/api/bm-applications/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 40: `console.error('Error fetching bm_applications:', error);`
- Line 110: `console.error('Error creating BM application:', error);`

### src/app/api/business-managers/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 39: `console.error('Error fetching business managers:', bmsError);`
- Line 51: `console.error('Error fetching pending applications:', appsError);`
- Line 81: `console.error('Error in business managers API:', error);`
- Line 106: `console.error('Error unbinding business manager:', error);`
- Line 113: `console.error('Failed to unbind business manager:', error);`

### src/app/api/businesses/[businessId]/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 76: `console.error('Error fetching ad accounts:', adAccountsError);`
- Line 110: `console.error('Error fetching business details:', error);`

### src/app/api/client/assets/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 72: `console.error('Error fetching client assets:', error);`

### src/app/api/funding-requests/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 53: `console.error('Supabase error:', error)`
- Line 66: `console.error('Error creating funding request:', error)`
- Line 100: `console.error('Supabase error:', error)`
- Line 140: `console.error('Error fetching funding requests:', error)`
- Line 177: `console.error('Supabase error:', error)`
- Line 197: `console.error('Error updating funding request:', error)`

### src/app/api/onboarding-progress/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 78: `console.error('Error fetching onboarding progress:', error);`
- Line 146: `console.error('Error dismissing onboarding:', error);`

### src/app/api/organizations/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 59: `console.error("Error fetching organizations:", error);`
- Line 75: `console.error('Error fetching organizations:', msg);`
- Line 117: `console.error('Error creating organization:', msg);`
- Line 166: `console.error('Error updating organization:', msg);`
- Line 208: `console.error('Error deleting organization:', msg);`

### src/app/api/payments/create-checkout-session/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 30: `console.error('Auth error:', userError);`
- Line 53: `console.error('Error fetching organization for user:', user.id, orgError)`
- Line 89: `console.error('Checkout session creation error:', error)`
- Line 92: `console.error('Stripe error:', error.message, error.type)`
- Line 99: `console.error('General error:', error)`

### src/app/api/payments/create-intent/route.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 31: `// For demo purposes, we'll create a payment intent without a real customer`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 70: `console.error('Error creating payment intent:', error)`

### src/app/api/payments/intent/[id]/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 34: `console.error('Error fetching payment intent:', error)`

### src/app/api/payments/success/[id]/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 34: `console.error('Error fetching payment success details:', error)`

### src/app/api/payments/verify-session/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 38: `console.error('Session verification failed:', error)`

### src/app/api/payments/webhook/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 44: `console.log('Payment succeeded:', paymentIntent.id)`
- Line 49: `console.log('Payment failed:', failedPayment.id)`
- Line 53: `console.log(`Unhandled event type: ${event.type}`)`
- Line 69: `console.log('🎯 handleSuccessfulPayment called for session:', session.id)`
- Line 70: `console.log('📋 Session metadata:', session.metadata)`
- Line 91: `console.log(`Processing wallet top-up:`, {`
- Line 100: `console.log('🔍 Looking for wallet with organization_id:', organization_id)`
- Line 118: `console.log('🔧 Attempting to create wallet for organization:', organization_id)`
- Line 133: `console.log('✅ Created new wallet:', newWallet)`
- Line 137: `console.log('💰 Found wallet:', wallet)`
- Line 177: `console.log(`✅ Wallet updated successfully:`, {`
- Line 28: `console.error('Webhook signature verification failed:', err)`
- Line 59: `console.error('Webhook handler error:', error)`
- Line 79: `console.error('❌ Missing metadata in checkout session:', {`
- Line 110: `console.error('❌ Error fetching wallet or wallet not found:', {`
- Line 129: `console.error('❌ Failed to create wallet:', createError)`
- Line 148: `console.error('Error updating wallet balance:', updateError)`
- Line 174: `console.error('Error creating transaction record:', transactionError)`
- Line 184: `console.error('Error handling successful payment:', error)`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 118: `console.log('🔧 Attempting to create wallet for organization:', organization_id)`

### src/app/api/security/csp-report/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 30: `console.error('CSP Violation:', {`
- Line 63: `console.error('Error processing CSP report:', error)`

### src/app/api/teams/members/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 27: `console.error('Error fetching organization members:', membersError);`
- Line 43: `console.error('Error fetching profiles:', profilesError);`
- Line 65: `console.error('Error fetching team members:', error);`

### src/app/api/transactions/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 76: `console.error('Error fetching transactions:', error);`

### src/app/api/wallet/consolidate/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 45: `console.error('Error consolidating funds rpc:', error);`
- Line 53: `console.error('Consolidation error:', errorMessage);`

### src/app/api/wallet/transactions/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 91: `console.error(`CRITICAL: Wallet balance updated, but transaction failed for org ${organization_id}.`, transactionError);`
- Line 98: `console.error('Error processing transaction:', error);`

### src/app/api/wallet/transfer/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 56: `console.error('Supabase RPC error:', error);`
- Line 62: `console.error('An unexpected error occurred:', err);`

### src/app/auth/callback/page.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 20: `console.error("Auth callback error:", error)`
- Line 48: `console.error("Unexpected error in auth callback:", error)`

### src/app/dashboard/applications/page.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 80: `console.error('Error fetching applications:', error);`

### src/app/dashboard/business-managers/page.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 41: `if (error) console.error("Failed to load business managers:", error)`

### src/app/dashboard/wallet/business/[id]/page.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 27: `// Find business from mock data`
- Line 59: `allocated: 10000 + 1000, // Mock balance data`
- Line 61: `remaining: 10000, // Mock balance data`
- Line 67: `utilization: Math.round((1850 / (10000 + 1000)) * 100), // Mock balance data`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 68: `description: "Leading software development and consulting company specializing in enterprise solutions.",`
- Line 68: `description: "Leading software development and consulting company specializing in enterprise solutions.",`

### src/app/layout.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 20: `generator: 'v0.dev',`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 9: `import { EnvIndicator } from "../components/debug/env-indicator";`

### src/app/payment/success/page.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 40: `console.error('Error fetching payment details:', error)`

### src/app/promote-admin/page.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 14: `Development utility to promote users to admin status`
- Line 14: `Development utility to promote users to admin status`

### src/components/accounts/ConnectFacebookButton.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 74: `console.warn("Facebook SDK not ready or window.FB not available.");`
- Line 95: `console.warn('Facebook login failed or was not authorized:', response);`
- Line 52: `console.error("Facebook SDK loaded but window.FB is not available in fbAsyncInit.");`
- Line 65: `console.error("Failed to load Facebook SDK script.");`

### src/components/accounts/accounts-management.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 32: `const mockAccounts: any[] = []`
- Line 35: `const filteredAccounts = mockAccounts.filter((account) => {`
- Line 106: `const selectedAccount = selectedAccountId ? mockAccounts.find((account) => account.id === selectedAccountId) : null`

### src/components/accounts/accounts-metrics.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 67: `const dpr = window.devicePixelRatio || 1`
- Line 77: `window.addEventListener("resize", setCanvasDimensions)`
- Line 141: `window.addEventListener("resize", drawChart)`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 30: `const accountLimit = 50; // TODO: This could be fetched from user plan/settings`

### src/components/accounts/request-account-funding-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 82: `console.error('Error submitting top-up request:', error)`

### src/components/admin/AccessCodeManager.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 60: `console.error('Error fetching access codes:', error);`
- Line 91: `console.error('Error creating access code:', error);`
- Line 133: `console.error('Error deactivating code:', error);`

### src/components/admin/BindAssetDialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 113: `console.error('Binding error:', error)`

### src/components/admin/ManageAssetDialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 70: `console.error("Unbinding error:", error)`

### src/components/admin/WorkflowManagement.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 83: `const avgProcessingTime = 2.3; // Mock data - calculate from actual data`

### src/components/admin/admin-access-check.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 53: `console.error('Error fetching profile:', profileError)`
- Line 64: `console.error('Admin check error:', err)`

### src/components/admin/admin-client-accounts-table.tsx

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 27: `// TODO: Use isSuperuser prop if needed for data fetching or conditional rendering`

### src/components/admin/admin-org-accounts-table.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 19: `// Mock data for now`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 21: `{ id: '1', name: 'Demo Account 1', status: 'active' },`
- Line 22: `{ id: '2', name: 'Demo Account 2', status: 'pending' },`

### src/components/admin/admin-org-activity-log.tsx

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 63: `{/* TODO: Add filters/search for activity log */}`

### src/components/admin/admin-org-team-table.tsx

#### TEST_DATA (MEDIUM)
Test email addresses and sample data

- Line 210: `placeholder="user@example.com"`

### src/components/admin/admin-topbar.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 55: `console.error("Error signing out:", error);`

### src/components/admin/admin-view.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 27: `const [showDemoPanel, setShowDemoPanel] = useState(false)`
- Line 56: `onClick={() => setShowDemoPanel(!showDemoPanel)}`
- Line 60: `Demo Data`
- Line 73: `{/* Demo Data Panel */}`
- Line 74: `{showDemoPanel && (`
- Line 77: `<CardTitle className="text-foreground">Demo Data Management</CardTitle>`
- Line 79: `Generate and manage demo data for testing purposes`
- Line 83: `<div className="text-sm text-muted-foreground">Demo data management coming soon...</div>`

### src/components/admin/application-approval-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 57: `console.error("Error approving application:", error);`

### src/components/admin/application-asset-binding-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 69: `console.error("Failed to load assets:", error)`
- Line 126: `console.error("Fulfillment error:", error)`

### src/components/admin/application-ready-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 56: `console.error("Error marking application ready:", error);`

### src/components/admin/application-review-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 79: `console.error("Error processing application:", error);`

### src/components/admin/applications-review-table.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 96: `console.error('Error fetching applications:', error);`
- Line 174: `console.error('Error approving application:', error);`
- Line 205: `console.error('Error rejecting application:', error);`

### src/components/admin/create-account-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 104: `console.error("Error creating account:", error);`

### src/components/admin/dolphin-status-card.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 46: `console.error('Error checking Dolphin health:', error);`

### src/components/admin/promote-user.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 179: `<p>⚠️ This is for development purposes only.</p>`
- Line 179: `<p>⚠️ This is for development purposes only.</p>`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 57: `// 🚨 SECURITY: Removed dangerous console log - console.log("🚀 Starting promotion process for:", ...;`
- Line 85: `console.error("❌ Promotion failed:", data);`
- Line 93: `console.error("💥 Error promoting user:", error);`
- Line 181: `<p>1. Check if User Exists - Debug if you're in profiles table</p>`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 22: `description: "User checking temporarily disabled. Just enter the email and click promote.",`

### src/components/admin/provisioning-pipeline.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 152: `console.error(err);`

### src/components/admin/quick-actions.tsx

#### TEST_DATA (MEDIUM)
Test email addresses and sample data

- Line 187: `placeholder="user@example.com"`

### src/components/auth/login-view.tsx

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 53: `errorMessage = "Too many login attempts. Please wait a moment and try again.";`

### src/components/business-managers/apply-for-bm-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 61: `console.error("Application submission error:", error);`

#### TEST_DATA (MEDIUM)
Test email addresses and sample data

- Line 84: `placeholder="https://example.com"`

### src/components/dashboard/account-transactions-dialog.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 8: `import { APP_ACCOUNTS } from "../../lib/mock-data"`
- Line 35: `// Generate mock transaction data based on account`

### src/components/dashboard/accounts-metrics.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 1: `import { APP_ACCOUNTS } from "../../lib/mock-data"`

### src/components/dashboard/accounts-table.tsx

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 31: `// TODO: Define a proper type for the ad account object`
- Line 97: `// TODO: Bulk actions disabled - backend PATCH/DELETE endpoints removed`

### src/components/dashboard/admin-businesses-table.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 15: `import { getInitials, formatCurrency } from "../../lib/mock-data"`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 128: `console.error('Failed to delete business:', error)`
- Line 144: `console.error('Failed to approve business:', error)`

### src/components/dashboard/businesses-metrics.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 1: `import { APP_BUSINESSES } from "../../lib/mock-data"`

### src/components/dashboard/compact-filters.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 5: `import { APP_BUSINESSES, APP_ACCOUNTS } from "../../lib/mock-data"`
- Line 31: `// Get unique businesses and platforms from mock data`

### src/components/dashboard/create-business-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 82: `console.error('Failed to create business:', error)`

### src/components/dashboard/dashboard-view.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 157: `// This is HONEST - no fake historical buildup`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 90: `// Refresh app data (demo state is reactive and doesn't need manual refresh)`
- Line 259: `// Setup progress tracking - always show as if we have data for demo`
- Line 263: `realBalance > 0, // Has wallet balance (always true for demo)`
- Line 364: `// Always show filled dashboard for demo - no empty state`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 95: `console.warn('Dashboard auto-refresh failed:', error)`
- Line 302: `console.error('Failed to dismiss onboarding:', error)`

### src/components/debug/env-debug.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 3: `export function EnvDebug() {`
- Line 9: `<h3 className="font-bold mb-2">Environment Debug</h3>`

### src/components/debug/env-indicator.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 14: `case 'development':`
- Line 14: `case 'development':`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 8: `const isDebug = process.env.NEXT_PUBLIC_DEBUG === 'true'`
- Line 10: `if (!isDebug) return null`

#### HARDCODED_VALUES (HIGH)
Hardcoded localhost/development URLs

- Line 32: `Supabase: {supabaseUrl.includes('127.0.0.1') ? 'LOCAL' : 'REMOTE'}`

### src/components/landing/landing-view.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 328: `Request a Demo`

### src/components/layout/topbar.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 80: `// Use real user data from demo state`

### src/components/onboarding/welcome-onboarding-modal.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 127: `console.error('Error creating business:', error)`
- Line 151: `console.error('Error completing onboarding:', error)`
- Line 161: `console.error('Error skipping onboarding:', error)`

### src/components/settings/account-settings.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 26: `// Mock user data - in real app this would come from SWR or similar`

#### TEST_DATA (MEDIUM)
Test email addresses and sample data

- Line 30: `email: "john.doe@example.com",`

### src/components/settings/organization-settings.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 85: `// Get actual counts from demo state`

### src/components/settings/settings-view.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 35: `import { APP_ORGANIZATIONS } from "../../lib/mock-data"`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 109: `// 🚨 SECURITY: Removed dangerous console log - console.log(`Inviting ${inviteEmail} as ${inviteRo...;`
- Line 91: `navigator.clipboard.writeText(text).catch(err => console.error('Failed to copy:', err));`

#### TEST_DATA (MEDIUM)
Test email addresses and sample data

- Line 306: `<Input id="email" placeholder="colleague@example.com" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="h-8 text-xs" />`
- Line 339: `<p className="text-xs text-muted-foreground">john.doe@example.com</p>`
- Line 353: `<p className="font-medium text-xs">alex.johnson@example.com</p>`

### src/components/settings/team-settings.tsx

#### TEST_DATA (MEDIUM)
Test email addresses and sample data

- Line 236: `placeholder="email@example.com"`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 91: `// TODO: Replace with API call to /api/teams/members/invite`
- Line 114: `// TODO: Replace with API call to /api/teams/members/:id`
- Line 129: `// TODO: Replace with API call to /api/teams/members/:id`

### src/components/ui/carousel.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 89: `(event: React.KeyboardEvent<HTMLDivElement>) => {`

### src/components/ui/enhanced-loading.tsx

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 52: `<div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>`
- Line 60: `<div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>`

### src/components/ui/error-boundary.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 49: `// Log error to console in development`
- Line 50: `if (process.env.NODE_ENV === 'development') {`
- Line 69: `showDetails={process.env.NODE_ENV === 'development'}`
- Line 49: `// Log error to console in development`
- Line 50: `if (process.env.NODE_ENV === 'development') {`
- Line 69: `showDetails={process.env.NODE_ENV === 'development'}`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 51: `console.error('Error caught by boundary:', error, errorInfo)`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 178: `return "Service is temporarily unavailable. We're working to fix this."`

#### ENV_LEAKS (HIGH)
Environment variables that force development behavior

- Line 50: `if (process.env.NODE_ENV === 'development') {`
- Line 69: `showDetails={process.env.NODE_ENV === 'development'}`
- Line 50: `if (process.env.NODE_ENV === 'development') {`
- Line 69: `showDetails={process.env.NODE_ENV === 'development'}`

### src/components/ui/input-otp.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 38: `const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]`
- Line 51: `{hasFakeCaret && (`

### src/components/ui/modal.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 15: `function handleKeyDown(e: KeyboardEvent) {`
- Line 18: `window.addEventListener("keydown", handleKeyDown)`

### src/components/ui/sidebar.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 101: `const handleKeyDown = (event: KeyboardEvent) => {`
- Line 111: `window.addEventListener("keydown", handleKeyDown)`

### src/components/ui/use-mobile.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 13: `mql.addEventListener("change", onChange)`

### src/components/wallet/balance-card.tsx

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 26: `const actualGrowth = growth ?? 0 // TODO: Calculate from transaction history`

### src/components/wallet/business-balances-table.tsx

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 71: `accounts: 0, // TODO: Get real account count`

### src/components/wallet/recent-transactions.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 23: `// Mock data`

### src/components/wallet/stripe-checkout-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 64: `console.error("Error creating checkout session:", errorText);`

### src/components/wallet/transaction-card.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 19: `// Mock data`

### src/components/wallet/withdraw-funds.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 26: `// Mock data`

### src/contexts/AuthContext.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 22: `// Removed demo mode imports - using real Supabase only`
- Line 302: `window.addEventListener('mousemove', resetTimer);`
- Line 303: `window.addEventListener('keydown', resetTimer);`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 58: `console.error("Error signing out:", error);`
- Line 82: `console.error("Error signing up:", error);`
- Line 105: `console.error("❌ Error signing in:", error, {`
- Line 135: `console.error("Error sending password reset email:", error);`
- Line 163: `console.error("Error initiating Google sign-in:", error);`
- Line 179: `console.error("Error resending verification email:", error);`
- Line 222: `console.error('Failed to fetch organization:', error);`
- Line 231: `console.error("Error fetching initial session:", error);`
- Line 273: `console.error('Failed to fetch organization:', error);`

### src/hooks/use-mobile.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 13: `mql.addEventListener("change", onChange)`

### src/hooks/useAdminRoute.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 29: `console.error('Error fetching profile:', profileError)`
- Line 36: `console.error('Admin check error:', err)`

### src/hooks/useAdvancedOnboarding.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 91: `console.error('Error dismissing onboarding:', error);`

### src/hooks/useAutoRefresh.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 91: `document.addEventListener('visibilitychange', handleVisibilityChange)`
- Line 109: `window.addEventListener('online', handleOnline)`
- Line 110: `window.addEventListener('offline', handleOffline)`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 47: `console.warn('Auto-refresh failed:', error)`
- Line 68: `console.warn('Manual refresh failed:', error)`

### src/hooks/useMediaQuery.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 15: `media.addEventListener("change", listener)`

### src/hooks/useServerPagination.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 126: `console.error('Failed to load more data:', error);`

### src/instrumentation-client.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 20: `// in development and sample at a lower rate in production`
- Line 20: `// in development and sample at a lower rate in production`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 27: `debug: false,`

### src/lib/api-config.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 124: `export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'`
- Line 124: `export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'`

#### ENV_LEAKS (HIGH)
Environment variables that force development behavior

- Line 124: `export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'`
- Line 124: `export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'`

### src/lib/config/api.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 42: `isDevelopment: ENV_CONFIG.IS_DEVELOPMENT,`
- Line 42: `isDevelopment: ENV_CONFIG.IS_DEVELOPMENT,`

### src/lib/config/assets.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 107: `// Asset configuration info for debugging`

### src/lib/config/financial.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 39: `// ✅ SECURE: Demo data for development (clearly marked as demo)`
- Line 40: `export const DEMO_DISPLAY_DATA = {`
- Line 41: `demoWalletBalance: 15420,`
- Line 42: `demoAccountBalance: 4250,`
- Line 43: `demoSpendLimit: 5000,`
- Line 44: `demoFeeRate: 0.05,`
- Line 39: `// ✅ SECURE: Demo data for development (clearly marked as demo)`
- Line 72: `if (process.env.NODE_ENV === 'development') {`
- Line 39: `// ✅ SECURE: Demo data for development (clearly marked as demo)`
- Line 72: `if (process.env.NODE_ENV === 'development') {`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 73: `console.warn(SECURITY_WARNING)`

#### ENV_LEAKS (HIGH)
Environment variables that force development behavior

- Line 72: `if (process.env.NODE_ENV === 'development') {`
- Line 72: `if (process.env.NODE_ENV === 'development') {`

### src/lib/config/index.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 31: `USE_DEMO_DATA: process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true',`
- Line 106: `useDemoData: CONFIG.FEATURES.USE_DEMO_DATA,`
- Line 25: `ENVIRONMENT: process.env.NODE_ENV || 'development',`
- Line 26: `DEBUG: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG === 'true',`
- Line 101: `// Log configuration info in development`
- Line 25: `ENVIRONMENT: process.env.NODE_ENV || 'development',`
- Line 26: `DEBUG: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG === 'true',`
- Line 101: `// Log configuration info in development`
- Line 31: `USE_DEMO_DATA: process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true',`
- Line 106: `useDemoData: CONFIG.FEATURES.USE_DEMO_DATA,`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 103: `console.log('🔧 Configuration loaded:', {`
- Line 98: `console.warn('⚠️ Configuration warnings:', validation.errors)`
- Line 95: `console.error('❌ Configuration validation failed:', validation.errors)`
- Line 26: `DEBUG: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG === 'true',`
- Line 78: `debug: CONFIG.APP.DEBUG,`
- Line 97: `} else if (!validation.valid && CONFIG.APP.DEBUG) {`
- Line 102: `if (CONFIG.APP.DEBUG) {`

#### ENV_LEAKS (HIGH)
Environment variables that force development behavior

- Line 25: `ENVIRONMENT: process.env.NODE_ENV || 'development',`
- Line 26: `DEBUG: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG === 'true',`
- Line 26: `DEBUG: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG === 'true',`

### src/lib/data/config.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 6: `isLocalDev: process.env.NODE_ENV === 'development',`
- Line 15: `export const isLocalDevelopment = () => config.isLocalDev;`
- Line 16: `export const isDevelopment = isLocalDevelopment; // Alias for backward compatibility`
- Line 6: `isLocalDev: process.env.NODE_ENV === 'development',`
- Line 15: `export const isLocalDevelopment = () => config.isLocalDev;`
- Line 16: `export const isDevelopment = isLocalDevelopment; // Alias for backward compatibility`

#### ENV_LEAKS (HIGH)
Environment variables that force development behavior

- Line 6: `isLocalDev: process.env.NODE_ENV === 'development',`
- Line 6: `isLocalDev: process.env.NODE_ENV === 'development',`

### src/lib/env-config.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 75: `USE_DEMO_DATA: process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true',`
- Line 102: `USE_DEMO_DATA: ENV_CONFIG.USE_DEMO_DATA,`
- Line 114: `USE_DEMO_DATA,`
- Line 9: `const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'`
- Line 28: `// 4. Development fallback`
- Line 48: `// 4. Development fallback`
- Line 57: `IS_DEVELOPMENT,`
- Line 76: `ENABLE_DEBUG: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true' || IS_DEVELOPMENT,`
- Line 96: `// 🎯 Development logging`
- Line 97: `if (IS_DEVELOPMENT) {`
- Line 9: `const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'`
- Line 28: `// 4. Development fallback`
- Line 48: `// 4. Development fallback`
- Line 57: `IS_DEVELOPMENT,`
- Line 76: `ENABLE_DEBUG: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true' || IS_DEVELOPMENT,`
- Line 96: `// 🎯 Development logging`
- Line 97: `if (IS_DEVELOPMENT) {`
- Line 75: `USE_DEMO_DATA: process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true',`
- Line 102: `USE_DEMO_DATA: ENV_CONFIG.USE_DEMO_DATA,`
- Line 114: `USE_DEMO_DATA,`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 98: `console.log('🌍 Environment Configuration:', {`
- Line 89: `console.warn('⚠️ NEXT_PUBLIC_APP_URL not set in production')`
- Line 93: `console.warn('⚠️ NEXT_PUBLIC_API_URL not set in production')`
- Line 76: `ENABLE_DEBUG: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true' || IS_DEVELOPMENT,`
- Line 115: `ENABLE_DEBUG,`

#### HARDCODED_VALUES (HIGH)
Hardcoded localhost/development URLs

- Line 29: `return 'http://localhost:3000'`
- Line 49: `return 'http://localhost:8000'`
- Line 72: `DOMAIN: IS_PRODUCTION ? 'adhub.com' : (IS_STAGING ? 'staging.adhub.tech' : 'localhost'),`
- Line 29: `return 'http://localhost:3000'`
- Line 49: `return 'http://localhost:8000'`

#### ENV_LEAKS (HIGH)
Environment variables that force development behavior

- Line 9: `const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'`
- Line 9: `const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'`

### src/lib/external-links.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 279: `'http:', // Only for localhost/development`
- Line 205: `document.addEventListener('visibilitychange', handleVisibilityChange);`
- Line 279: `'http:', // Only for localhost/development`

#### HARDCODED_VALUES (HIGH)
Hardcoded localhost/development URLs

- Line 279: `'http:', // Only for localhost/development`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 114: `// Desktop App - Profile Templates`
- Line 115: `templates: () => 'dolphin-anty://templates',`
- Line 122: `webTemplates: () => 'https://anty.dolphin.tech/templates'`

### src/lib/form-validation.ts

#### TEST_DATA (MEDIUM)
Test email addresses and sample data

- Line 61: `return { field: fieldName, message: 'Please enter a valid URL (e.g., example.com, www.example.com, or https://example.com)' }`

### src/lib/id-utils.ts

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 70: `* TODO: Remove this once we standardize the schema`
- Line 69: `* Temporary helper to handle the current ID confusion`
- Line 69: `* Temporary helper to handle the current ID confusion`

### src/lib/performance.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 99: `// Bundle size analyzer (development only)`
- Line 102: `if (process.env.NODE_ENV === 'development') {`
- Line 125: `if (usage && process.env.NODE_ENV === 'development') {`
- Line 99: `// Bundle size analyzer (development only)`
- Line 102: `if (process.env.NODE_ENV === 'development') {`
- Line 125: `if (usage && process.env.NODE_ENV === 'development') {`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 104: `console.log(`📦 ${componentName} size: ${(size / 1024).toFixed(2)}KB`)`
- Line 126: `console.log(`🧠 ${label} - Memory: ${usage.used}MB / ${usage.total}MB (limit: ${usage.limit}MB)`)`

#### ENV_LEAKS (HIGH)
Environment variables that force development behavior

- Line 102: `if (process.env.NODE_ENV === 'development') {`
- Line 125: `if (usage && process.env.NODE_ENV === 'development') {`
- Line 102: `if (process.env.NODE_ENV === 'development') {`
- Line 125: `if (usage && process.env.NODE_ENV === 'development') {`

### src/lib/security/csp.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 28: `"'unsafe-inline'", // Required for Next.js development - remove in production with nonces`
- Line 59: `process.env.NODE_ENV === "development" ? "ws://localhost:*" : "",`
- Line 60: `process.env.NODE_ENV === "development" ? "http://localhost:*" : "",`
- Line 76: `* Development CSP Configuration - More permissive for development`
- Line 78: `export const DEVELOPMENT_CSP: CSPConfig = {`
- Line 83: `"'unsafe-eval'", // Required for development`
- Line 129: `return process.env.NODE_ENV === 'production' ? PRODUCTION_CSP : DEVELOPMENT_CSP`
- Line 195: `// Prevent search engines from indexing in development`
- Line 196: `...((process.env.NODE_ENV === "development") && {`
- Line 28: `"'unsafe-inline'", // Required for Next.js development - remove in production with nonces`
- Line 59: `process.env.NODE_ENV === "development" ? "ws://localhost:*" : "",`
- Line 60: `process.env.NODE_ENV === "development" ? "http://localhost:*" : "",`
- Line 76: `* Development CSP Configuration - More permissive for development`
- Line 78: `export const DEVELOPMENT_CSP: CSPConfig = {`
- Line 83: `"'unsafe-eval'", // Required for development`
- Line 129: `return process.env.NODE_ENV === 'production' ? PRODUCTION_CSP : DEVELOPMENT_CSP`
- Line 195: `// Prevent search engines from indexing in development`
- Line 196: `...((process.env.NODE_ENV === "development") && {`

#### HARDCODED_VALUES (HIGH)
Hardcoded localhost/development URLs

- Line 59: `process.env.NODE_ENV === "development" ? "ws://localhost:*" : "",`
- Line 60: `process.env.NODE_ENV === "development" ? "http://localhost:*" : "",`
- Line 95: `"ws://localhost:*",`
- Line 96: `"http://localhost:*",`
- Line 97: `"ws://127.0.0.1:*",`
- Line 98: `"http://127.0.0.1:*"`

#### ENV_LEAKS (HIGH)
Environment variables that force development behavior

- Line 59: `process.env.NODE_ENV === "development" ? "ws://localhost:*" : "",`
- Line 60: `process.env.NODE_ENV === "development" ? "http://localhost:*" : "",`
- Line 129: `return process.env.NODE_ENV === 'production' ? PRODUCTION_CSP : DEVELOPMENT_CSP`
- Line 196: `...((process.env.NODE_ENV === "development") && {`
- Line 59: `process.env.NODE_ENV === "development" ? "ws://localhost:*" : "",`
- Line 60: `process.env.NODE_ENV === "development" ? "http://localhost:*" : "",`
- Line 129: `return process.env.NODE_ENV === 'production' ? PRODUCTION_CSP : DEVELOPMENT_CSP`
- Line 196: `...((process.env.NODE_ENV === "development") && {`

### src/lib/security/rate-limiter.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 186: `console.error('Rate limiting error:', error)`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 88: `maxRequests: 5,            // 5 attempts per 15 minutes`

### src/lib/toast-messages.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 186: `demo: {`
- Line 187: `dataReset: { description: "Demo data has been reset successfully." },`
- Line 188: `modeRestriction: { description: "This feature is not available in demo mode." }`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 20: `tooManyRequests: { description: "Too many login attempts. Please wait a moment and try again." },`

### src/middleware.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 18: `console.warn('Supabase environment variables not available in middleware, skipping auth check')`
- Line 75: `console.warn('Error getting session in middleware:', error)`

### src/scripts/audit-ui-states.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 29: `console.log('🔍 Starting UI State Audit...\n')`
- Line 41: `console.log(`${status} ${result.component}: ${result.score}/100 (${result.issues.length} issues)`)`
- Line 46: `console.log(`   🚨 CRITICAL: ${critical.map(i => i.description).join(', ')}`)`
- Line 50: `console.log(`❌ Error auditing ${componentPath}: ${error}`)`
- Line 59: `console.log(`\n📊 Audit complete! Report saved to: ${reportPath}`)`
- Line 66: `console.log(`\n📈 Summary:`)`
- Line 67: `console.log(`   Average Score: ${avgScore.toFixed(1)}/100`)`
- Line 68: `console.log(`   Critical Issues: ${criticalCount}`)`
- Line 69: `console.log(`   High Priority Issues: ${highCount}`)`
- Line 72: `console.log(`\n⚠️  Your UI state handling needs improvement!`)`
- Line 73: `console.log(`   Focus on adding proper error handling, loading states, and empty states.`)`
- Line 75: `console.log(`\n👍 Good job! Some improvements needed for production readiness.`)`
- Line 77: `console.log(`\n🎉 Excellent! Your components have robust UI state handling.`)`
- Line 87: `console.log(`\n🔍 Quick Check: ${result.component}`)`
- Line 88: `console.log(`Score: ${result.score}/100`)`
- Line 89: `console.log(`Issues: ${result.issues.length}`)`
- Line 92: `console.log(`\nIssues:`)`
- Line 97: `console.log(`  ${emoji} ${issue.description}`)`
- Line 98: `console.log(`     Solution: ${issue.suggestion}`)`
- Line 104: `console.error(`Error checking ${componentPath}:`, error)`
- Line 111: `runAudit().catch(console.error)`

### src/scripts/simple-audit.js

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 97: `console.log('🔍 Starting UI State Audit...\n')`
- Line 105: `console.log(`❌ Error auditing ${componentPath}: ${result.error}`)`
- Line 112: `console.log(`${status} ${result.component}: ${result.score}/100 (${result.issues.length} issues)`)`
- Line 116: `console.log(`   • ${issue}`)`
- Line 126: `console.log(`\n📈 Summary:`)`
- Line 127: `console.log(`   Components Audited: ${results.length}`)`
- Line 128: `console.log(`   Average Score: ${avgScore.toFixed(1)}/100`)`
- Line 129: `console.log(`   Total Issues: ${totalIssues}`)`
- Line 132: `console.log(`\n⚠️  Your UI state handling needs improvement!`)`
- Line 133: `console.log(`   Focus on adding proper error handling, loading states, and empty states.`)`
- Line 135: `console.log(`\n👍 Good job! Some improvements needed for production readiness.`)`
- Line 137: `console.log(`\n🎉 Excellent! Your components have robust UI state handling.`)`
- Line 160: `console.log(`\n📊 Full report saved to: UI_STATE_AUDIT_REPORT.md`)`

### src/services/supabase-service.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 13: `// In development, use localhost`
- Line 13: `// In development, use localhost`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 46: `console.error('Error fetching accounts:', error)`
- Line 65: `console.error('Error fetching organization accounts:', error)`
- Line 84: `console.error('Error fetching all accounts:', error)`
- Line 111: `console.error('Error creating account:', error)`
- Line 134: `console.error('Error updating account:', error)`
- Line 149: `console.error('Error deleting account:', error)`
- Line 170: `console.error('Error fetching transactions:', error)`
- Line 189: `console.error('Error fetching all transactions:', error)`
- Line 213: `console.error('Error creating transaction:', error)`
- Line 239: `console.error('Error fetching organizations:', error)`
- Line 259: `console.error('Error fetching all organizations:', error)`
- Line 279: `console.error('Error creating organization:', error)`
- Line 310: `console.error('Error fetching organization members:', membersError)`
- Line 326: `console.error('Error fetching profiles:', profilesError)`
- Line 361: `console.error('Error fetching user profile:', error)`
- Line 382: `console.error('Error updating user profile:', error)`
- Line 402: `console.error('Error fetching onboarding progress:', error)`
- Line 418: `console.error('Error updating onboarding step:', error)`
- Line 430: `console.error('Error dismissing onboarding:', error)`
- Line 442: `console.error('Error resetting onboarding:', error)`
- Line 454: `console.error('Error checking onboarding completion:', error)`
- Line 525: `console.error('Error fetching dolphin assets:', error)`
- Line 561: `console.error('Error syncing dolphin assets:', error)`
- Line 586: `console.error('Error fetching client assets:', error)`

#### HARDCODED_VALUES (HIGH)
Hardcoded localhost/development URLs

- Line 10: `if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {`
- Line 13: `// In development, use localhost`
- Line 14: `return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'`
- Line 14: `return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'`

### src/types/supabase.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 1087: `add_user_to_demo_org: {`
- Line 1106: `seed_demo_data_for_current_user: {`
- Line 1110: `setup_demo_for_user: {`

### src/utils/format.ts

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 67: `// This function should now get data from the app context instead of mock data`
- Line 69: `// TODO: Get accounts from useAppData context instead of mock data`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 69: `// TODO: Get accounts from useAppData context instead of mock data`

## Recommendations

### ⚠️ HIGH PRIORITY (Strongly Recommended)
- Replace all mock data with real data sources
- Remove demo mode code
- Replace hardcoded development URLs
- Fix environment variable leaks

### 📝 MEDIUM PRIORITY (Recommended)
- Remove debug console logs
- Replace test email addresses
- Clean up development comments

## Environment Configuration

Ensure your production environment has:
- `NODE_ENV=production`
- `NEXT_PUBLIC_USE_MOCK_DATA=false`
- `NEXT_PUBLIC_DEMO_MODE=false`
- Real API URLs (not localhost)
- Production database credentials
- Real Supabase URLs and keys


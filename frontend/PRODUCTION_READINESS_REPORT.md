# 🚨 Production Readiness Audit Report

Generated: 2025-06-26T22:35:35.627Z

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 230 |
| Medium | 317 |
| Low | 38 |
| **Total** | **585** |

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

### src/app/admin/applications/page.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 88: `console.error(`Error during ${action}:`, errorMessage);`

### src/app/admin/assets/page.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 40: `console.error('Error loading assets:', err)`
- Line 79: `console.error('Error syncing assets:', err)`

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

### src/app/admin/organizations/[orgId]/page.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 80: `console.error('Error fetching organization:', err)`

### src/app/admin/organizations/page.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 79: `// For now, use mock teams data - in production this would also come from API`

### src/app/admin/page.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 64: `console.error('Failed to fetch applications:', err)`
- Line 88: `console.error('Failed to fetch funding requests:', err)`

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

- Line 117: `console.error('Error fetching ad accounts:', error);`
- Line 104: `// Raw Dolphin data for debugging`

### src/app/api/admin/applications/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 88: `console.log('Found businesses:', businessAppsData?.length || 0);`
- Line 90: `console.log(`Business: ${business.name}, Status: ${business.status}`);`
- Line 109: `console.log('Total applications found:', allApplications.length);`
- Line 41: `console.warn('Warning: Could not fetch users for email mapping:', usersError);`
- Line 46: `console.warn('Warning: User fetching failed, continuing without email mapping:', userError);`
- Line 57: `console.error('Supabase error fetching ad account apps:', error);`
- Line 73: `console.error('Error fetching ad account applications:', adAccountError);`
- Line 84: `console.error('Supabase error fetching business apps:', businessAppsError);`
- Line 112: `console.error('Error in GET /api/admin/applications:', error);`
- Line 157: `console.error('Error updating business application:', error);`
- Line 196: `console.error('Supabase error:', error);`
- Line 212: `console.error('Error updating application:', error)`
- Line 248: `console.error('Supabase error:', error)`
- Line 261: `console.error('Error creating application:', error)`
- Line 14: `const debug = url.searchParams.get('debug')`
- Line 16: `// Debug mode - just return all businesses with their statuses`
- Line 17: `if (debug === 'true') {`
- Line 18: `const { data: allBusinesses, error: debugError } = await supabase`
- Line 23: `if (debugError) {`
- Line 24: `return NextResponse.json({ error: 'Debug query failed', details: debugError }, { status: 500 });`
- Line 28: `debug: true,`

### src/app/api/admin/assets/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 91: `console.error('Assets API error:', error);`
- Line 136: `console.error('Assets POST API error:', error);`

#### HARDCODED_VALUES (HIGH)
Hardcoded localhost/development URLs

- Line 4: `const BACKEND_API_URL = process.env.BACKEND_URL || 'http://localhost:8000';`
- Line 4: `const BACKEND_API_URL = process.env.BACKEND_URL || 'http://localhost:8000';`

### src/app/api/admin/bind-asset/route.ts

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 16: `// For now, return a mock success response since the backend binding is complex`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 18: `console.log('Binding request:', { asset_id, asset_type, organization_id, notes });`
- Line 30: `console.error('Binding API error:', error);`

#### HARDCODED_VALUES (HIGH)
Hardcoded localhost/development URLs

- Line 3: `const BACKEND_API_URL = process.env.BACKEND_URL || 'http://localhost:8000';`
- Line 3: `const BACKEND_API_URL = process.env.BACKEND_URL || 'http://localhost:8000';`

### src/app/api/admin/businesses/[businessId]/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 49: `console.error('Error fetching business details:', error)`

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

### src/app/api/admin/dolphin-assets/bind/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 64: `console.error('Error binding asset:', error);`

### src/app/api/admin/dolphin-health/route.ts

#### HARDCODED_VALUES (HIGH)
Hardcoded localhost/development URLs

- Line 3: `const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';`
- Line 3: `const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';`

### src/app/api/admin/organizations/[orgId]/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 59: `console.error('Error fetching organization details:', error)`

### src/app/api/admin/organizations/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 44: `console.error('Error fetching organizations:', error);`

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

### src/app/api/applications/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 63: `console.error('Error fetching applications:', error);`
- Line 128: `console.error('Error counting ad accounts, will use a non-unique name.', countError);`
- Line 151: `console.error('Supabase error creating ad account application:', insertError);`
- Line 162: `console.error('Error creating ad account application:', error);`

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
- Line 72: `console.error('Error creating admin profile:', upsertError)`
- Line 149: `console.error('Error promoting user:', updateError)`
- Line 163: `console.error('Promotion error:', error)`

### src/app/api/businesses/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 25: `console.error('Supabase error fetching businesses:', error);`
- Line 32: `console.error('Error fetching businesses:', error);`
- Line 62: `console.error('Supabase error creating business:', error);`
- Line 69: `console.error('Error creating business:', error);`
- Line 100: `console.error('Supabase error updating business:', error);`
- Line 107: `console.error('Error updating business:', error);`

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

- Line 71: `console.error('Error fetching onboarding progress:', error);`
- Line 131: `console.error('Error dismissing onboarding:', error);`

### src/app/api/organizations/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 63: `console.error('Error fetching organization:', orgError);`
- Line 85: `console.error('Error fetching organizations:', membershipError);`
- Line 106: `console.error('Error fetching organizations:', error);`
- Line 153: `console.error('Error creating organization:', orgError);`
- Line 167: `console.error('Error adding organization member:', memberError);`
- Line 179: `console.error('Error creating wallet:', walletError);`
- Line 190: `console.error('Error creating organization:', error);`

### src/app/api/payments/create-checkout-session/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 12: `console.log("API Route is using Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);`
- Line 13: `console.log("Stripe key configured:", !!process.env.STRIPE_SECRET_KEY);`
- Line 14: `console.log("Supabase service role key configured:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);`
- Line 22: `console.log('Received auth token:', token ? 'Present' : 'Missing');`
- Line 29: `console.log('User auth result:', { user: user ? { id: user.id, email: user.email } : null, userError });`
- Line 43: `console.log('Received payment data:', { amount, wallet_credit, success_url, cancel_url });`
- Line 44: `console.log('User ID:', user.id);`
- Line 53: `console.log('Organization query result:', { org, orgError });`
- Line 32: `console.error('Auth error:', userError);`
- Line 56: `console.error('Error fetching organization for user:', user.id, orgError)`
- Line 92: `console.error('Checkout session creation error:', error)`
- Line 95: `console.error('Stripe error:', error.message, error.type)`
- Line 102: `console.error('General error:', error)`

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
- Line 83: `console.log(`Processing wallet top-up:`, {`
- Line 141: `console.log(`✅ Wallet updated successfully:`, {`
- Line 28: `console.error('Webhook signature verification failed:', err)`
- Line 59: `console.error('Webhook handler error:', error)`
- Line 76: `console.error('Missing metadata in checkout session:', session.id)`
- Line 99: `console.error('Error fetching wallet:', walletError)`
- Line 112: `console.error('Error updating wallet balance:', updateError)`
- Line 138: `console.error('Error creating transaction record:', transactionError)`
- Line 148: `console.error('Error handling successful payment:', error)`

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

- Line 74: `console.error('Error fetching transactions:', error);`

### src/app/api/wallet/consolidate/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 43: `console.error('Error consolidating funds rpc:', error);`
- Line 51: `console.error('Consolidation error:', errorMessage);`

### src/app/api/wallet/transactions/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 91: `console.error(`CRITICAL: Wallet balance updated, but transaction failed for org ${organization_id}.`, transactionError);`
- Line 98: `console.error('Error processing transaction:', error);`

### src/app/api/wallet/transfer/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 38: `console.error('Supabase RPC error:', error);`
- Line 44: `console.error('An unexpected error occurred:', err);`

### src/app/auth/callback/page.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 20: `console.error("Auth callback error:", error)`
- Line 48: `console.error("Unexpected error in auth callback:", error)`

### src/app/dashboard/applications/page.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 80: `console.error('Error fetching applications:', error);`

### src/app/dashboard/businesses/page.tsx

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 25: `// This effect is a temporary solution to bridge the gap from the old context.`
- Line 25: `// This effect is a temporary solution to bridge the gap from the old context.`

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

### src/app/dashboard/wallet/page.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 31: `console.log('🔄 Triggering SWR revalidation for organizations...');`

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

### src/components/admin/WorkflowManagement.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 83: `const avgProcessingTime = 2.3; // Mock data - calculate from actual data`

### src/components/admin/admin-access-check.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 42: `console.error('Error fetching profile:', profileError)`
- Line 51: `console.error('Admin check error:', err)`

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

- Line 44: `console.log("Admin sign out");`

### src/components/admin/admin-view.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 25: `const { data: revenueData, isLoading: revenueLoading } = useSWR('/api/admin/revenue', fetcher); // Mock endpoint`
- Line 26: `const { data: ticketsData, isLoading: ticketsLoading } = useSWR('/api/admin/tickets', fetcher); // Mock endpoint`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 33: `const [showDemoPanel, setShowDemoPanel] = useState(false)`
- Line 67: `onClick={() => setShowDemoPanel(!showDemoPanel)}`
- Line 71: `Demo Data`
- Line 84: `{/* Demo Data Panel */}`
- Line 85: `{showDemoPanel && (`
- Line 88: `<CardTitle className="text-foreground">Demo Data Management</CardTitle>`
- Line 90: `Generate and manage demo data for testing purposes`
- Line 94: `<div className="text-sm text-muted-foreground">Demo data management coming soon...</div>`

### src/components/admin/application-approval-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 57: `console.error("Error approving application:", error);`

### src/components/admin/application-asset-binding-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 70: `console.error('Error loading assets:', err)`
- Line 95: `console.error('Error binding assets:', err)`

### src/components/admin/application-binding-dialog.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 29: `// Mock data for teams and business managers`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 61: `console.error("Error binding application:", error);`

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

### src/components/admin/asset-binding-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 68: `console.error('Error fetching organizations:', error);`
- Line 96: `console.error('Error fetching businesses:', error);`
- Line 152: `console.error("Error binding asset:", error);`

### src/components/admin/bind-asset-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 83: `console.error('Error loading organizations:', err)`
- Line 98: `console.error('Error loading businesses:', err)`
- Line 149: `console.error('Error binding asset:', err)`

### src/components/admin/create-account-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 104: `console.error("Error creating account:", error);`

### src/components/admin/dolphin-status-card.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 46: `console.error('Error checking Dolphin health:', error);`

### src/components/admin/enhanced-application-approval-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 90: `console.error('Error fetching Dolphin accounts:', error)`
- Line 142: `console.error('Error approving application:', error)`
- Line 177: `console.error('Error rejecting application:', error)`
- Line 198: `console.error('Error syncing with Dolphin:', error)`

### src/components/admin/promote-user.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 182: `<p>⚠️ This is for development purposes only.</p>`
- Line 182: `<p>⚠️ This is for development purposes only.</p>`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 57: `// 🚨 SECURITY: Removed dangerous console log - console.log("🚀 Starting promotion process for:", ...;`
- Line 60: `console.log("📡 Promoting user...");`
- Line 73: `console.log("📡 Promotion response:", { status: response.status, data });`
- Line 76: `console.log("✅ Promotion successful!");`
- Line 88: `console.error("❌ Promotion failed:", data);`
- Line 96: `console.error("💥 Error promoting user:", error);`
- Line 184: `<p>1. Check if User Exists - Debug if you're in profiles table</p>`

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

### src/components/businesses/business-application-form.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 50: `console.log("Form data at submission:", formData);`
- Line 73: `console.log("Found organizationId:", organizationId);`
- Line 83: `console.log("Sending payload to /api/businesses:", payload);`
- Line 114: `console.error('Error submitting application:', error)`

### src/components/businesses/businesses-metrics.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 1: `import { APP_BUSINESSES } from "../../lib/mock-data"`

### src/components/businesses/businesses-view.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 36: `// Mock data based on the new onboarding workflow - businesses that would be created from onboarding`

#### TEST_DATA (MEDIUM)
Test email addresses and sample data

- Line 45: `landingPage: "https://store.example.com",`
- Line 56: `landingPage: "https://blog.example.com",`
- Line 67: `landingPage: "https://affiliate.example.com",`
- Line 78: `landingPage: "https://saas.example.com",`

### src/components/businesses/client-businesses-table.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 337: `console.log('Edit business:', business.id)`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 86: `return 0 // TODO: Add account count logic when available`
- Line 88: `return 0 // TODO: Add balance logic when available`
- Line 332: `{/* TODO: Update EditBusinessDialog to work with production Business type */}`
- Line 338: `// TODO: Implement edit business functionality`

### src/components/businesses/create-business-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 82: `console.error('Failed to create business:', error)`

### src/components/businesses/enhanced-business-card.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 83: `console.log('Manage business:', business.id)`

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

- Line 29: `// TODO: Define a proper type for the ad account object`

### src/components/dashboard/admin-businesses-table.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 15: `import { getInitials, formatCurrency } from "../../lib/mock-data"`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 112: `console.log("Business updated:", updatedBusiness)`
- Line 129: `console.error('Failed to delete business:', error)`
- Line 145: `console.error('Failed to approve business:', error)`

### src/components/dashboard/businesses-metrics.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 1: `import { APP_BUSINESSES } from "../../lib/mock-data"`

### src/components/dashboard/compact-accounts-table.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 89: `console.log("New account created")`

### src/components/dashboard/compact-filters.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 5: `import { APP_BUSINESSES, APP_ACCOUNTS } from "../../lib/mock-data"`
- Line 31: `// Get unique businesses and platforms from mock data`

### src/components/dashboard/create-business-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 83: `console.error('Failed to create business:', error)`

### src/components/dashboard/dashboard-view.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 200: `// This is HONEST - no fake historical buildup`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 122: `// Refresh app data (demo state is reactive and doesn't need manual refresh)`
- Line 302: `// Setup progress tracking - always show as if we have data for demo`
- Line 306: `realBalance > 0, // Has wallet balance (always true for demo)`
- Line 407: `// Always show filled dashboard for demo - no empty state`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 146: `console.log('Current organization not found, switching to first available organization');`
- Line 127: `console.warn('Dashboard auto-refresh failed:', error)`
- Line 345: `console.error('Failed to dismiss onboarding:', error)`

### src/components/dashboard/edit-business-dialog.tsx

#### TEST_DATA (MEDIUM)
Test email addresses and sample data

- Line 305: `const newDomain = prompt("Enter domain name (e.g., example.com):")`

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

### src/components/organization/organization-switcher.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 90: `console.error('Failed to create organization:', error)`

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

- Line 75: `// Get actual counts from demo state`

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

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 92: `console.log("Inviting new member", inviteEmail, inviteRole)`
- Line 115: `console.log("Removing member", memberToRemove)`
- Line 130: `console.log("Changing role for", memberId, "to", newRole)`

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

### src/components/wallet/top-up-wallet.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 74: `console.log(`Attempting top-up of ${numAmount} via ${paymentMethod} for orgId: ${orgId}`)`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 74: `console.log(`Attempting top-up of ${numAmount} via ${paymentMethod} for orgId: ${orgId}`)`

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

- Line 21: `// Removed demo mode imports - using real Supabase only`
- Line 252: `window.addEventListener('mousemove', resetTimer);`
- Line 253: `window.addEventListener('keydown', resetTimer);`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 55: `console.error("Error signing out:", error);`
- Line 78: `console.error("Error signing up:", error);`
- Line 101: `console.error("❌ Error signing in:", error, {`
- Line 131: `console.error("Error sending password reset email:", error);`
- Line 159: `console.error("Error initiating Google sign-in:", error);`
- Line 175: `console.error("Error resending verification email:", error);`
- Line 204: `console.error("Error fetching initial session:", error);`

### src/hooks/use-mobile.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 13: `mql.addEventListener("change", onChange)`

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

### src/lib/config/pricing-management.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 241: `console.log(`Updating plan ${planId} with:`, updates)`
- Line 247: `console.log('Creating pricing experiment:', experiment)`

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

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 165: `console.log('External link clicked:', { url, ...trackingData });`
- Line 182: `console.log('Desktop app link clicked:', { desktopUrl, webFallbackUrl, ...trackingData });`

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

- Line 14: `// In development, use localhost`
- Line 14: `// In development, use localhost`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 48: `console.error('Error fetching businesses:', error)`
- Line 66: `console.error('Error fetching all businesses:', error)`
- Line 88: `console.error('Error creating business:', error)`
- Line 109: `console.error('Error updating business:', error)`
- Line 124: `console.error('Error deleting business:', error)`
- Line 144: `console.error('Error fetching accounts:', error)`
- Line 163: `console.error('Error fetching organization accounts:', error)`
- Line 182: `console.error('Error fetching all accounts:', error)`
- Line 209: `console.error('Error creating account:', error)`
- Line 232: `console.error('Error updating account:', error)`
- Line 247: `console.error('Error deleting account:', error)`
- Line 268: `console.error('Error fetching transactions:', error)`
- Line 287: `console.error('Error fetching all transactions:', error)`
- Line 311: `console.error('Error creating transaction:', error)`
- Line 337: `console.error('Error fetching organizations:', error)`
- Line 357: `console.error('Error fetching all organizations:', error)`
- Line 377: `console.error('Error creating organization:', error)`
- Line 408: `console.error('Error fetching organization members:', membersError)`
- Line 424: `console.error('Error fetching profiles:', profilesError)`
- Line 459: `console.error('Error fetching user profile:', error)`
- Line 480: `console.error('Error updating user profile:', error)`
- Line 500: `console.error('Error fetching onboarding progress:', error)`
- Line 516: `console.error('Error updating onboarding step:', error)`
- Line 528: `console.error('Error dismissing onboarding:', error)`
- Line 540: `console.error('Error resetting onboarding:', error)`
- Line 552: `console.error('Error checking onboarding completion:', error)`
- Line 625: `console.error('Error fetching dolphin assets:', error)`
- Line 661: `console.error('Error syncing dolphin assets:', error)`
- Line 686: `console.error('Error fetching client assets:', error)`

#### HARDCODED_VALUES (HIGH)
Hardcoded localhost/development URLs

- Line 11: `if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {`
- Line 14: `// In development, use localhost`
- Line 15: `return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'`
- Line 15: `return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'`

### src/types/supabase.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 1085: `add_user_to_demo_org: {`
- Line 1104: `seed_demo_data_for_current_user: {`
- Line 1108: `setup_demo_for_user: {`

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


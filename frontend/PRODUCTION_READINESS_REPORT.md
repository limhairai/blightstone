# 🚨 Production Readiness Audit Report

Generated: 2025-06-23T10:47:33.378Z

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 539 |
| Medium | 276 |
| Low | 23 |
| **Total** | **838** |

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

- Line 42: `import { adminAppData } from "../../../lib/mock-data/admin-mock-data";`
- Line 106: `// Growth calculations (mock data)`

### src/app/admin/applications/page.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 60: `console.error('Error fetching applications:', error)`
- Line 228: `console.error('Error refreshing applications:', error)`
- Line 241: `console.error('Error refreshing applications:', error)`
- Line 255: `console.error('Error refreshing applications:', error)`

### src/app/admin/assets/page.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 122: `console.error('Error fetching assets:', error);`
- Line 155: `console.error('Error syncing assets:', error);`

### src/app/admin/businesses/page.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 45: `import { adminAppData, AppBusiness, AppAdAccount } from "../../../lib/mock-data/admin-mock-data";`

### src/app/admin/finances/page.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 67: `import { adminAppData, AppTransaction, AppClient } from "../../../lib/mock-data/admin-mock-data";`

### src/app/admin/infrastructure/page.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 34: `import { APP_PROFILE_TEAMS, APP_TEAM_BUSINESS_MANAGERS, ProfileTeam, TeamBusinessManager } from "../../../lib/mock-data";`

### src/app/admin/organizations/[orgId]/page.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 56: `// Mock organizations data with enhanced properties`
- Line 144: `// Mock businesses data`

### src/app/admin/organizations/page.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 32: `// Mock organizations data`
- Line 63: `// Mock teams data`

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

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 27: `// Mock teams data`

### src/app/admin/transactions/topups/page.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 92: `console.log("Approving request:", id)`
- Line 96: `console.log("Rejecting request:", id)`

### src/app/admin/workflow/page.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 12: `import { adminAppData } from '../../../lib/mock-data/admin-mock-data';`

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

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 16: `// In demo mode, return a mock token`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 3: `import { config, shouldUseAppData, isDemoMode } from '../../../lib/data/config';`
- Line 16: `// In demo mode, return a mock token`
- Line 17: `if (isDemoMode() || shouldUseAppData()) {`
- Line 18: `return 'demo-access-token-123';`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 73: `console.error('Error fetching ad accounts:', error);`
- Line 112: `console.error('Error creating ad account:', error);`

### src/app/api/admin/applications/route.ts

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 15: `// In demo mode, return a mock token`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 3: `import { config, shouldUseAppData, isDemoMode } from '../../../../lib/data/config';`
- Line 15: `// In demo mode, return a mock token`
- Line 16: `if (isDemoMode() || shouldUseAppData()) {`
- Line 17: `return 'demo-access-token-123';`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 64: `console.error('Error fetching admin applications:', error);`
- Line 111: `console.error('Error reviewing application:', error);`

### src/app/api/admin/assets/route.ts

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 6: `// In demo mode, return a mock token`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 2: `import { config, shouldUseAppData, isDemoMode } from '../../../../lib/data/config';`
- Line 6: `// In demo mode, return a mock token`
- Line 7: `if (isDemoMode() || shouldUseAppData()) {`
- Line 8: `return 'demo-access-token-123';`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 75: `console.error('Error fetching admin assets:', error);`
- Line 130: `console.error('Error in admin assets action:', error);`

### src/app/api/applications/route.ts

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 16: `// In demo mode, return a mock token`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 3: `import { config, shouldUseAppData, isDemoMode } from '../../../lib/data/config';`
- Line 16: `// In demo mode, return a mock token`
- Line 17: `if (isDemoMode() || shouldUseAppData()) {`
- Line 18: `return 'demo-access-token-123';`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 71: `console.error('Error fetching applications:', error);`
- Line 110: `console.error('Error submitting application:', error);`

### src/app/api/auth/login/route.ts

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 59: `// ✅ SECURE: Mock authentication (replace with real authentication)`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 62: `// This is demo/development authentication`
- Line 65: `// Demo users for development`
- Line 66: `const demoUsers = [`
- Line 89: `const user = demoUsers.find(u => u.email === email && u.password === password)`
- Line 62: `// This is demo/development authentication`
- Line 64: `if (process.env.NODE_ENV === 'development') {`
- Line 65: `// Demo users for development`
- Line 62: `// This is demo/development authentication`
- Line 64: `if (process.env.NODE_ENV === 'development') {`
- Line 65: `// Demo users for development`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 51: `console.error('Login error:', error)`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 61: `// TODO: Replace with real database authentication`

#### ENV_LEAKS (HIGH)
Environment variables that force development behavior

- Line 64: `if (process.env.NODE_ENV === 'development') {`
- Line 64: `if (process.env.NODE_ENV === 'development') {`

### src/app/api/auth/logout/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 16: `console.error('Logout error:', error)`

### src/app/api/auth/verify/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 28: `console.error('Auth verification error:', error)`

### src/app/api/businesses/route.ts

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 16: `// In demo mode, return a mock token`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 3: `import { config, shouldUseAppData, isDemoMode } from '../../../lib/data/config';`
- Line 16: `// In demo mode, return a mock token`
- Line 17: `if (isDemoMode() || shouldUseAppData()) {`
- Line 18: `return 'demo-access-token-123';`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 65: `console.error('Error fetching businesses:', error);`
- Line 113: `console.error('Error creating business:', error);`

### src/app/api/client/assets/route.ts

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 8: `// In demo mode, return a mock token`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 2: `import { config, shouldUseAppData, isDemoMode } from '../../../../lib/data/config';`
- Line 8: `// In demo mode, return a mock token`
- Line 9: `if (isDemoMode() || shouldUseAppData()) {`
- Line 10: `return 'demo-access-token-123';`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 80: `console.error('Error fetching client assets:', error);`

### src/app/api/organizations/route.ts

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 16: `// In demo mode, return a mock token`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 3: `import { config, shouldUseAppData, isDemoMode } from '../../../lib/data/config';`
- Line 16: `// In demo mode, return a mock token`
- Line 17: `if (isDemoMode() || shouldUseAppData()) {`
- Line 18: `return 'demo-access-token-123';`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 65: `console.error('Error fetching organizations:', error);`
- Line 104: `console.error('Error creating organization:', error);`

### src/app/api/payments/intent/[id]/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 34: `console.error('Error fetching payment intent:', error)`

### src/app/api/payments/success/[id]/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 34: `console.error('Error fetching payment success details:', error)`

### src/app/api/security/csp-report/route.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 30: `console.error('CSP Violation:', {`
- Line 63: `console.error('Error processing CSP report:', error)`

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

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 19: `// Use real-time data from demo state`

### src/app/dashboard/settings/layout.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 13: `import { getInitials } from "../../../lib/mock-data"`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 27: `// Use current organization from demo state`
- Line 48: `{getInitials(currentOrganization?.name || "Demo Org")}`
- Line 52: `<h1 className="text-2xl font-semibold text-foreground">{currentOrganization?.name || "Demo Organization"}</h1>`
- Line 55: `{currentOrganization?.id || "demo-org-1"}`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 67: `.catch((err) => console.error("Failed to copy:", err))`

### src/app/dashboard/transactions/page.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 16: `import { formatCurrency, APP_BUSINESSES } from "../../../lib/mock-data"`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 71: `// Convert demo state transactions to component format and add business information`

### src/app/dashboard/wallet/business/[id]/page.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 11: `import { formatCurrency, APP_BUSINESSES } from "../../../../../lib/mock-data"`
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

- Line 16: `generator: 'v0.dev'`

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

- Line 21: `import { APP_ACCOUNTS, formatCurrency } from "../../lib/mock-data"`
- Line 31: `// Convert centralized mock data to the format expected by this component`
- Line 32: `const mockAccounts = APP_ACCOUNTS.map((account) => ({`
- Line 55: `const filteredAccounts = mockAccounts.filter((account) => {`
- Line 126: `const selectedAccount = selectedAccountId ? mockAccounts.find((account) => account.id === selectedAccountId) : null`

### src/components/accounts/accounts-metrics.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 11: `} from "../../lib/mock-data"`
- Line 14: `// Use centralized mock data`
- Line 17: `const businesses = 3 // Mock business count - could be centralized too`
- Line 18: `const accountLimit = 50 // Mock limit`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 53: `const dpr = window.devicePixelRatio || 1`
- Line 63: `window.addEventListener("resize", setCanvasDimensions)`
- Line 127: `window.addEventListener("resize", drawChart)`

### src/components/accounts/ad-accounts-list.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 7: `import { APP_ACCOUNTS, formatCurrency } from "../../lib/mock-data"`
- Line 10: `// Use centralized mock data and convert to the format expected by this component`

### src/components/accounts/business-accounts-table.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 18: `import { APP_ACCOUNTS } from "../../lib/mock-data"`
- Line 19: `import { formatCurrency } from "../../lib/mock-data"`

### src/components/accounts/create-ad-account-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 98: `console.error('Error submitting application:', error)`

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

### src/components/admin/admin-client-accounts-table.tsx

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 27: `// TODO: Use isSuperuser prop if needed for data fetching or conditional rendering`

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

- Line 26: `// Mock data for demonstration`
- Line 27: `const mockOrganizations = [`
- Line 33: `const filteredOrganizations = mockOrganizations.filter(org =>`
- Line 100: `<div className="text-2xl font-bold">{mockOrganizations.length}</div>`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 22: `const [showDemoPanel, setShowDemoPanel] = useState(false)`
- Line 26: `// Mock data for demonstration`
- Line 61: `onClick={() => setShowDemoPanel(!showDemoPanel)}`
- Line 65: `Demo Data`
- Line 78: `{/* Demo Data Panel */}`
- Line 79: `{showDemoPanel && (`
- Line 82: `<CardTitle className="text-foreground">Demo Data Management</CardTitle>`
- Line 84: `Generate and manage demo data for testing purposes`
- Line 88: `<div className="text-sm text-muted-foreground">Demo data management coming soon...</div>`

### src/components/admin/application-approval-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 58: `console.error("Error approving application:", error);`

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

- Line 58: `console.error("Error marking application ready:", error);`

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

### src/components/admin/create-account-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 104: `console.error("Error creating account:", error);`

### src/components/admin/demo-data-panel.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 84: `{storeType === 'supabase' ? 'Supabase' : 'Mock Store'}`
- Line 93: `<strong>Current Store:</strong> {storeType === 'supabase' ? 'Supabase Database' : 'In-Memory Mock Store'}`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 20: `export function DemoDataPanel() {`
- Line 29: `const handleSeedDemoData = async () => {`
- Line 34: `title: "Demo Data Seeded! 🎉",`
- Line 38: `console.error("Error seeding demo data:", error)`
- Line 41: `description: error instanceof Error ? error.message : "Failed to seed demo data.",`
- Line 82: `<CardTitle>Demo Data Management</CardTitle>`
- Line 102: `{/* Demo Data Actions */}`
- Line 106: `<span className="font-medium">Demo Data Actions</span>`
- Line 111: `onClick={handleSeedDemoData}`
- Line 121: `{seeding ? "Seeding..." : "Seed Demo Data"}`
- Line 140: `{/* What Demo Data Includes */}`
- Line 142: `<div className="font-medium text-sm">Demo data includes:</div>`
- Line 156: `<strong>Environment:</strong> {process.env.NODE_ENV || 'development'}`
- Line 158: `To use Supabase in development, set <code>NEXT_PUBLIC_USE_SUPABASE=true</code> in your .env file.`
- Line 156: `<strong>Environment:</strong> {process.env.NODE_ENV || 'development'}`
- Line 158: `To use Supabase in development, set <code>NEXT_PUBLIC_USE_SUPABASE=true</code> in your .env file.`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 38: `console.error("Error seeding demo data:", error)`
- Line 62: `console.error("Error clearing data:", error)`

#### ENV_LEAKS (HIGH)
Environment variables that force development behavior

- Line 156: `<strong>Environment:</strong> {process.env.NODE_ENV || 'development'}`

### src/components/admin/onboarding-admin-panel.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 81: `console.error('Error loading onboarding data:', error)`
- Line 96: `console.error('Error resetting onboarding:', error)`
- Line 109: `console.error('Error marking step completed:', error)`

### src/components/admin/promote-user.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 277: `<p>⚠️ This is for development purposes only.</p>`
- Line 277: `<p>⚠️ This is for development purposes only.</p>`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 86: `console.log("👤 Create profile response:", { status: response.status, data });`
- Line 135: `// 🚨 SECURITY: Removed dangerous console log - console.log("🚀 Starting promotion process for:", ...;`
- Line 138: `console.log("📡 Trying bootstrap endpoint...");`
- Line 150: `console.log("📡 Bootstrap response:", { status: response.status, data });`
- Line 154: `console.log("📡 Bootstrap failed (admins exist), trying regular promotion...");`
- Line 167: `console.log("📡 Promotion response:", { status: response.status, data });`
- Line 171: `console.log("✅ Promotion successful!");`
- Line 54: `console.error("💥 Error checking user:", error);`
- Line 102: `console.error("💥 Error creating profile:", error);`
- Line 183: `console.error("❌ Promotion failed:", data);`
- Line 191: `console.error("💥 Error promoting user:", error);`
- Line 279: `<p>1. Check if User Exists - Debug if you're in profiles table</p>`

### src/components/admin/quick-actions.tsx

#### TEST_DATA (MEDIUM)
Test email addresses and sample data

- Line 187: `placeholder="user@example.com"`

### src/components/auth/login-view.tsx

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 63: `errorMessage = "Too many login attempts. Please wait a moment and try again.";`

### src/components/auth/register-view.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 105: `console.error("Register handleSubmit: Failed to get user ID after Supabase registration.", signUpResponse.data);`
- Line 133: `console.error("Register handleSubmit: Unexpected error caught:", error);`

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

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 14: `import { getInitials } from "../../lib/mock-data"`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 53: `// Use real-time data from demo state`
- Line 119: `// Use the demo state management to update the business`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 121: `console.log("Business updated:", updatedBusiness)`
- Line 326: `console.log('Edit business:', business.id)`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 82: `return 0 // TODO: Add account count logic when available`
- Line 84: `return 0 // TODO: Add balance logic when available`
- Line 321: `{/* TODO: Update EditBusinessDialog to work with production Business type */}`
- Line 327: `// TODO: Implement edit business functionality`

### src/components/businesses/create-business-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 126: `console.log('Business application submitted:', result)`
- Line 146: `console.error('Failed to create business:', error)`

#### TEST_DATA (MEDIUM)
Test email addresses and sample data

- Line 83: `setUrlError("Please enter a valid website URL (e.g., example.com, www.example.com, or https://example.com)")`
- Line 209: `placeholder="example.com, www.example.com, or https://example.com"`

### src/components/businesses/enhanced-business-card.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 83: `console.log('Manage business:', business.id)`

### src/components/core/simple-providers.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 78: `// // 🚨 SECURITY: Removed dangerous console log - console.log('Simplified Router:', {`
- Line 85: `// 🚨 SECURITY: Removed dangerous console log - console.log('Redirecting to login: not authenticat...;`
- Line 96: `// 🚨 SECURITY: Removed dangerous console log - // 🚨 SECURITY: Removed dangerous console log - console.log('Redirecting to dashboard: authenticat...;`
- Line 144: `// // 🚨 SECURITY: Removed dangerous console log - console.log('Not wrapping with ProductionDataProvi...`
- Line 77: `// Debug logging`

### src/components/dashboard/account-transactions-dialog.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 8: `import { APP_ACCOUNTS } from "../../lib/mock-data"`
- Line 31: `// Generate mock transaction data based on account`

### src/components/dashboard/accounts-metrics.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 1: `import { APP_ACCOUNTS } from "../../lib/mock-data"`

### src/components/dashboard/accounts-table.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 22: `import { APP_BUSINESSES } from "../../lib/mock-data"`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 249: `console.error('Failed to pause account:', error)`
- Line 257: `console.error('Failed to resume account:', error)`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 402: `style={{ gridTemplateColumns: "40px 2.5fr 0.3fr 1.5fr 1fr 1fr 1fr 1fr 1fr 120px" }}`
- Line 431: `style={{ gridTemplateColumns: "40px 2.5fr 0.3fr 1.5fr 1fr 1fr 1fr 1fr 1fr 120px" }}`

### src/components/dashboard/admin-businesses-table.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 14: `import { getInitials, formatCurrency } from "../../lib/mock-data"`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 51: `// Use real-time data from demo state`
- Line 122: `// Use the demo state management to update the business`
- Line 125: `// Note: The EditBusinessDialog should handle calling the updateBusiness function from demo state`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 124: `console.log("Business updated:", updatedBusiness)`
- Line 136: `console.error('Failed to delete business:', error)`
- Line 144: `console.error('Failed to approve business:', error)`

### src/components/dashboard/businesses-metrics.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 1: `import { APP_BUSINESSES } from "../../lib/mock-data"`

### src/components/dashboard/compact-accounts-table.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 17: `import { APP_ACCOUNTS } from "../../lib/mock-data"`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 77: `console.log("New account created")`

### src/components/dashboard/compact-filters.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 5: `import { APP_BUSINESSES, APP_ACCOUNTS } from "../../lib/mock-data"`
- Line 31: `// Get unique businesses and platforms from mock data`

### src/components/dashboard/create-business-dialog.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 115: `// Use demo state management to create business`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 144: `console.error('Failed to create business:', error)`

#### TEST_DATA (MEDIUM)
Test email addresses and sample data

- Line 97: `setUrlError("Please enter a valid website URL (e.g., example.com, www.example.com, or https://example.com)")`
- Line 226: `placeholder="example.com, www.example.com, or https://example.com"`

### src/components/dashboard/dashboard-view.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 26: `} from "../../lib/mock-data"`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 62: `// Refresh app data (demo state is reactive and doesn't need manual refresh)`
- Line 241: `// Setup progress tracking - always show as if we have data for demo`
- Line 245: `realBalance > 0, // Has wallet balance (always true for demo)`
- Line 246: `true, // Has businesses (always true for demo)`
- Line 247: `accounts.length > 0 // Has ad accounts (always true for demo)`
- Line 295: `// For demo purposes, we'll just show a success message`
- Line 330: `// Always show filled dashboard for demo - no empty state`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 312: `console.log('Creating organization:', orgName)`
- Line 67: `console.warn('Dashboard auto-refresh failed:', error)`
- Line 314: `console.error('Failed to create organization:', error)`

### src/components/dashboard/edit-business-dialog.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 24: `import { getInitials } from "../../lib/mock-data"`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 115: `// Use demo state management to update business`

#### TEST_DATA (MEDIUM)
Test email addresses and sample data

- Line 295: `const newDomain = prompt("Enter domain name (e.g., example.com):")`

### src/components/dashboard/top-up-dialog.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 29: `// Use real-time wallet balance from demo state`

### src/components/dashboard/topbar.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 9: `import { APP_FINANCIAL_DATA } from "../../lib/mock-data"`

#### TEST_DATA (MEDIUM)
Test email addresses and sample data

- Line 87: `<div className="text-sm text-muted-foreground">john@example.com</div>`

### src/components/dashboard/withdraw-balance-dialog.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 11: `import { APP_FINANCIAL_DATA } from "../../lib/mock-data"`

### src/components/debug/auth-debug.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 34: `if (process.env.NODE_ENV !== 'development') {`
- Line 34: `if (process.env.NODE_ENV !== 'development') {`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 7: `export function AuthDebug() {`
- Line 40: `<h3 className="font-bold mb-2">Auth Debug</h3>`

#### ENV_LEAKS (HIGH)
Environment variables that force development behavior

- Line 34: `if (process.env.NODE_ENV !== 'development') {`

### src/components/debug/dashboard-debug.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 5: `import { isDemoMode } from "../../lib/data/config"`
- Line 46: `<strong>Demo Mode:</strong> {isDemoMode() ? "✓" : "✗"}`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 7: `export function DashboardDebug() {`
- Line 14: `<h3 className="font-bold mb-2">Debug Info</h3>`

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

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 21: `import { formatCurrency } from "../../lib/mock-data"`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 69: `// Use real user data from demo state`
- Line 73: `const userName = userProfile?.name || 'Demo Admin'`

### src/components/onboarding/welcome-onboarding-modal.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 103: `console.error('Error creating business:', error)`
- Line 127: `console.error('Error completing onboarding:', error)`
- Line 137: `console.error('Error skipping onboarding:', error)`

### src/components/organization/organization-selector.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 18: `import { getInitials } from "../../lib/mock-data"`
- Line 22: `import { APP_BUSINESSES_BY_ORG } from "../../lib/mock-data"`
- Line 23: `import { APP_ACCOUNTS_BY_ORG } from "../../lib/mock-data"`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 49: `// Use real organization data from demo state`
- Line 66: `// Convert all organizations from demo state`
- Line 77: `// Convert demo state businesses to the format expected by the component`

### src/components/organization/organization-switcher.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 53: `console.error('Failed to create organization:', error)`

### src/components/settings/account-settings.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 638: `onClick={() => toast.error("Account deletion is not available in demo mode.")}`

### src/components/settings/organization-settings.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 20: `import { pricingPlans } from "../../lib/mock-data"`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 39: `// Get actual counts from demo state`
- Line 93: `toast.error("Organization deletion is not available in demo mode.")`

### src/components/settings/settings-view.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 35: `import { APP_ORGANIZATION } from "../../lib/mock-data"`

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

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 50: `// Use real-time team members from demo state`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 79: `name: inviteEmail.split('@')[0], // Use email prefix as temporary name`
- Line 79: `name: inviteEmail.split('@')[0], // Use email prefix as temporary name`

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

### src/components/wallet/account-top-up-dialog.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 16: `import { formatCurrency, APP_CONSTANTS } from "../../lib/mock-data"`

### src/components/wallet/advanced-transaction-manager.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 32: `import { formatCurrency, transactionColors } from "../../lib/mock-data"`

### src/components/wallet/balance-card.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 4: `import { formatCurrency } from '../../lib/mock-data'`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 17: `const actualGrowth = growth ?? 0 // TODO: Calculate from transaction history`

### src/components/wallet/business-balances-table.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 6: `import { formatCurrency, getInitials } from "../../lib/mock-data"`

### src/components/wallet/consolidate-funds-dialog.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 8: `import { formatCurrency } from "../../lib/mock-data"`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 99: `console.error('Consolidation failed:', error)`

### src/components/wallet/distribute-funds-dialog.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 9: `import { formatCurrency } from "../../lib/mock-data"`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 146: `console.error('Distribution failed:', error)`

### src/components/wallet/fund-wallet-dialog.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 47: `console.log(`Adding $${amount} via ${paymentMethod}`)`
- Line 50: `console.log(`Withdrawing $${amount}`)`
- Line 60: `console.log('Opening consolidate dialog')`
- Line 66: `console.log('Opening distribute dialog')`

### src/components/wallet/recent-transactions.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 6: `import { formatCurrency, transactionColors } from "../../lib/mock-data"`
- Line 23: `// Mock data`

### src/components/wallet/top-up-dialog.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 11: `import { formatCurrency } from "../../lib/mock-data"`
- Line 25: `// Mock data for customer tiers and their commission rates`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 36: `// Use real-time wallet balance from demo state`

### src/components/wallet/top-up-wallet.tsx

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 53: `console.log(`Attempting top-up of ${numAmount} via ${paymentMethod} for orgId: ${orgId}`)`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 53: `console.log(`Attempting top-up of ${numAmount} via ${paymentMethod} for orgId: ${orgId}`)`

### src/components/wallet/transaction-card.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 6: `import { formatCurrency, transactionColors } from "../../lib/mock-data"`
- Line 19: `// Mock data`

### src/components/wallet/wallet-dashboard.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 23: `// Mock current organization`

### src/components/wallet/wallet-funding-panel.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 13: `import { formatCurrency } from "../../lib/mock-data"`

### src/components/wallet/wallet-portfolio-card.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 6: `import { formatCurrency, APP_BALANCE_DATA } from "../../lib/mock-data"`

### src/components/wallet/withdraw-funds.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 26: `// Mock data`

### src/contexts/AppDataContext.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 17: `MOCK_TEAM_MEMBERS_BY_ORG`
- Line 18: `} from '../lib/mock-data'`
- Line 455: `const orgTeamMembers = MOCK_TEAM_MEMBERS_BY_ORG[action.payload] || []`
- Line 615: `// Helper functions to convert mock data to app data`
- Line 616: `function convertAppBusinessesToAppBusinesses(mockBusinesses: any[]): AppBusiness[] {`
- Line 617: `return mockBusinesses.map(b => ({`
- Line 645: `function convertAppAccountsToAppAccounts(mockAccounts: any[]): AppAccount[] {`
- Line 646: `return mockAccounts.map(a => ({`
- Line 668: `function convertAppTransactionsToAppTransactions(mockTransactions: any[]): AppTransaction[] {`
- Line 669: `return mockTransactions.map(t => ({`
- Line 690: `function convertFinancialData(mockFinancialData: any): AppState['financialData'] {`
- Line 692: `totalBalance: mockFinancialData.walletBalance || 0,`
- Line 693: `totalRevenue: mockFinancialData.monthlyAdSpend * 12 || 0, // Estimate annual revenue`
- Line 694: `totalSpend: mockFinancialData.monthlyAdSpend || 0,`
- Line 695: `monthlyRevenue: mockFinancialData.monthlyAdSpend || 0,`
- Line 696: `monthlySpend: mockFinancialData.monthlyAdSpend || 0,`
- Line 697: `growthRate: mockFinancialData.monthlyGrowth || 0`
- Line 701: `function convertAppOrganizationsToAppOrganizations(mockOrgs: any[]): AppOrganization[] {`
- Line 702: `return mockOrgs.map(o => ({`
- Line 733: `dispatch({ type: 'SET_TEAM_MEMBERS', payload: MOCK_TEAM_MEMBERS_BY_ORG[orgId] || [] })`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 6: `import { USE_DEMO_DATA } from '../lib/env-config'`
- Line 29: `// Unified interfaces that work with both demo and production data`
- Line 37: `// Extended properties (rich data from demo mode)`
- Line 64: `// Extended properties (rich data from demo mode)`
- Line 86: `// Extended properties (rich data from demo mode)`
- Line 149: `dataSource: 'demo' | 'supabase'`
- Line 212: `| { type: 'SET_DATA_SOURCE'; payload: 'demo' | 'supabase' }`
- Line 724: `if (state.dataSource === 'demo') {`
- Line 725: `// Load demo data`
- Line 736: `// Set demo user profile`
- Line 738: `id: 'demo-user-123',`
- Line 739: `name: 'Demo Admin',`
- Line 746: `// Set demo setup progress`
- Line 755: `// Simulate API call for demo mode`
- Line 858: `// Fallback to demo data on error`
- Line 859: `dispatch({ type: 'SET_DATA_SOURCE', payload: 'demo' })`
- Line 884: `// Simulate API call for demo mode`
- Line 6: `import { USE_DEMO_DATA } from '../lib/env-config'`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 766: `console.log('No authenticated user for Supabase data loading')`
- Line 855: `console.error('Error loading Supabase data:', error)`
- Line 890: `console.error('Error creating business:', error)`

### src/contexts/AuthContext.tsx

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 48: `// In demo mode, provide mock user and session`
- Line 50: `const mockUser: SupabaseUser = {`
- Line 64: `const mockSession: Session = {`
- Line 70: `user: mockUser`
- Line 73: `setUser(mockUser);`
- Line 74: `setSession(mockSession);`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 21: `import { config, shouldUseAppData, isDemoMode } from '../lib/data/config';`
- Line 48: `// In demo mode, provide mock user and session`
- Line 49: `if (isDemoMode() || shouldUseAppData()) {`
- Line 51: `id: 'demo-user-123',`
- Line 55: `app_metadata: { provider: 'demo' },`
- Line 57: `name: 'Demo Admin',`
- Line 65: `access_token: 'demo-access-token-123',`
- Line 66: `refresh_token: 'demo-refresh-token-123',`
- Line 120: `// In demo mode, just clear local state`
- Line 121: `if (isDemoMode() || shouldUseAppData()) {`
- Line 156: `events.forEach((event) => window.addEventListener(event, resetTimer));`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 84: `console.error("Error fetching initial session:", error);`
- Line 131: `console.error("Error signing out:", error);`
- Line 178: `console.error("Error signing up:", error);`
- Line 214: `console.error("❌ Error signing in:", error, {`
- Line 252: `console.error("Error sending password reset email:", error);`
- Line 287: `console.error("Error initiating Google sign-in:", error);`
- Line 307: `console.error("Error resending verification email:", error);`

### src/hooks/use-mobile.tsx

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 13: `mql.addEventListener("change", onChange)`

### src/hooks/useAdminRoute.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 9: `// Simple admin check - in demo mode, always allow admin access`
- Line 11: `const canViewAdmin = state.dataSource === 'demo' || state.userProfile?.email === 'admin@adhub.tech';`

### src/hooks/useAdvancedOnboarding.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 56: `// For demo mode, use simulated persistence data`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 87: `console.error('Error loading onboarding data:', error)`
- Line 141: `console.error('Error dismissing onboarding:', error)`
- Line 175: `console.error('Error marking step completed:', error)`
- Line 202: `console.error('Error resetting onboarding:', error)`

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

### src/hooks/usePermissions.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 8: `// Simple permission logic for demo mode`
- Line 9: `const isAppAdmin = state.dataSource === 'demo' || user?.email === 'admin@adhub.tech';`
- Line 10: `const isOrgOwner = true; // In demo mode, user is always owner`
- Line 11: `const isOrgAdmin = true; // In demo mode, user is always admin`
- Line 12: `const canManageTeam = true; // In demo mode, user can manage team`

### src/hooks/useServerPagination.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 126: `console.error('Failed to load more data:', error);`

### src/lib/api-config.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 114: `export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'`
- Line 114: `export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'`

#### ENV_LEAKS (HIGH)
Environment variables that force development behavior

- Line 114: `export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'`
- Line 114: `export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'`

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

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 6: `useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',`
- Line 17: `export const shouldUseAppData = () => config.useMockData || isDevelopment();`
- Line 23: `return null; // No API calls in mock mode`
- Line 32: `useMockData: config.useMockData,`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 7: `demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',`
- Line 18: `export const isDemoMode = () => config.demoMode;`
- Line 33: `demoMode: config.demoMode,`
- Line 5: `environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',`
- Line 16: `export const isDevelopment = () => config.environment === 'development';`
- Line 17: `export const shouldUseAppData = () => config.useMockData || isDevelopment();`
- Line 28: `// Debug logging (only in development)`
- Line 29: `if (isDevelopment()) {`
- Line 5: `environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',`
- Line 16: `export const isDevelopment = () => config.environment === 'development';`
- Line 17: `export const shouldUseAppData = () => config.useMockData || isDevelopment();`
- Line 28: `// Debug logging (only in development)`
- Line 29: `if (isDevelopment()) {`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 30: `console.log('🔧 AdHub Config:', {`
- Line 28: `// Debug logging (only in development)`

#### ENV_LEAKS (HIGH)
Environment variables that force development behavior

- Line 6: `useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',`
- Line 7: `demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',`

### src/lib/data/mock-data.ts

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 2: `// 🚀 CONSOLIDATED MOCK DATA - Single Source of Truth`
- Line 5: `// Re-export everything from the original mock-data.ts for backward compatibility`
- Line 6: `export * from '../mock-data';`
- Line 8: `// Re-export admin mock data with explicit naming to avoid conflicts`
- Line 17: `} from '../mock-data/admin-mock-data';`
- Line 23: `import { AdminAppDataGenerator } from '../mock-data/admin-mock-data';`
- Line 25: `// Utility to access all mock data in one place`
- Line 26: `export const getAllMockData = () => ({`

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

### src/lib/mock-business-store.ts

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 1: `// Mock data store for businesses and ad accounts`
- Line 59: `// Initial mock data`
- Line 60: `let mockBusinesses: AppBusiness[] = [`
- Line 361: `return [...mockBusinesses]`
- Line 366: `return mockBusinesses.find(b => b.id === id)`
- Line 398: `mockBusinesses.push(newBusiness)`
- Line 402: `const business = mockBusinesses.find(b => b.id === newBusiness.id)`
- Line 424: `const business = mockBusinesses.find(b => b.id === data.businessId)`
- Line 470: `return mockBusinesses.filter(b => b.status === "active" && b.verification === "verified")`
- Line 475: `const business = mockBusinesses.find(b => b.id === businessId)`
- Line 481: `const business = mockBusinesses.find(b => b.id === businessId)`
- Line 492: `for (const business of mockBusinesses) {`
- Line 504: `for (const business of mockBusinesses) {`
- Line 516: `mockBusinesses = [`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 173: `// Additional pending applications for admin review demo`
- Line 400: `// Simulate admin review process - auto-approve after 3 seconds for demo`
- Line 450: `// Simulate approval process - auto-approve after 2 seconds for demo`
- Line 268: `description: "Cloud infrastructure and DevOps automation solutions",`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 406: `console.log(`Business "${business.name}" has been approved!`)`
- Line 456: `console.log(`Ad Account "${account.name}" has been activated!`)`

#### TEST_DATA (MEDIUM)
Test email addresses and sample data

- Line 66: `landingPage: "https://store.example.com",`
- Line 67: `website: "https://store.example.com",`
- Line 121: `landingPage: "https://blog.example.com",`
- Line 122: `website: "https://blog.example.com",`
- Line 136: `landingPage: "https://affiliate.example.com",`
- Line 137: `website: "https://affiliate.example.com",`
- Line 522: `landingPage: "https://store.example.com",`
- Line 523: `website: "https://store.example.com",`

### src/lib/mock-data/admin-mock-data.ts

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 1: `// Centralized mock data for admin panel - consistent across all pages`
- Line 123: `// Generate consistent mock data`

#### TEST_DATA (MEDIUM)
Test email addresses and sample data

- Line 170: `email: `client${clientLetter.toLowerCase()}${clientNumber}@example.com`,`

### src/lib/mock-data.ts

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 419: `// Mock pricing plans data`
- Line 520: `// Mock news data`
- Line 557: `// Mock transactions data`
- Line 677: `// Mock accounts data`
- Line 870: `// Business type and mock businesses`
- Line 885: `// Centralized mock data for consistent values across the application`
- Line 1061: `// Mock businesses data - organized by organization`
- Line 1062: `// ✅ PRODUCTION GUARD: Prevent mock data in production`
- Line 1064: `throw new Error('🚨 CRITICAL: Mock data cannot be imported in production!')`
- Line 1164: `// ✅ PRODUCTION GUARD: Prevent mock data in production`
- Line 1166: `throw new Error('🚨 CRITICAL: Mock data cannot be imported in production!')`
- Line 1251: `// Mock accounts data - updated to match businesses`
- Line 1418: `// Mock transactions data (most recent first)`
- Line 1602: `// Mock chart data for balance over time`
- Line 1612: `// Mock chart data for spending over time`
- Line 1717: `console.warn('Mock data validation errors:', validation.errors)`
- Line 1719: `console.log('✅ Mock data validation passed')`
- Line 1727: `export const MOCK_TEAM_MEMBERS_BY_ORG: Record<string, any[]> = {`
- Line 1942: `// Generate mock profile teams`
- Line 2008: `// Generate mock business managers with team assignments`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 102: `// Centralized organization data - multiple organizations for demo`
- Line 1081: `description: "Leading software development and consulting company",`
- Line 1713: `// Run validation in development`
- Line 1714: `if (process.env.NODE_ENV === 'development') {`
- Line 1081: `description: "Leading software development and consulting company",`
- Line 1713: `// Run validation in development`
- Line 1714: `if (process.env.NODE_ENV === 'development') {`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 1719: `console.log('✅ Mock data validation passed')`
- Line 1717: `console.warn('Mock data validation errors:', validation.errors)`

#### TEST_DATA (MEDIUM)
Test email addresses and sample data

- Line 245: `email: "personal@example.com",`
- Line 290: `email: "personal@example.com",`
- Line 1183: `website: "https://personal.example.com",`
- Line 1187: `domains: [{ domain: "personal.example.com", verified: true }],`
- Line 1808: `email: "personal@example.com",`

#### ENV_LEAKS (HIGH)
Environment variables that force development behavior

- Line 1714: `if (process.env.NODE_ENV === 'development') {`
- Line 1714: `if (process.env.NODE_ENV === 'development') {`

### src/lib/production-guard.ts

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 10: `'NEXT_PUBLIC_USE_MOCK_DATA',`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 3: `* CRITICAL: Prevents demo data and development code from running in production`
- Line 11: `'NEXT_PUBLIC_DEMO_MODE',`
- Line 12: `'NEXT_PUBLIC_USE_DEMO_DATA'`
- Line 43: `// ✅ SECURE: Demo data prevention`
- Line 44: `export function preventDemoDataInProduction(): void {`
- Line 45: `if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true') {`
- Line 46: `const error = '🚨 CRITICAL: Demo data cannot be used in production!'`
- Line 69: `export function getValidatedDataSource(): 'demo' | 'supabase' {`
- Line 72: `preventDemoDataInProduction()`
- Line 78: `if (process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true') {`
- Line 79: `console.log('🔧 Development: Using demo data')`
- Line 80: `return 'demo'`
- Line 90: `// Fallback to demo data in development`
- Line 91: `console.log('🔧 Development: Falling back to demo data (Supabase not configured)')`
- Line 92: `return 'demo'`
- Line 107: `// In production, crash the app rather than show demo data`
- Line 121: `// Prevent demo data leaks`
- Line 122: `assertNotDemo(): void {`
- Line 123: `if (this.dataSource === 'demo' && this.isProduction) {`
- Line 124: `throw new Error('🚨 CRITICAL: Demo data detected in production!')`
- Line 3: `* CRITICAL: Prevents demo data and development code from running in production`
- Line 77: `// In development, check the flag`
- Line 79: `console.log('🔧 Development: Using demo data')`
- Line 86: `console.log('🔧 Development: Using Supabase data')`
- Line 90: `// Fallback to demo data in development`
- Line 91: `console.log('🔧 Development: Falling back to demo data (Supabase not configured)')`
- Line 117: `isDevelopment: process.env.NODE_ENV === 'development',`
- Line 3: `* CRITICAL: Prevents demo data and development code from running in production`
- Line 77: `// In development, check the flag`
- Line 79: `console.log('🔧 Development: Using demo data')`
- Line 86: `console.log('🔧 Development: Using Supabase data')`
- Line 90: `// Fallback to demo data in development`
- Line 91: `console.log('🔧 Development: Falling back to demo data (Supabase not configured)')`
- Line 117: `isDevelopment: process.env.NODE_ENV === 'development',`
- Line 12: `'NEXT_PUBLIC_USE_DEMO_DATA'`
- Line 45: `if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true') {`
- Line 78: `if (process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true') {`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 39: `console.log('✅ Production environment validation passed')`
- Line 79: `console.log('🔧 Development: Using demo data')`
- Line 86: `console.log('🔧 Development: Using Supabase data')`
- Line 91: `console.log('🔧 Development: Falling back to demo data (Supabase not configured)')`
- Line 102: `console.log(`🔒 Production Guard: Environment=${process.env.NODE_ENV}, DataSource=${dataSource}`)`
- Line 18: `console.error(error)`
- Line 34: `console.error(error)`
- Line 47: `console.error(error)`
- Line 60: `console.error(error)`
- Line 105: `console.error('🚨 Production Guard failed:', error)`

#### ENV_LEAKS (HIGH)
Environment variables that force development behavior

- Line 117: `isDevelopment: process.env.NODE_ENV === 'development',`
- Line 117: `isDevelopment: process.env.NODE_ENV === 'development',`

### src/lib/secure-env.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 34: `USE_DEMO_DATA: ENV_CONFIG.USE_DEMO_DATA,`
- Line 90: `useDemoData: SECURE_CONFIG.USE_DEMO_DATA,`
- Line 14: `IS_DEVELOPMENT: ENV_CONFIG.IS_DEVELOPMENT,`
- Line 15: `NODE_ENV: process.env.NODE_ENV || 'development',`
- Line 84: `isDevelopment: RUNTIME_ENV.IS_DEVELOPMENT,`
- Line 95: `// 🎯 Development logging`
- Line 96: `if (RUNTIME_ENV.IS_DEVELOPMENT) {`
- Line 14: `IS_DEVELOPMENT: ENV_CONFIG.IS_DEVELOPMENT,`
- Line 15: `NODE_ENV: process.env.NODE_ENV || 'development',`
- Line 84: `isDevelopment: RUNTIME_ENV.IS_DEVELOPMENT,`
- Line 95: `// 🎯 Development logging`
- Line 96: `if (RUNTIME_ENV.IS_DEVELOPMENT) {`
- Line 34: `USE_DEMO_DATA: ENV_CONFIG.USE_DEMO_DATA,`
- Line 90: `useDemoData: SECURE_CONFIG.USE_DEMO_DATA,`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 99: `console.log('🔒 Secure Environment Configuration:', getClientSafeEnvInfo())`
- Line 102: `console.warn('⚠️ Environment validation warnings:', validation.errors)`
- Line 35: `ENABLE_DEBUG: ENV_CONFIG.ENABLE_DEBUG,`
- Line 91: `enableDebug: SECURE_CONFIG.ENABLE_DEBUG,`

#### HARDCODED_VALUES (HIGH)
Hardcoded localhost/development URLs

- Line 23: `// URLs (no hardcoded localhost)`

#### ENV_LEAKS (HIGH)
Environment variables that force development behavior

- Line 15: `NODE_ENV: process.env.NODE_ENV || 'development',`

### src/lib/security/csp.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 28: `"'unsafe-inline'", // Required for Next.js development - remove in production with nonces`
- Line 59: `process.env.NODE_ENV === "development" ? "ws://localhost:*" : "",`
- Line 60: `process.env.NODE_ENV === "development" ? "http://localhost:*" : "",`
- Line 76: `* Development CSP Configuration - More permissive for development`
- Line 78: `export const DEVELOPMENT_CSP: CSPConfig = {`
- Line 83: `"'unsafe-eval'", // Required for development`
- Line 129: `return "production" === 'production' ? PRODUCTION_CSP : DEVELOPMENT_CSP`
- Line 195: `// Prevent search engines from indexing in development`
- Line 196: `...((process.env.NODE_ENV === "development") && {`
- Line 28: `"'unsafe-inline'", // Required for Next.js development - remove in production with nonces`
- Line 59: `process.env.NODE_ENV === "development" ? "ws://localhost:*" : "",`
- Line 60: `process.env.NODE_ENV === "development" ? "http://localhost:*" : "",`
- Line 76: `* Development CSP Configuration - More permissive for development`
- Line 78: `export const DEVELOPMENT_CSP: CSPConfig = {`
- Line 83: `"'unsafe-eval'", // Required for development`
- Line 129: `return "production" === 'production' ? PRODUCTION_CSP : DEVELOPMENT_CSP`
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
- Line 196: `...((process.env.NODE_ENV === "development") && {`
- Line 59: `process.env.NODE_ENV === "development" ? "ws://localhost:*" : "",`
- Line 60: `process.env.NODE_ENV === "development" ? "http://localhost:*" : "",`
- Line 196: `...((process.env.NODE_ENV === "development") && {`

### src/lib/security/rate-limiter.ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 186: `console.error('Rate limiting error:', error)`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 88: `maxRequests: 5,            // 5 attempts per 15 minutes`

### src/lib/server-auth.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 199: `if (process.env.NODE_ENV === 'development') {`
- Line 199: `if (process.env.NODE_ENV === 'development') {`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 200: `console.log('🔒 JWT Authentication System loaded - PRODUCTION READY');`
- Line 70: `console.error('JWT verification failed:', error)`
- Line 87: `console.error('Failed to get user from request:', error)`
- Line 103: `console.error('Admin role verification failed:', error)`
- Line 125: `console.error('Failed to get user role:', error)`
- Line 141: `console.error('Permission verification failed:', error)`

#### ENV_LEAKS (HIGH)
Environment variables that force development behavior

- Line 199: `if (process.env.NODE_ENV === 'development') {`
- Line 199: `if (process.env.NODE_ENV === 'development') {`

### src/lib/stores/supabase-client.ts

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 15: `// Create a mock client for development when env vars are not set`
- Line 17: `console.warn('🚨 Using Supabase MOCK client - authentication will not work!')`

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 23: `error: { message: 'Supabase not configured - using demo mode', name: 'AuthError', status: 400 }`
- Line 27: `error: { message: 'Supabase not configured - using demo mode', name: 'AuthError', status: 400 }`
- Line 32: `error: { message: 'Supabase not configured - using demo mode', name: 'AuthError', status: 400 }`
- Line 36: `error: { message: 'Supabase not configured - using demo mode', name: 'AuthError', status: 400 }`
- Line 39: `error: { message: 'Supabase not configured - using demo mode', name: 'AuthError', status: 400 }`
- Line 15: `// Create a mock client for development when env vars are not set`
- Line 15: `// Create a mock client for development when env vars are not set`

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 8: `console.log('Supabase Environment Check:', {`
- Line 59: `console.log('Supabase client created:', supabase ? 'Success' : 'Failed')`
- Line 17: `console.warn('🚨 Using Supabase MOCK client - authentication will not work!')`
- Line 7: `// Debug logging for production`

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

- Line 43: `console.log(`🔒 Security middleware: ${request.method} ${pathname}`)`
- Line 82: `console.error('JWT verification failed:', error)`

### src/pages/api/proxy/[...path].ts

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 33: `console.error('[PROXY ERROR] Proxying error:', err);`

#### TODO_FIXME (LOW)
Development comments that need attention

- Line 47: `// http-proxy might have already handled or attempted to handle it.`

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

#### DEBUG_CODE (MEDIUM)
Debug code that should be removed for production

- Line 18: `console.error('Error fetching businesses:', error)`
- Line 36: `console.error('Error fetching all businesses:', error)`
- Line 59: `console.error('Error creating business:', error)`
- Line 82: `console.error('Error updating business:', error)`
- Line 97: `console.error('Error deleting business:', error)`
- Line 117: `console.error('Error fetching accounts:', error)`
- Line 136: `console.error('Error fetching organization accounts:', error)`
- Line 155: `console.error('Error fetching all accounts:', error)`
- Line 182: `console.error('Error creating account:', error)`
- Line 205: `console.error('Error updating account:', error)`
- Line 220: `console.error('Error deleting account:', error)`
- Line 241: `console.error('Error fetching transactions:', error)`
- Line 260: `console.error('Error fetching all transactions:', error)`
- Line 284: `console.error('Error creating transaction:', error)`
- Line 309: `console.error('Error fetching organizations:', error)`
- Line 328: `console.error('Error fetching all organizations:', error)`
- Line 348: `console.error('Error creating organization:', error)`
- Line 381: `console.error('Error fetching team members:', error)`
- Line 407: `console.error('Error fetching user profile:', error)`
- Line 428: `console.error('Error updating user profile:', error)`
- Line 448: `console.error('Error fetching onboarding progress:', error)`
- Line 464: `console.error('Error updating onboarding step:', error)`
- Line 476: `console.error('Error dismissing onboarding:', error)`
- Line 488: `console.error('Error resetting onboarding:', error)`
- Line 500: `console.error('Error checking onboarding completion:', error)`

### src/types/supabase.ts

#### DEMO_MODE (HIGH)
Demo mode code that should not run in production

- Line 1103: `add_user_to_demo_org: {`
- Line 1122: `seed_demo_data_for_current_user: {`
- Line 1126: `setup_demo_for_user: {`

### src/utils/format.ts

#### MOCK_DATA (HIGH)
Mock data references that could leak into production

- Line 1: `import { APP_ACCOUNTS } from "../lib/mock-data"`

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


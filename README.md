# Blightstone CRM

An internal CRM tool built with Next.js, FastAPI, and Supabase.

## 🚀 Quick Setup

Run the setup script to configure environment variables:
```bash
chmod +x setup-environment.sh && ./setup-environment.sh
```

For detailed setup instructions, see [BLIGHTSTONE_CRM_SETUP.md](./BLIGHTSTONE_CRM_SETUP.md)

## 🔗 Links
- **GitHub Repository**: [https://github.com/demetrius900/blightstone](https://github.com/demetrius900/blightstone)
- **Supabase Dashboard**: [https://supabase.com/dashboard/project/vddtsunsahhccmtamdcg](https://supabase.com/dashboard/project/vddtsunsahhccmtamdcg)

## Testing

### E2E Testing (Playwright)
E2E tests are set up but currently disabled for production launch. To enable:

1. Update environment variables in `.env.test`
2. Add `data-testid` attributes to components for reliable selectors
3. Run: `npx playwright test`

**Current Status**: Authentication setup works, logout flow needs component selector refinement.

**Files**:
- `playwright.config.ts` - Configuration
- `tests/auth.setup.ts` - User registration and login
- `tests/user-authentication.spec.ts` - Auth flow tests
- `tests/application-workflow.spec.ts` - Business application tests
- `tests/admin-panel.admin.spec.ts` - Admin functionality tests
- `tests/payment-flow.spec.ts` - Payment and subscription tests

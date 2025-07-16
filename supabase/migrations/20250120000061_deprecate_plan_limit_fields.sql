-- Deprecate plan limit fields in plans table
-- These fields are no longer used for limit checking as we now use pricing-config.ts
-- We keep the table for Stripe integration but mark limit fields as deprecated

-- Add comments to indicate deprecated fields
COMMENT ON COLUMN public.plans.max_team_members IS 'DEPRECATED: Use pricing-config.ts for plan limits';
COMMENT ON COLUMN public.plans.max_businesses IS 'DEPRECATED: Use pricing-config.ts for plan limits';
COMMENT ON COLUMN public.plans.max_ad_accounts IS 'DEPRECATED: Use pricing-config.ts for plan limits';
COMMENT ON COLUMN public.plans.max_pixels IS 'DEPRECATED: Use pricing-config.ts for plan limits';
COMMENT ON COLUMN public.plans.max_promotion_urls IS 'DEPRECATED: Use pricing-config.ts for plan limits';

-- Add a note about the new architecture
COMMENT ON TABLE public.plans IS 'Plan definitions for Stripe integration. Plan limits are now enforced via pricing-config.ts in the application layer, not database fields.';

-- The table is still needed for:
-- 1. Stripe price IDs for checkout
-- 2. Plan metadata (name, description, features)
-- 3. Subscription status tracking
-- 4. Billing history 
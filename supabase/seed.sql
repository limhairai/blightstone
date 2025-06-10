-- Seed data for the plans table
-- Note: Ensure these IDs match what you might use in your application logic or frontend.

INSERT INTO public.plans (id, name, monthly_subscription_fee_cents, ad_spend_fee_percentage, ad_account_pool_limit, unlimited_replacements, stripe_price_id, is_active)
VALUES
    ('bronze', 'Bronze', 0, 0.0600, 1, true, 'your_stripe_price_id_for_bronze_if_any', true),
    ('silver', 'Silver', 29900, 0.0400, 3, true, 'your_stripe_price_id_for_silver_subscription', true),
    ('gold', 'Gold', 79900, 0.0300, 5, true, 'your_stripe_price_id_for_gold_subscription', true),
    ('platinum', 'Platinum', 249900, 0.0200, 10, true, 'your_stripe_price_id_for_platinum_subscription', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    monthly_subscription_fee_cents = EXCLUDED.monthly_subscription_fee_cents,
    ad_spend_fee_percentage = EXCLUDED.ad_spend_fee_percentage,
    ad_account_pool_limit = EXCLUDED.ad_account_pool_limit,
    unlimited_replacements = EXCLUDED.unlimited_replacements,
    stripe_price_id = EXCLUDED.stripe_price_id,
    is_active = EXCLUDED.is_active,
    updated_at = timezone('utc'::text, now());

-- Seed data for an initial organization's plan (example)
-- This is just illustrative. In a real app, organizations would get their plan_id set
-- when they are created or when they subscribe.
-- Ensure you have a user and an organization if you want to test this part.

-- Example: To link a specific organization (if you know its ID) to a plan:
-- UPDATE public.organizations SET plan_id = 'gold' WHERE id = 'your_known_organization_id';

-- Example: If you have a default user and want to create a default organization for them on a plan:
-- WITH new_org AS (
--   INSERT INTO public.organizations (name, owner_id, plan_id)
--   VALUES ('Test Org Default Plan', (SELECT id FROM auth.users LIMIT 1), 'silver')
--   RETURNING id, owner_id, plan_id
-- )
-- INSERT INTO public.organization_members (organization_id, user_id, role)
-- SELECT id, owner_id, 'owner' FROM new_org;

-- Note on Stripe Price IDs:
-- Replace 'your_stripe_price_id_for_...' with the actual Price IDs from your Stripe account 
-- for each corresponding subscription plan. For the Bronze (free) plan, if there's no direct 
-- Stripe subscription, you might leave stripe_price_id as NULL or use a placeholder. 
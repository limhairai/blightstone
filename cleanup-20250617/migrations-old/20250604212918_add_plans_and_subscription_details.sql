-- Create plans table
CREATE TABLE public.plans (
    id text NOT NULL PRIMARY KEY, -- e.g., 'bronze', 'silver', 'gold', 'platinum'
    name text NOT NULL, -- e.g., "Bronze Tier", "Silver Tier"
    monthly_subscription_fee_cents bigint NOT NULL DEFAULT 0,
    ad_spend_fee_percentage decimal(5, 4) NOT NULL DEFAULT 0.0000, -- Store as decimal, e.g., 0.0600 for 6%
    ad_account_pool_limit integer NOT NULL DEFAULT 1,
    unlimited_replacements boolean DEFAULT true NOT NULL,
    stripe_price_id text, -- To link to a specific Price object in Stripe
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Apply the updated_at trigger (assuming trigger_set_timestamp() exists from initial_schema.sql)
CREATE TRIGGER set_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Enable Row Level Security for plans (generally public or readable by authenticated users)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are viewable by all authenticated users"
    ON public.plans FOR SELECT
    TO authenticated
    USING (true);
-- Add admin policies if you need to manage plans via API for admins later.

-- Alter organizations table to add Stripe IDs and link plan_id to the new plans table
-- First, remove the old default from plan_id if it exists from a previous setup (safer to include)
ALTER TABLE public.organizations
    ALTER COLUMN plan_id DROP DEFAULT;

-- Add new columns for Stripe
ALTER TABLE public.organizations
    ADD COLUMN stripe_customer_id text UNIQUE,
    ADD COLUMN stripe_subscription_id text UNIQUE,
    ADD COLUMN stripe_subscription_status text; -- e.g., 'active', 'past_due', 'canceled'

-- Now, change plan_id to be a foreign key to the new plans table.
-- This assumes existing organizations might have plan_id values that don't match a new plans table yet.
-- If this is a fresh setup, this is fine. If you had data, you'd need to ensure plans exist first.
-- For safety in a script, we might temporarily allow NULL or handle existing values.
-- For now, let's assume we'll populate the plans table with seed data before this becomes an issue.
ALTER TABLE public.organizations
    ALTER COLUMN plan_id TYPE text USING plan_id::text, -- Ensure it's text
    ADD CONSTRAINT fk_organizations_plan_id FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON UPDATE CASCADE ON DELETE SET NULL;
    -- ON DELETE SET NULL: If a plan is deleted, orgs on that plan will have plan_id set to NULL.
    -- Consider ON DELETE RESTRICT if you don't want plans to be deletable if orgs are using them.

-- Note: We should add some seed data for the plans table after this migration.

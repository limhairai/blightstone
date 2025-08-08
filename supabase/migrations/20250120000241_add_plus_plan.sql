-- Add Plus Plan for Post-Pay Credit Accounts
-- This plan includes enterprise features with post-pay credit capabilities

INSERT INTO public.plans (
  plan_id, 
  name, 
  description, 
  monthly_subscription_fee_cents, 
  ad_spend_fee_percentage, 
  max_team_members, 
  max_businesses, 
  max_ad_accounts, 
  features, 
  stripe_price_id,
  is_active
) VALUES (
  'plus',
  'Plus',
  'Enterprise features with post-pay credit lines and premium support',
  149900, -- $1,499/month
  2.50,   -- 2.5% ad spend fee (1.5% cost + 1% markup)
  -1,     -- Unlimited team members
  -1,     -- Unlimited business managers
  -1,     -- Unlimited ad accounts
  '[
    "Unlimited Active Business Managers",
    "Unlimited Active Ad Accounts", 
    "Unlimited Pixels & Domains",
    "No monthly spend limits",
    "Post-pay credit lines",
    "White glove services",
    "Dedicated account manager",
    "Volume-based cashback"
  ]'::jsonb,
  NULL,   -- Stripe price ID to be set when configured
  true    -- Active plan
);

-- Update the plans table to ensure proper ordering for display
-- Plus should appear after Scale but before Enterprise in UI
UPDATE public.plans SET created_at = NOW() - INTERVAL '1 minute' WHERE plan_id = 'plus';
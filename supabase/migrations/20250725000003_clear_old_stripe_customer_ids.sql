-- Clear old Stripe customer IDs and subscription IDs 
-- These are from the old Stripe account and need to be cleared

-- Clear Stripe customer and subscription IDs from organizations
UPDATE public.organizations 
SET 
    stripe_customer_id = NULL,
    stripe_subscription_id = NULL,
    stripe_subscription_status = NULL
WHERE stripe_customer_id IS NOT NULL;

-- Clear Stripe customer and subscription IDs from subscriptions table
UPDATE public.subscriptions 
SET 
    stripe_customer_id = NULL,
    stripe_subscription_id = NULL
WHERE stripe_customer_id IS NOT NULL; 
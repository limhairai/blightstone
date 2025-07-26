-- Manual Client Upgrade Script
-- This script upgrades a client from free to starter plan manually

-- STEP 1: Find the client organization
-- Replace 'CLIENT_EMAIL_HERE' with the actual client email
SELECT 
    o.organization_id,
    o.name as org_name,
    o.plan_id as current_plan,
    p.email as owner_email,
    o.stripe_customer_id,
    o.stripe_subscription_id
FROM public.organizations o
JOIN public.profiles p ON o.owner_id = p.profile_id
WHERE p.email = 'CLIENT_EMAIL_HERE';

-- STEP 2: Update organization to starter plan
-- Replace 'ORGANIZATION_ID_HERE' with the actual organization_id from step 1
UPDATE public.organizations 
SET 
    plan_id = 'starter',
    subscription_status = 'active',
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '1 month',
    updated_at = NOW()
WHERE organization_id = 'ORGANIZATION_ID_HERE';

-- STEP 3: Create subscription record (if none exists)
-- Replace 'ORGANIZATION_ID_HERE' with the actual organization_id
INSERT INTO public.subscriptions (
    organization_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    created_at,
    updated_at
) VALUES (
    'ORGANIZATION_ID_HERE',
    'starter',
    'active',
    NOW(),
    NOW() + INTERVAL '1 month',
    NOW(),
    NOW()
) ON CONFLICT (organization_id) DO UPDATE SET
    plan_id = 'starter',
    status = 'active',
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '1 month',
    updated_at = NOW();

-- STEP 4: Verify the upgrade
-- Replace 'ORGANIZATION_ID_HERE' with the actual organization_id
SELECT 
    o.organization_id,
    o.name,
    o.plan_id,
    o.subscription_status,
    o.current_period_start,
    o.current_period_end,
    s.status as subscription_status,
    p.monthly_subscription_fee_cents / 100.0 as monthly_fee_dollars
FROM public.organizations o
LEFT JOIN public.subscriptions s ON o.organization_id = s.organization_id
LEFT JOIN public.plans p ON o.plan_id = p.plan_id
WHERE o.organization_id = 'ORGANIZATION_ID_HERE';

-- NOTES:
-- 1. This gives them 1 month of starter plan access
-- 2. They get $15,000 monthly topup allowance  
-- 3. They can create 1 business manager and 3 ad accounts
-- 4. You may want to extend the period if they prepaid for longer 
-- Add freemium onboarding flow
-- Allow users to explore the app with limited functionality before subscribing

-- Create a "free" plan for onboarding
INSERT INTO public.plans (
    id,
    name,
    description,
    monthly_subscription_fee_cents,
    ad_spend_fee_percentage,
    max_team_members,
    max_businesses,
    max_ad_accounts,
    features,
    stripe_price_id
) VALUES (
    'free',
    'Free',
    'Explore AdHub dashboard and features',
    0, -- No monthly fee
    0, -- No ad spend fee
    1, -- Just the owner
    0, -- No business managers
    0, -- No ad accounts
    '["Dashboard Access", "Feature Preview", "Account Management"]'::jsonb,
    NULL -- No Stripe price ID needed
) ON CONFLICT (id) DO NOTHING;

-- Update the subscription status function to handle free plan
CREATE OR REPLACE FUNCTION public.check_organization_subscription_status(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    org_record RECORD;
    plan_record RECORD;
BEGIN
    -- Get organization data
    SELECT * INTO org_record
    FROM organizations
    WHERE organization_id = org_id;
    
    -- If no organization found, return frozen
    IF org_record IS NULL THEN
        RETURN 'frozen';
    END IF;
    
    -- If no plan_id, assign free plan and return free status
    IF org_record.plan_id IS NULL THEN
        -- Auto-assign free plan for new users
        UPDATE organizations 
        SET plan_id = 'free', updated_at = NOW()
        WHERE organization_id = org_id;
        
        RETURN 'free';
    END IF;
    
    -- Check if plan exists
    SELECT * INTO plan_record
    FROM plans
    WHERE id = org_record.plan_id;
    
    -- If plan doesn't exist, freeze the organization
    IF plan_record IS NULL THEN
        RETURN 'frozen';
    END IF;
    
    -- If on free plan, return free status
    IF org_record.plan_id = 'free' THEN
        RETURN 'free';
    END IF;
    
    -- Return current subscription status or active if none set
    RETURN COALESCE(org_record.subscription_status, 'active');
END;
$$ LANGUAGE plpgsql;

-- Update the topup request trigger to handle free plan
CREATE OR REPLACE FUNCTION public.handle_topup_request_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    subscription_status TEXT;
BEGIN
    -- On INSERT (new topup request)
    IF TG_OP = 'INSERT' THEN
        -- Check subscription status first
        SELECT check_organization_subscription_status(NEW.organization_id) INTO subscription_status;
        
        -- If organization is frozen, reject the request
        IF subscription_status = 'frozen' THEN
            RAISE EXCEPTION 'Organization is frozen - topup requests are not allowed. Please contact support.';
        END IF;
        
        -- If organization is on free plan, require subscription
        IF subscription_status = 'free' THEN
            RAISE EXCEPTION 'Please subscribe to a plan to submit topup requests. Upgrade your plan to access this feature.';
        END IF;
        
        -- Reserve funds using total_deducted_cents (which includes fees)
        IF NOT public.reserve_funds_for_topup(NEW.organization_id, NEW.total_deducted_cents) THEN
            RAISE EXCEPTION 'Insufficient available balance for topup request. Required: %, Available: %', 
                NEW.total_deducted_cents, 
                (SELECT get_available_balance(wallet_id) FROM wallets WHERE organization_id = NEW.organization_id);
        END IF;
        RETURN NEW;
    END IF;
    
    -- On UPDATE (status change)
    IF TG_OP = 'UPDATE' THEN
        -- If request was cancelled, rejected, or failed, release reserved funds
        IF OLD.status = 'pending' AND NEW.status IN ('rejected', 'cancelled', 'failed') THEN
            PERFORM public.release_reserved_funds(NEW.organization_id, OLD.total_deducted_cents);
        END IF;
        
        -- If request was completed, complete the transfer and create transaction
        -- Always use total_deducted_cents (includes fees)
        IF OLD.status IN ('pending', 'processing') AND NEW.status = 'completed' THEN
            PERFORM public.complete_topup_transfer(NEW.organization_id, NEW.total_deducted_cents, NEW.id);
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Remove trial tracking fields since we don't need time limits
-- ALTER TABLE public.organizations 
-- ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ DEFAULT NOW(),
-- ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days');

-- Update existing organizations to have free plan if no plan set
UPDATE public.organizations 
SET 
    plan_id = 'free',
    updated_at = NOW()
WHERE plan_id IS NULL;

-- Add comments
COMMENT ON FUNCTION public.check_organization_subscription_status(UUID) IS 'Returns subscription status: active, free, frozen, etc.'; 
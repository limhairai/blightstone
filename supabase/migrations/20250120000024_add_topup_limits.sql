-- Add monthly top-up limits to plans table
-- Starter: $3,000/month limit
-- Growth: $6,000/month limit  
-- Scale: Unlimited
-- Enterprise: Unlimited

-- Add monthly top-up limit column to plans table
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS monthly_topup_limit_cents INTEGER DEFAULT NULL;

-- Update existing plans with top-up limits
UPDATE public.plans SET monthly_topup_limit_cents = 300000 WHERE plan_id = 'starter';  -- $3,000
UPDATE public.plans SET monthly_topup_limit_cents = 600000 WHERE plan_id = 'growth';   -- $6,000
UPDATE public.plans SET monthly_topup_limit_cents = NULL WHERE plan_id = 'scale';      -- Unlimited
UPDATE public.plans SET monthly_topup_limit_cents = NULL WHERE plan_id = 'enterprise'; -- Unlimited
UPDATE public.plans SET monthly_topup_limit_cents = NULL WHERE plan_id = 'free';       -- Unlimited (no transfers anyway)

-- Create function to get monthly top-up usage for an organization
CREATE OR REPLACE FUNCTION public.get_monthly_topup_usage(org_id UUID)
RETURNS INTEGER AS $$
DECLARE
    usage_cents INTEGER;
    current_month_start DATE;
BEGIN
    -- Get the start of the current month
    current_month_start := DATE_TRUNC('month', CURRENT_DATE);
    
    -- Sum all successful topup requests for this organization in the current month
    SELECT COALESCE(SUM(amount_cents), 0) INTO usage_cents
    FROM public.topup_requests
    WHERE organization_id = org_id
    AND status = 'completed'
    AND created_at >= current_month_start;
    
    RETURN usage_cents;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if organization can make a topup request
CREATE OR REPLACE FUNCTION public.can_make_topup_request(org_id UUID, request_amount_cents INTEGER)
RETURNS JSONB AS $$
DECLARE
    org_record RECORD;
    plan_record RECORD;
    current_usage_cents INTEGER;
    limit_cents INTEGER;
    available_cents INTEGER;
BEGIN
    -- Get organization and plan data
    SELECT * INTO org_record FROM public.organizations WHERE organization_id = org_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'Organization not found',
            'current_usage', 0,
            'limit', 0,
            'available', 0
        );
    END IF;
    
    SELECT * INTO plan_record FROM public.plans WHERE plan_id = org_record.plan_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'Plan not found',
            'current_usage', 0,
            'limit', 0,
            'available', 0
        );
    END IF;
    
    -- Get current monthly usage
    current_usage_cents := public.get_monthly_topup_usage(org_id);
    limit_cents := plan_record.monthly_topup_limit_cents;
    
    -- If no limit (NULL), allow the request
    IF limit_cents IS NULL THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'reason', 'No limit',
            'current_usage', current_usage_cents,
            'limit', NULL,
            'available', NULL
        );
    END IF;
    
    -- Calculate available amount
    available_cents := limit_cents - current_usage_cents;
    
    -- Check if request would exceed limit
    IF (current_usage_cents + request_amount_cents) > limit_cents THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'Would exceed monthly limit',
            'current_usage', current_usage_cents,
            'limit', limit_cents,
            'available', available_cents
        );
    END IF;
    
    -- Request is allowed
    RETURN jsonb_build_object(
        'allowed', true,
        'reason', 'Within limit',
        'current_usage', current_usage_cents,
        'limit', limit_cents,
        'available', available_cents
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_monthly_topup_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_make_topup_request(UUID, INTEGER) TO authenticated;

-- Verify the changes
DO $$
DECLARE
    starter_limit INTEGER;
    growth_limit INTEGER;
    scale_limit INTEGER;
BEGIN
    SELECT monthly_topup_limit_cents INTO starter_limit FROM plans WHERE plan_id = 'starter';
    SELECT monthly_topup_limit_cents INTO growth_limit FROM plans WHERE plan_id = 'growth';
    SELECT monthly_topup_limit_cents INTO scale_limit FROM plans WHERE plan_id = 'scale';
    
    IF starter_limit != 300000 THEN
        RAISE EXCEPTION 'Starter plan should have $3,000 limit (300000 cents), found %', starter_limit;
    END IF;
    
    IF growth_limit != 600000 THEN
        RAISE EXCEPTION 'Growth plan should have $6,000 limit (600000 cents), found %', growth_limit;
    END IF;
    
    IF scale_limit IS NOT NULL THEN
        RAISE EXCEPTION 'Scale plan should have unlimited (NULL) limit, found %', scale_limit;
    END IF;
    
    RAISE NOTICE 'Successfully added top-up limits: Starter=$3,000, Growth=$6,000, Scale=Unlimited';
END $$; 
-- MIGRATION TO REMOVE SPEND LIMITS AND FEES AND FIX FUNCTIONS

-- 1. Drop columns from dolphin_assets
ALTER TABLE public.dolphin_assets
DROP COLUMN IF EXISTS spend_limit_cents,
DROP COLUMN IF EXISTS daily_spend_limit_cents;

-- 2. Drop columns from client_asset_bindings
ALTER TABLE public.client_asset_bindings
DROP COLUMN IF EXISTS spend_limit_cents,
DROP COLUMN IF EXISTS fee_percentage;

-- 3. Drop column from plans
ALTER TABLE public.plans
DROP COLUMN IF EXISTS ad_spend_fee_percentage;

-- 4. Update get_asset_binding_details function
-- Dropping the function first to avoid conflicts with return type changes
DROP FUNCTION IF EXISTS public.get_asset_binding_details(UUID);

CREATE OR REPLACE FUNCTION public.get_asset_binding_details(p_asset_id UUID)
RETURNS TABLE (
    binding_id UUID,
    organization_name TEXT,
    business_id UUID,
    business_name TEXT,
    bound_at TIMESTAMPTZ,
    current_spend_cents INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cab.id as binding_id,
        o.name as organization_name,
        b.id as business_id,
        b.name as business_name,
        cab.bound_at,
        COALESCE(SUM(ast.spend_cents), 0)::INTEGER as current_spend_cents
    FROM public.client_asset_bindings cab
    JOIN public.organizations o ON cab.organization_id = o.id
    LEFT JOIN public.businesses b ON cab.business_id = b.id
    LEFT JOIN public.asset_spend_tracking ast ON cab.id = ast.binding_id
        AND ast.date >= DATE_TRUNC('month', CURRENT_DATE)
    WHERE cab.asset_id = p_asset_id
    AND cab.status = 'active'
    GROUP BY cab.id, o.name, b.id, b.name, cab.bound_at;
END;
$$;

-- 5. Update topup_ad_account function
-- Dropping the function first to avoid conflicts with return type changes
DROP FUNCTION IF EXISTS public.topup_ad_account(UUID, BIGINT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.topup_ad_account(
    p_ad_account_id UUID,
    p_amount_cents BIGINT,
    p_payment_method_id TEXT,
    p_organization_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ad_account RECORD;
    v_organization RECORD;
    v_plan RECORD;
    v_final_top_up_amount_cents BIGINT;
    v_stripe_customer_id TEXT;
    v_payment_intent JSONB;
    v_transaction_id UUID;
BEGIN
    -- Validate input
    IF p_amount_cents <= 0 THEN
        RETURN jsonb_build_object('error', 'Top-up amount must be positive.');
    END IF;

    -- Fetch ad account details
    SELECT * INTO v_ad_account FROM public.ad_accounts WHERE id = p_ad_account_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Ad account not found.');
    END IF;

    -- Fetch organization and plan details
    SELECT * INTO v_organization FROM public.organizations WHERE id = p_organization_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Organization not found.');
    END IF;
    SELECT * INTO v_plan FROM public.plans WHERE id = v_organization.plan_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Plan not found for organization.');
    END IF;

    -- Simplified amount calculation (no commission)
    v_final_top_up_amount_cents := p_amount_cents;

    -- Get Stripe customer ID from organization's metadata
    v_stripe_customer_id := v_organization.metadata->>'stripe_customer_id';
    IF v_stripe_customer_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Stripe customer ID not found for the organization.');
    END IF;
    
    -- Simulate a successful payment intent for demonstration
    v_payment_intent := jsonb_build_object(
        'id', 'pi_' || substr(md5(random()::text), 0, 25),
        'status', 'succeeded'
    );

    -- Record the transaction
    INSERT INTO public.transactions (
        organization_id,
        ad_account_id,
        amount_cents,
        type,
        status,
        metadata
    ) VALUES (
        p_organization_id,
        p_ad_account_id,
        v_final_top_up_amount_cents,
        'top-up',
        'completed',
        jsonb_build_object(
            'stripe_payment_intent_id', v_payment_intent->>'id',
            'payment_method_id', p_payment_method_id
        )
    ) RETURNING id INTO v_transaction_id;

    -- Update ad account balance
    UPDATE public.ad_accounts
    SET balance_cents = balance_cents + v_final_top_up_amount_cents
    WHERE id = p_ad_account_id;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'new_balance_cents', v_ad_account.balance_cents + v_final_top_up_amount_cents
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in topup_ad_account: %', SQLERRM;
        RETURN jsonb_build_object('error', 'An unexpected error occurred during top-up.');
END;
$$; 
CREATE OR REPLACE FUNCTION public.topup_ad_account(
    p_organization_id UUID,
    p_ad_account_id UUID,
    p_amount_cents INTEGER
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_wallet_id UUID;
    v_current_balance_cents INTEGER;
    v_plan_commission_rate DECIMAL(5, 2);
    v_commission_amount_cents INTEGER;
    v_final_amount_cents INTEGER;
    v_ad_account_name TEXT;
BEGIN
    -- Get wallet and current balance
    SELECT id, balance_cents INTO v_wallet_id, v_current_balance_cents
    FROM public.wallets
    WHERE organization_id = p_organization_id;

    -- Check for sufficient funds
    IF v_current_balance_cents < p_amount_cents THEN
        RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;

    -- Get plan commission rate (example, replace with actual logic)
    SELECT p.ad_spend_fee_percentage INTO v_plan_commission_rate
    FROM public.organizations o
    JOIN public.plans p ON o.plan_id = p.id
    WHERE o.id = p_organization_id;

    IF NOT FOUND THEN
        v_plan_commission_rate := 0.05; -- Default commission if no plan found
    END IF;
    
    -- Calculate commission and final amount
    v_commission_amount_cents := (p_amount_cents * v_plan_commission_rate)::INTEGER;
    v_final_amount_cents := p_amount_cents - v_commission_amount_cents;

    -- Update wallet balance
    UPDATE public.wallets
    SET balance_cents = balance_cents - p_amount_cents
    WHERE id = v_wallet_id;

    -- Update ad account balance
    UPDATE public.ad_accounts
    SET balance = balance + (v_final_amount_cents::DECIMAL / 100)
    WHERE id = p_ad_account_id
    RETURNING name INTO v_ad_account_name;

    -- Create transaction record
    INSERT INTO public.transactions (organization_id, wallet_id, type, amount_cents, status, description, metadata)
    VALUES (p_organization_id, v_wallet_id, 'topup', v_final_amount_cents, 'completed', 'Top-up for ad account: ' || v_ad_account_name, jsonb_build_object('ad_account_id', p_ad_account_id));

END;
$$; 
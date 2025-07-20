-- Fix broken INSERT statement in complete_topup_transfer function
-- The INSERT statement was missing the VALUES keyword, causing SQL syntax errors

CREATE OR REPLACE FUNCTION public.complete_topup_transfer(
    p_organization_id UUID,
    p_amount_cents INTEGER,
    p_request_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_wallet_id UUID;
    v_account_name TEXT;
    v_account_id TEXT;
    v_current_balance INTEGER;
    v_current_reserved INTEGER;
BEGIN
    -- Get wallet for organization
    SELECT wallet_id, balance_cents, reserved_balance_cents 
    INTO v_wallet_id, v_current_balance, v_current_reserved
    FROM public.wallets
    WHERE organization_id = p_organization_id;
    
    IF v_wallet_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get account info from topup request using semantic ID 'request_id'
    IF p_request_id IS NOT NULL THEN
        SELECT ad_account_name, ad_account_id
        INTO v_account_name, v_account_id
        FROM public.topup_requests 
        WHERE request_id = p_request_id;
    END IF;
    
    -- Set defaults if extraction failed
    v_account_name := COALESCE(v_account_name, 'Ad Account');
    v_account_id := COALESCE(v_account_id, 'Unknown');

    -- CORRECT LOGIC: When admin completes a topup request:
    -- 1. Deduct the money from actual balance (money leaves wallet)
    -- 2. Release the reserved funds (unreserve the amount)
    UPDATE public.wallets
    SET 
        balance_cents = balance_cents - p_amount_cents,  -- Deduct from actual balance
        reserved_balance_cents = GREATEST(0, reserved_balance_cents - p_amount_cents),  -- Release reserved
        updated_at = NOW()
    WHERE wallet_id = v_wallet_id;
    
    -- Verify the wallet has enough balance (this should always pass since funds were reserved)
    IF v_current_balance < p_amount_cents THEN
        RAISE EXCEPTION 'Insufficient wallet balance. Balance: %, Required: %', v_current_balance, p_amount_cents;
    END IF;
    
    -- Create transaction record for the topup (negative = money leaving wallet)
    -- FIXED: Added missing VALUES keyword
    INSERT INTO public.transactions (
        organization_id,
        wallet_id,
        type,
        amount_cents,
        status,
        description,
        metadata
    ) VALUES (
        p_organization_id,
        v_wallet_id,
        'topup',
        -p_amount_cents, -- Negative because money is leaving the wallet
        'completed',
        'Ad Account Top-up - ' || v_account_name,
        jsonb_build_object(
            'ad_account_id', v_account_id,
            'ad_account_name', v_account_name,
            'topup_request_id', p_request_id
        )
    );
    
    RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.complete_topup_transfer(UUID, INTEGER, UUID) IS 
'FIXED: Added missing VALUES keyword in INSERT statement. Deducts money from wallet balance AND releases reserved funds when admin completes topup request.'; 
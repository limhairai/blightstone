-- Update transaction description generation to use display_id instead of UUID
-- This makes transaction descriptions much more user-friendly

-- Update the complete_topup_transfer function to use display_id in descriptions
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
    v_request_display_id TEXT;
BEGIN
    -- Get wallet for organization
    SELECT wallet_id INTO v_wallet_id
    FROM public.wallets
    WHERE organization_id = p_organization_id;
    
    IF v_wallet_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get account info and display_id from topup request
    IF p_request_id IS NOT NULL THEN
        SELECT ad_account_name, ad_account_id, display_id
        INTO v_account_name, v_account_id, v_request_display_id
        FROM public.topup_requests 
        WHERE request_id = p_request_id;
    END IF;
    
    -- Set defaults if extraction failed
    v_account_name := COALESCE(v_account_name, 'Ad Account');
    v_account_id := COALESCE(v_account_id, 'Unknown');

    -- Deduct from both balance and reserved balance
    UPDATE public.wallets
    SET balance_cents = balance_cents - p_amount_cents,
        reserved_balance_cents = GREATEST(0, reserved_balance_cents - p_amount_cents),
        updated_at = NOW()
    WHERE wallet_id = v_wallet_id;
    
    -- Create transaction record for the topup with clean description
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
        CASE 
            WHEN v_request_display_id IS NOT NULL 
            THEN 'Ad Account Top-up ' || v_request_display_id || ' completed'
            ELSE 'Ad Account Top-up completed'
        END,
        jsonb_build_object(
            'ad_account_id', v_account_id,
            'ad_account_name', v_account_name,
            'topup_request_id', p_request_id,
            'topup_request_display_id', v_request_display_id
        )
    );
    
    RETURN TRUE;
END;
$$; 
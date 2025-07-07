-- Fix topup transaction creation
-- Update the complete_topup_transfer function to create transaction records when funding requests are approved

-- Update the function to include transaction creation
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
BEGIN
    -- Get wallet for organization
    SELECT wallet_id INTO v_wallet_id
    FROM public.wallets
    WHERE organization_id = p_organization_id;
    
    IF v_wallet_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Extract account info from funding request notes if available
    IF p_request_id IS NOT NULL THEN
        SELECT 
            CASE 
                WHEN notes ~ 'Top-up request for ad account: (.+?) \(' 
                THEN (regexp_match(notes, 'Top-up request for ad account: (.+?) \('))[1]
                ELSE 'Ad Account'
            END,
            CASE 
                WHEN notes ~ '\(([^)]+)\)' 
                THEN (regexp_match(notes, '\(([^)]+)\)'))[1]
                ELSE 'Unknown'
            END
        INTO v_account_name, v_account_id
        FROM public.funding_requests 
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
    
    -- Create transaction record for the topup
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
            'funding_request_id', p_request_id
        )
    );
    
    RETURN TRUE;
END;
$$;

-- Update the trigger function to pass the request_id
CREATE OR REPLACE FUNCTION public.handle_funding_request_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only handle topup requests (identified by notes containing "Top-up request")
    IF NEW.notes IS NULL OR NEW.notes NOT LIKE '%Top-up request%' THEN
        RETURN NEW;
    END IF;
    
    -- On INSERT (new request)
    IF TG_OP = 'INSERT' THEN
        -- Reserve funds
        IF NOT public.reserve_funds_for_topup(NEW.organization_id, NEW.requested_amount_cents) THEN
            RAISE EXCEPTION 'Insufficient available balance for topup request';
        END IF;
        RETURN NEW;
    END IF;
    
    -- On UPDATE (status change)
    IF TG_OP = 'UPDATE' THEN
        -- If request was cancelled or rejected, release reserved funds
        IF OLD.status = 'pending' AND NEW.status IN ('rejected', 'cancelled') THEN
            PERFORM public.release_reserved_funds(NEW.organization_id, NEW.requested_amount_cents);
        END IF;
        
        -- If request was approved/completed, complete the transfer and create transaction
        IF OLD.status IN ('pending', 'processing') AND NEW.status = 'approved' THEN
            PERFORM public.complete_topup_transfer(NEW.organization_id, NEW.requested_amount_cents, NEW.request_id);
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Update function comment
COMMENT ON FUNCTION public.complete_topup_transfer(UUID, INTEGER, UUID) IS 'Completes topup by deducting from both balance and reserved, and creates transaction record'; 
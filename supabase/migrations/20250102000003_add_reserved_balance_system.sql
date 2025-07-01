-- Add reserved balance system to prevent over-spending on topup requests
-- This ensures that pending topup requests immediately reserve funds from the wallet

-- Add reserved_balance_cents column to wallets table
ALTER TABLE public.wallets 
ADD COLUMN reserved_balance_cents INTEGER DEFAULT 0 NOT NULL;

-- Add a check constraint to ensure reserved balance doesn't exceed total balance
ALTER TABLE public.wallets 
ADD CONSTRAINT wallets_reserved_balance_check 
CHECK (reserved_balance_cents >= 0 AND reserved_balance_cents <= balance_cents);

-- Create a function to calculate available balance (total - reserved)
CREATE OR REPLACE FUNCTION public.get_available_balance(wallet_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
    SELECT balance_cents - reserved_balance_cents 
    FROM public.wallets 
    WHERE wallets.wallet_id = $1;
$$;

-- Create a function to reserve funds for topup requests
CREATE OR REPLACE FUNCTION public.reserve_funds_for_topup(
    p_organization_id UUID,
    p_amount_cents INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_wallet_id UUID;
    v_available_balance INTEGER;
BEGIN
    -- Get wallet for organization
    SELECT wallet_id INTO v_wallet_id
    FROM public.wallets
    WHERE organization_id = p_organization_id;
    
    IF v_wallet_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get current available balance
    SELECT get_available_balance(v_wallet_id) INTO v_available_balance;
    
    -- Check if sufficient funds available
    IF v_available_balance < p_amount_cents THEN
        RETURN FALSE;
    END IF;
    
    -- Reserve the funds
    UPDATE public.wallets
    SET reserved_balance_cents = reserved_balance_cents + p_amount_cents,
        updated_at = NOW()
    WHERE wallet_id = v_wallet_id;
    
    RETURN TRUE;
END;
$$;

-- Create a function to release reserved funds (when request is cancelled/rejected)
CREATE OR REPLACE FUNCTION public.release_reserved_funds(
    p_organization_id UUID,
    p_amount_cents INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_wallet_id UUID;
BEGIN
    -- Get wallet for organization
    SELECT wallet_id INTO v_wallet_id
    FROM public.wallets
    WHERE organization_id = p_organization_id;
    
    IF v_wallet_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Release the reserved funds
    UPDATE public.wallets
    SET reserved_balance_cents = GREATEST(0, reserved_balance_cents - p_amount_cents),
        updated_at = NOW()
    WHERE wallet_id = v_wallet_id;
    
    RETURN TRUE;
END;
$$;

-- Create a function to complete topup (deduct from both balance and reserved)
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

-- Add a trigger to automatically reserve funds when funding request is created
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

-- Create the trigger
CREATE TRIGGER funding_request_balance_trigger
    AFTER INSERT OR UPDATE ON public.funding_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_funding_request_changes();

-- Update existing wallets to have reserved_balance_cents = 0
UPDATE public.wallets SET reserved_balance_cents = 0 WHERE reserved_balance_cents IS NULL;

-- Add index for performance
CREATE INDEX idx_wallets_reserved_balance ON public.wallets(reserved_balance_cents);

-- Add comments
COMMENT ON COLUMN public.wallets.reserved_balance_cents IS 'Amount reserved for pending topup requests';
COMMENT ON FUNCTION public.get_available_balance(UUID) IS 'Returns available balance (total - reserved)';
COMMENT ON FUNCTION public.reserve_funds_for_topup(UUID, INTEGER) IS 'Reserves funds for a topup request';
COMMENT ON FUNCTION public.release_reserved_funds(UUID, INTEGER) IS 'Releases reserved funds when request is cancelled/rejected';
COMMENT ON FUNCTION public.complete_topup_transfer(UUID, INTEGER, UUID) IS 'Completes topup by deducting from both balance and reserved, and creates transaction record'; 
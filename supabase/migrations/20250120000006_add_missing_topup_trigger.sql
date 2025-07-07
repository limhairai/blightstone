-- Comprehensive fix for topup fee reservation
-- This migration ensures all required functions exist and creates the missing trigger

-- Ensure the get_available_balance function exists
CREATE OR REPLACE FUNCTION public.get_available_balance(wallet_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT balance_cents - reserved_balance_cents
    FROM public.wallets
    WHERE wallets.wallet_id = $1;
$$;

-- Ensure the reserve_funds_for_topup function exists
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

-- Ensure the release_reserved_funds function exists
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
    
    -- Release reserved funds (don't deduct from balance again - funds were already reserved)
    UPDATE public.wallets
    SET reserved_balance_cents = GREATEST(0, reserved_balance_cents - p_amount_cents),
        updated_at = NOW()
    WHERE wallet_id = v_wallet_id;
    
    RETURN TRUE;
END;
$$;

-- Ensure the complete_topup_transfer function exists
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
    
    -- Get account info from topup request
    IF p_request_id IS NOT NULL THEN
        SELECT ad_account_name, ad_account_id
        INTO v_account_name, v_account_id
        FROM public.topup_requests 
        WHERE request_id = p_request_id;
    END IF;
    
    -- Set defaults if extraction failed
    v_account_name := COALESCE(v_account_name, 'Ad Account');
    v_account_id := COALESCE(v_account_id, 'Unknown');

    -- Release reserved funds only (don't deduct from balance again - funds were already reserved)
    UPDATE public.wallets
    SET reserved_balance_cents = GREATEST(0, reserved_balance_cents - p_amount_cents),
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
            'topup_request_id', p_request_id
        )
    );
    
    RETURN TRUE;
END;
$$;

-- Create the trigger function that handles topup request changes
CREATE OR REPLACE FUNCTION public.handle_topup_request_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- On INSERT (new topup request)
    IF TG_OP = 'INSERT' THEN
        -- Reserve funds using total_deducted_cents (which includes fees)
        -- This is the key fix - using total_deducted_cents instead of amount_cents
        IF NOT public.reserve_funds_for_topup(NEW.organization_id, NEW.total_deducted_cents) THEN
            RAISE EXCEPTION 'Insufficient available balance for topup request. Required: %', NEW.total_deducted_cents;
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
            PERFORM public.complete_topup_transfer(NEW.organization_id, NEW.total_deducted_cents, NEW.request_id);
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Drop any existing triggers first
DROP TRIGGER IF EXISTS topup_request_changes_trigger ON public.topup_requests;
DROP TRIGGER IF EXISTS topup_request_reservation_trigger ON public.topup_requests;

-- Create the trigger that calls handle_topup_request_changes
CREATE TRIGGER topup_request_reservation_trigger
    AFTER INSERT OR UPDATE ON public.topup_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_topup_request_changes();

-- Add comments to document the fix
COMMENT ON FUNCTION public.handle_topup_request_changes() IS 'Handles reservation and deduction of funds for topup requests including fees (fixed to use total_deducted_cents)';
COMMENT ON TRIGGER topup_request_reservation_trigger ON public.topup_requests IS 'Triggers reservation of total_deducted_cents (including fees) for topup requests'; 
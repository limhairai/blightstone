-- Add reserved balance system for topup_requests table
-- This migration adds the reserved balance functionality to work with the new topup_requests table

-- First, add reserved_balance_cents column to wallets if it doesn't exist
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS reserved_balance_cents INTEGER DEFAULT 0 NOT NULL;

-- Add constraint to ensure reserved balance doesn't exceed total balance
ALTER TABLE public.wallets 
DROP CONSTRAINT IF EXISTS wallets_reserved_balance_check;
ALTER TABLE public.wallets 
ADD CONSTRAINT wallets_reserved_balance_check 
CHECK (reserved_balance_cents >= 0 AND reserved_balance_cents <= balance_cents);

-- Create function to get available balance (total - reserved)
CREATE OR REPLACE FUNCTION public.get_available_balance(wallet_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT balance_cents - reserved_balance_cents
    FROM public.wallets
    WHERE wallet_id = $1;
$$;

-- Create function to reserve funds for topup request
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

-- Create function to release reserved funds
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

-- Create function to complete topup (deduct from both balance and reserved)
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
        WHERE id = p_request_id;
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
            'topup_request_id', p_request_id
        )
    );
    
    RETURN TRUE;
END;
$$;

-- Create trigger function for topup_requests table
CREATE OR REPLACE FUNCTION public.handle_topup_request_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- On INSERT (new topup request)
    IF TG_OP = 'INSERT' THEN
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
        IF OLD.status IN ('pending', 'processing') AND NEW.status = 'completed' THEN
            PERFORM public.complete_topup_transfer(NEW.organization_id, NEW.total_deducted_cents, NEW.id);
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Drop old trigger if it exists
DROP TRIGGER IF EXISTS funding_request_balance_trigger ON public.funding_requests;

-- Create new trigger for topup_requests
DROP TRIGGER IF EXISTS topup_request_balance_trigger ON public.topup_requests;
CREATE TRIGGER topup_request_balance_trigger
    AFTER INSERT OR UPDATE ON public.topup_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_topup_request_changes();

-- Update existing wallets to have reserved_balance_cents = 0 if NULL
UPDATE public.wallets SET reserved_balance_cents = 0 WHERE reserved_balance_cents IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_wallets_reserved_balance ON public.wallets(reserved_balance_cents);

-- Add comments
COMMENT ON COLUMN public.wallets.reserved_balance_cents IS 'Amount reserved for pending topup requests';
COMMENT ON FUNCTION public.get_available_balance(UUID) IS 'Returns available balance (total - reserved)';
COMMENT ON FUNCTION public.reserve_funds_for_topup(UUID, INTEGER) IS 'Reserves funds for a topup request';
COMMENT ON FUNCTION public.release_reserved_funds(UUID, INTEGER) IS 'Releases reserved funds when request is cancelled/rejected';
COMMENT ON FUNCTION public.complete_topup_transfer(UUID, INTEGER, UUID) IS 'Completes topup by deducting from both balance and reserved, and creates transaction record'; 
-- FINAL FIX: Ensure complete_topup_transfer function only releases reserved funds
-- This migration definitively fixes the double deduction bug

-- SEMANTIC ID CONSISTENCY: Use request_id throughout, not generic 'id'
-- This maintains consistency with the semantic ID migration pattern

-- First, ensure topup_requests table uses semantic ID as primary key
ALTER TABLE public.topup_requests 
DROP CONSTRAINT IF EXISTS topup_requests_pkey;

-- Add request_id column if it doesn't exist and make it the primary key
ALTER TABLE public.topup_requests 
ADD COLUMN IF NOT EXISTS request_id UUID DEFAULT gen_random_uuid();

-- Update existing records to have request_id values if they don't
UPDATE public.topup_requests 
SET request_id = gen_random_uuid() 
WHERE request_id IS NULL;

-- Make request_id NOT NULL and primary key
ALTER TABLE public.topup_requests 
ALTER COLUMN request_id SET NOT NULL;

ALTER TABLE public.topup_requests 
ADD CONSTRAINT topup_requests_pkey PRIMARY KEY (request_id);

-- Drop the old generic 'id' column if it exists
ALTER TABLE public.topup_requests 
DROP COLUMN IF EXISTS id;

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
    
    -- Get account info from topup request using semantic ID 'request_id'
    IF p_request_id IS NOT NULL THEN
        SELECT ad_account_name, ad_account_id
        INTO v_account_name, v_account_id
        FROM public.topup_requests 
        WHERE request_id = p_request_id;  -- Use semantic ID 'request_id'
    END IF;
    
    -- Set defaults if extraction failed
    v_account_name := COALESCE(v_account_name, 'Ad Account');
    v_account_id := COALESCE(v_account_id, 'Unknown');

    -- CRITICAL FIX: Only release reserved funds, DO NOT deduct from balance again
    -- The funds were already "reserved" (taken from available balance) when request was created
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

-- Update the trigger function to ensure it uses the correct primary key field
CREATE OR REPLACE FUNCTION public.handle_topup_request_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- On INSERT (new topup request)
    IF TG_OP = 'INSERT' THEN
        -- Reserve funds using total_deducted_cents (which includes fees)
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
        -- Always use total_deducted_cents (includes fees) and pass the semantic request_id
        IF OLD.status IN ('pending', 'processing') AND NEW.status = 'completed' THEN
            PERFORM public.complete_topup_transfer(NEW.organization_id, NEW.total_deducted_cents, NEW.request_id);
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS topup_request_reservation_trigger ON public.topup_requests;
CREATE TRIGGER topup_request_reservation_trigger
    AFTER INSERT OR UPDATE ON public.topup_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_topup_request_changes();

-- Add definitive comments
COMMENT ON FUNCTION public.complete_topup_transfer(UUID, INTEGER, UUID) IS 'FINAL FIX: Only releases reserved funds, does NOT double-deduct from balance. Uses semantic ID request_id.';
COMMENT ON FUNCTION public.handle_topup_request_changes() IS 'FINAL FIX: Handles topup request lifecycle using semantic ID request_id.';
COMMENT ON TRIGGER topup_request_reservation_trigger ON public.topup_requests IS 'FINAL FIX: Triggers proper fund reservation and release using total_deducted_cents and semantic IDs.';
COMMENT ON TABLE public.topup_requests IS 'SEMANTIC ID: Uses request_id as primary key, not generic id.'; 
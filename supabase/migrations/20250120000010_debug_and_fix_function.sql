-- DEBUG: Check current function definition and fix it definitively
-- This migration will show what's currently in the database and replace it

-- First, let's see what the current function looks like
-- (This will be in the migration logs)
DO $$
DECLARE
    func_def TEXT;
BEGIN
    SELECT pg_get_functiondef(oid) INTO func_def
    FROM pg_proc 
    WHERE proname = 'complete_topup_transfer' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    RAISE NOTICE 'Current complete_topup_transfer function definition: %', func_def;
END $$;

-- Now DEFINITIVELY replace the function with the correct version
-- This will override any existing version
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
        WHERE request_id = p_request_id;
    END IF;
    
    -- Set defaults if extraction failed
    v_account_name := COALESCE(v_account_name, 'Ad Account');
    v_account_id := COALESCE(v_account_id, 'Unknown');

    -- CRITICAL FIX: ONLY release reserved funds, DO NOT deduct from balance
    -- The reserved funds were already "taken" from available balance when reserved
    -- So we just need to release them from the reserved bucket
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

-- Add comment to confirm this is the correct version
COMMENT ON FUNCTION public.complete_topup_transfer(UUID, INTEGER, UUID) IS 'DEFINITIVE FIX: Only releases reserved funds, does NOT deduct from balance again. Reserved funds are already taken from available balance.';

-- Also let's check the current trigger function
DO $$
DECLARE
    func_def TEXT;
BEGIN
    SELECT pg_get_functiondef(oid) INTO func_def
    FROM pg_proc 
    WHERE proname = 'handle_topup_request_changes' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    RAISE NOTICE 'Current handle_topup_request_changes function definition: %', func_def;
END $$; 
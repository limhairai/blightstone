-- Add missing wallet functions that are referenced by triggers but never defined
-- These functions are called by the topup_request_reservation_trigger

-- Function to reserve funds when a topup request is created
CREATE OR REPLACE FUNCTION public.reserve_funds_for_topup(
    org_id UUID, 
    amount_cents INTEGER
) 
RETURNS BOOLEAN
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_balance INTEGER;
    current_reserved INTEGER;
    available_balance INTEGER;
BEGIN
    -- Get current balances
    SELECT balance_cents, COALESCE(reserved_balance_cents, 0)
    INTO current_balance, current_reserved
    FROM public.wallets
    WHERE organization_id = org_id;
    
    IF current_balance IS NULL THEN
        RETURN FALSE;
    END IF;
    
    available_balance := current_balance - current_reserved;
    
    -- Check if sufficient funds available
    IF available_balance < amount_cents THEN
        RETURN FALSE;
    END IF;
    
    -- Reserve the funds
    UPDATE public.wallets
    SET reserved_balance_cents = current_reserved + amount_cents,
        updated_at = NOW()
    WHERE organization_id = org_id;
    
    RETURN TRUE;
END;
$$;

-- Function to release reserved funds when a topup request is cancelled/rejected
CREATE OR REPLACE FUNCTION public.release_reserved_funds(
    org_id UUID, 
    amount_cents INTEGER
) 
RETURNS VOID
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    UPDATE public.wallets
    SET reserved_balance_cents = GREATEST(0, COALESCE(reserved_balance_cents, 0) - amount_cents),
        updated_at = NOW()
    WHERE organization_id = org_id;
END;
$$;

-- Add helpful comments
COMMENT ON FUNCTION public.reserve_funds_for_topup(UUID, INTEGER) IS 
'Reserves funds for a topup request by moving money from available balance to reserved balance';

COMMENT ON FUNCTION public.release_reserved_funds(UUID, INTEGER) IS 
'Releases reserved funds when a topup request is cancelled, rejected, or failed';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.reserve_funds_for_topup(UUID, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.release_reserved_funds(UUID, INTEGER) TO authenticated, service_role; 
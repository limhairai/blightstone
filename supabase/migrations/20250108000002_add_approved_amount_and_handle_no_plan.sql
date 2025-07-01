-- Add approved_amount_cents field to topup_requests for admin panel compatibility
-- Also handle the "no subscription plan" scenario

-- Add approved_amount_cents field to match funding_requests structure
ALTER TABLE public.topup_requests 
ADD COLUMN IF NOT EXISTS approved_amount_cents INTEGER;

-- Add updated_at trigger for topup_requests
CREATE OR REPLACE TRIGGER update_topup_requests_updated_at
    BEFORE UPDATE ON public.topup_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update the subscription API to handle "no plan" scenario as a freezing case
-- Create a function to check if organization should be frozen due to no subscription
CREATE OR REPLACE FUNCTION public.check_organization_subscription_status(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    org_record RECORD;
    plan_record RECORD;
BEGIN
    -- Get organization data
    SELECT * INTO org_record
    FROM organizations
    WHERE organization_id = org_id;
    
    -- If no organization found, return frozen
    IF org_record IS NULL THEN
        RETURN 'frozen';
    END IF;
    
    -- If no plan_id, organization should be frozen (no subscription)
    IF org_record.plan_id IS NULL THEN
        RETURN 'no_subscription';
    END IF;
    
    -- Check if plan exists
    SELECT * INTO plan_record
    FROM plans
    WHERE id = org_record.plan_id;
    
    -- If plan doesn't exist, freeze the organization
    IF plan_record IS NULL THEN
        RETURN 'frozen';
    END IF;
    
    -- Return current subscription status or active if none set
    RETURN COALESCE(org_record.subscription_status, 'active');
END;
$$ LANGUAGE plpgsql;

-- Update organizations table to track subscription status properly
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS can_topup BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_request_assets BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMPTZ;

-- Create a function to freeze/unfreeze organizations
CREATE OR REPLACE FUNCTION public.set_organization_freeze_status(
    org_id UUID,
    should_freeze BOOLEAN,
    reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    IF should_freeze THEN
        -- Freeze the organization
        UPDATE organizations 
        SET 
            subscription_status = 'frozen',
            can_topup = FALSE,
            can_request_assets = FALSE,
            frozen_at = NOW(),
            updated_at = NOW()
        WHERE organization_id = org_id;
        
        -- Create admin task for manual review
        INSERT INTO admin_tasks (type, organization_id, title, description, priority, metadata)
        VALUES (
            'organization_frozen',
            org_id,
            'Organization Frozen',
            COALESCE(reason, 'Organization frozen due to subscription issues'),
            'high',
            jsonb_build_object('freeze_reason', reason, 'frozen_at', NOW())
        );
    ELSE
        -- Unfreeze the organization
        UPDATE organizations 
        SET 
            subscription_status = 'active',
            can_topup = TRUE,
            can_request_assets = TRUE,
            frozen_at = NULL,
            updated_at = NOW()
        WHERE organization_id = org_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Update the topup request trigger to check subscription status before allowing requests
CREATE OR REPLACE FUNCTION public.handle_topup_request_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    subscription_status TEXT;
BEGIN
    -- On INSERT (new topup request)
    IF TG_OP = 'INSERT' THEN
        -- Check subscription status first
        SELECT check_organization_subscription_status(NEW.organization_id) INTO subscription_status;
        
        -- If organization is frozen or has no subscription, reject the request
        IF subscription_status IN ('frozen', 'no_subscription') THEN
            RAISE EXCEPTION 'Organization subscription is % - topup requests are not allowed. Please contact support.', subscription_status;
        END IF;
        
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
        -- Always use total_deducted_cents (includes fees)
        IF OLD.status IN ('pending', 'processing') AND NEW.status = 'completed' THEN
            PERFORM public.complete_topup_transfer(NEW.organization_id, NEW.total_deducted_cents, NEW.id);
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Update the complete_topup_transfer function to work with topup_requests
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

-- Add comments
COMMENT ON COLUMN public.topup_requests.approved_amount_cents IS 'Amount approved by admin (may differ from requested amount)';
COMMENT ON FUNCTION public.check_organization_subscription_status(UUID) IS 'Returns subscription status: active, frozen, no_subscription, etc.';
COMMENT ON FUNCTION public.set_organization_freeze_status(UUID, BOOLEAN, TEXT) IS 'Freezes or unfreezes an organization based on subscription status'; 
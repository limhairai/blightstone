-- Remove debugging logs from handle_topup_request_changes function
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
        
        -- If organization is frozen, reject the request
        IF subscription_status = 'frozen' THEN
            RAISE EXCEPTION 'Organization is frozen - topup requests are not allowed. Please contact support.';
        END IF;
        
        -- If organization is on free plan, require subscription
        IF subscription_status = 'free' THEN
            RAISE EXCEPTION 'Please subscribe to a plan to submit topup requests. Upgrade your plan to access this feature.';
        END IF;
        
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
        -- Always use total_deducted_cents (includes fees)
        IF OLD.status IN ('pending', 'processing') AND NEW.status = 'completed' THEN
            PERFORM public.complete_topup_transfer(NEW.organization_id, NEW.total_deducted_cents, NEW.request_id);
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$; 
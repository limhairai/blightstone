-- Debug the topup trigger to find the exact source of the "column id does not exist" error

-- Temporarily replace the trigger with a debug version
CREATE OR REPLACE FUNCTION public.handle_topup_request_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    subscription_status TEXT;
    debug_wallet_id UUID;
    debug_available_balance INTEGER;
BEGIN
    RAISE NOTICE 'DEBUG: Trigger started for operation: %', TG_OP;
    
    -- On INSERT (new topup request)
    IF TG_OP = 'INSERT' THEN
        RAISE NOTICE 'DEBUG: Processing INSERT for organization_id: %', NEW.organization_id;
        
        -- Check subscription status first
        BEGIN
            SELECT check_organization_subscription_status(NEW.organization_id) INTO subscription_status;
            RAISE NOTICE 'DEBUG: Subscription status: %', subscription_status;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'DEBUG: Error in subscription check: %', SQLERRM;
                RAISE;
        END;
        
        -- If organization is frozen, reject the request
        IF subscription_status = 'frozen' THEN
            RAISE EXCEPTION 'Organization is frozen - topup requests are not allowed. Please contact support.';
        END IF;
        
        -- If organization is on free plan, require subscription
        IF subscription_status = 'free' THEN
            RAISE EXCEPTION 'Please subscribe to a plan to submit topup requests. Upgrade your plan to access this feature.';
        END IF;
        
        -- Debug wallet lookup
        BEGIN
            SELECT wallet_id INTO debug_wallet_id
            FROM public.wallets 
            WHERE organization_id = NEW.organization_id;
            RAISE NOTICE 'DEBUG: Found wallet_id: %', debug_wallet_id;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'DEBUG: Error finding wallet: %', SQLERRM;
                RAISE;
        END;
        
        -- Debug available balance check
        BEGIN
            SELECT get_available_balance(debug_wallet_id) INTO debug_available_balance;
            RAISE NOTICE 'DEBUG: Available balance: %', debug_available_balance;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'DEBUG: Error getting available balance: %', SQLERRM;
                RAISE;
        END;
        
        -- Reserve funds using total_deducted_cents (which includes fees)
        BEGIN
            IF NOT public.reserve_funds_for_topup(NEW.organization_id, NEW.total_deducted_cents) THEN
                RAISE EXCEPTION 'Insufficient available balance for topup request. Required: %, Available: %', 
                    NEW.total_deducted_cents, 
                    debug_available_balance;
            END IF;
            RAISE NOTICE 'DEBUG: Successfully reserved funds';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'DEBUG: Error reserving funds: %', SQLERRM;
                RAISE;
        END;
        
        RETURN NEW;
    END IF;
    
    -- On UPDATE (status change)
    IF TG_OP = 'UPDATE' THEN
        RAISE NOTICE 'DEBUG: Processing UPDATE';
        
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

-- Add comment
COMMENT ON FUNCTION public.handle_topup_request_changes() IS 'Debug version of topup request trigger function'; 
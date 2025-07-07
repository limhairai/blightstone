-- Add balance reset request functionality to existing topup_requests table
-- This extends the current topup system to support balance reset requests

-- Add request_type column to distinguish between topup and balance reset requests
ALTER TABLE public.topup_requests 
ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'topup' CHECK (request_type IN ('topup', 'balance_reset'));

-- Add transfer destination fields for balance reset requests
ALTER TABLE public.topup_requests 
ADD COLUMN IF NOT EXISTS transfer_destination_type TEXT CHECK (transfer_destination_type IN ('wallet', 'ad_account')),
ADD COLUMN IF NOT EXISTS transfer_destination_id TEXT;

-- Add comments for new columns
COMMENT ON COLUMN public.topup_requests.request_type IS 'Type of request: topup (add funds to account) or balance_reset (remove funds from account)';
COMMENT ON COLUMN public.topup_requests.transfer_destination_type IS 'For balance reset requests: where to transfer the balance (wallet or ad_account)';
COMMENT ON COLUMN public.topup_requests.transfer_destination_id IS 'For balance reset requests: ID of the destination (wallet_id or ad_account_id)';

-- Update the table constraint to allow negative amounts for balance reset requests
ALTER TABLE public.topup_requests 
DROP CONSTRAINT IF EXISTS topup_requests_amount_cents_check;

-- Add new constraint that allows negative amounts for balance reset requests
ALTER TABLE public.topup_requests 
ADD CONSTRAINT topup_requests_amount_cents_check CHECK (
  (request_type = 'topup' AND amount_cents > 0) OR 
  (request_type = 'balance_reset' AND amount_cents >= 0)
);

-- Create index for request_type for better query performance
CREATE INDEX IF NOT EXISTS idx_topup_requests_request_type ON public.topup_requests(request_type);

-- Update the handle_topup_request_changes function to handle balance reset requests
CREATE OR REPLACE FUNCTION public.handle_topup_request_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    subscription_status TEXT;
BEGIN
    -- On INSERT (new request)
    IF TG_OP = 'INSERT' THEN
        -- Check subscription status first
        SELECT check_organization_subscription_status(NEW.organization_id) INTO subscription_status;
        
        -- If organization is frozen, reject the request
        IF subscription_status = 'frozen' THEN
            RAISE EXCEPTION 'Organization is frozen - requests are not allowed. Please contact support.';
        END IF;
        
        -- If organization is on free plan, require subscription
        IF subscription_status = 'free' THEN
            RAISE EXCEPTION 'Please subscribe to a plan to submit requests. Upgrade your plan to access this feature.';
        END IF;
        
        -- Handle topup requests (reserve funds from wallet)
        IF NEW.request_type = 'topup' THEN
            -- Reserve funds using total_deducted_cents (which includes fees)
            IF NOT public.reserve_funds_for_topup(NEW.organization_id, NEW.total_deducted_cents) THEN
                RAISE EXCEPTION 'Insufficient available balance for topup request. Required: %', NEW.total_deducted_cents;
            END IF;
        END IF;
        
        -- Balance reset requests don't need to reserve funds upfront
        -- They will be processed manually by admin
        
        RETURN NEW;
    END IF;
    
    -- On UPDATE (status change)
    IF TG_OP = 'UPDATE' THEN
        -- Handle topup requests
        IF NEW.request_type = 'topup' THEN
            -- If request was cancelled, rejected, or failed, release reserved funds
            IF OLD.status = 'pending' AND NEW.status IN ('rejected', 'cancelled', 'failed') THEN
                PERFORM public.release_reserved_funds(NEW.organization_id, OLD.total_deducted_cents);
            END IF;
            
            -- If request was completed, complete the transfer and create transaction
            IF OLD.status IN ('pending', 'processing') AND NEW.status = 'completed' THEN
                PERFORM public.complete_topup_transfer(NEW.organization_id, NEW.total_deducted_cents, NEW.request_id);
            END IF;
        END IF;
        
        -- Handle balance reset requests
        IF NEW.request_type = 'balance_reset' THEN
            -- If request was completed, create a transaction record
            -- Note: Admin handles the actual balance reset manually on provider website
            IF OLD.status IN ('pending', 'processing') AND NEW.status = 'completed' THEN
                -- Create transaction record for balance reset
                INSERT INTO public.transactions (
                    organization_id,
                    transaction_type,
                    amount_cents,
                    currency,
                    status,
                    description,
                    metadata,
                    created_at,
                    updated_at
                ) VALUES (
                    NEW.organization_id,
                    CASE 
                        WHEN NEW.transfer_destination_type = 'wallet' THEN 'balance_reset_to_wallet'
                        WHEN NEW.transfer_destination_type = 'ad_account' THEN 'balance_reset_to_account'
                        ELSE 'balance_reset'
                    END,
                    NEW.amount_cents,
                    NEW.currency,
                    'completed',
                    CASE 
                        WHEN NEW.transfer_destination_type = 'wallet' THEN 'Balance reset to wallet - ' || NEW.ad_account_name
                        WHEN NEW.transfer_destination_type = 'ad_account' THEN 'Balance reset to account - ' || NEW.ad_account_name
                        ELSE 'Balance reset - ' || NEW.ad_account_name
                    END,
                    jsonb_build_object(
                        'request_id', NEW.request_id,
                        'ad_account_id', NEW.ad_account_id,
                        'ad_account_name', NEW.ad_account_name,
                        'transfer_destination_type', NEW.transfer_destination_type,
                        'transfer_destination_id', NEW.transfer_destination_id,
                        'processed_by', NEW.processed_by
                    ),
                    NOW(),
                    NOW()
                );
                
                -- If transferring to wallet, add funds to wallet balance
                IF NEW.transfer_destination_type = 'wallet' THEN
                    UPDATE public.wallets 
                    SET balance_cents = balance_cents + NEW.amount_cents,
                        updated_at = NOW()
                    WHERE organization_id = NEW.organization_id;
                END IF;
            END IF;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create helper function to get available balance for an ad account
-- This is a placeholder as we don't store ad account balances in our database
-- In practice, this would query the provider API
CREATE OR REPLACE FUNCTION public.get_ad_account_balance(p_ad_account_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- This is a placeholder function
    -- In practice, this would query the Dolphin API to get the actual balance
    -- For now, return 0 as we don't have this data locally
    RETURN 0;
END;
$$;

-- Add RLS policies for balance reset requests (same as topup requests)
-- The existing policies will automatically apply to balance reset requests
-- since they're in the same table

-- Update comments
COMMENT ON TABLE public.topup_requests IS 'Stores client requests for topup (add funds) and balance reset (remove funds) operations on ad accounts'; 
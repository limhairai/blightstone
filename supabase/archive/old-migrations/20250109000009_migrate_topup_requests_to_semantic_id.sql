-- Migrate topup_requests table to use semantic ID (request_id instead of id)
-- This completes the semantic ID migration for the topup_requests table

-- Step 1: Add new request_id column
ALTER TABLE topup_requests 
ADD COLUMN request_id UUID DEFAULT gen_random_uuid();

-- Step 2: Copy data from id to request_id
UPDATE topup_requests SET request_id = id;

-- Step 3: Make request_id NOT NULL
ALTER TABLE topup_requests 
ALTER COLUMN request_id SET NOT NULL;

-- Step 4: Drop the old primary key constraint
ALTER TABLE topup_requests 
DROP CONSTRAINT topup_requests_pkey;

-- Step 5: Add new primary key constraint
ALTER TABLE topup_requests 
ADD CONSTRAINT topup_requests_pkey PRIMARY KEY (request_id);

-- Step 6: Update foreign key references in other tables (if any)
-- Note: Check if any other tables reference topup_requests.id and update them

-- Step 7: Update any functions that reference the old id column
-- Update the handle_topup_request_changes function if it references id
CREATE OR REPLACE FUNCTION public.handle_topup_request_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    org_record RECORD;
    wallet_record RECORD;
    amount_to_reserve INTEGER;
    amount_to_release INTEGER;
BEGIN
    -- Get organization and wallet info
    SELECT * INTO org_record FROM organizations WHERE organization_id = COALESCE(NEW.organization_id, OLD.organization_id);
    SELECT * INTO wallet_record FROM wallets WHERE organization_id = org_record.organization_id;
    
    -- Handle INSERT (new topup request)
    IF TG_OP = 'INSERT' THEN
        -- Calculate total amount to reserve (including fees)
        amount_to_reserve := NEW.total_deducted_cents;
        
        -- Reserve funds in wallet
        IF NOT reserve_funds_for_topup(NEW.organization_id, amount_to_reserve) THEN
            RAISE EXCEPTION 'Insufficient funds to reserve for topup request. Available: %, Required: %', 
                (wallet_record.balance_cents - wallet_record.reserved_balance_cents), amount_to_reserve;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE (status changes)
    IF TG_OP = 'UPDATE' THEN
        -- If status changed from pending to completed, process the transfer
        IF OLD.status = 'pending' AND NEW.status = 'completed' THEN
            -- Complete the transfer (this will release reserved funds and deduct from balance)
            IF NOT complete_topup_transfer(NEW.organization_id, NEW.total_deducted_cents, NEW.request_id) THEN
                RAISE EXCEPTION 'Failed to complete topup transfer for request %', NEW.request_id;
            END IF;
        END IF;
        
        -- If status changed from pending to failed/cancelled, release reserved funds
        IF OLD.status = 'pending' AND NEW.status IN ('failed', 'cancelled') THEN
            amount_to_release := OLD.total_deducted_cents;
            
            IF NOT release_reserved_funds(OLD.organization_id, amount_to_release) THEN
                RAISE EXCEPTION 'Failed to release reserved funds for cancelled/failed request %', OLD.request_id;
            END IF;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE (cleanup reserved funds)
    IF TG_OP = 'DELETE' THEN
        -- If deleting a pending request, release reserved funds
        IF OLD.status = 'pending' THEN
            amount_to_release := OLD.total_deducted_cents;
            
            IF NOT release_reserved_funds(OLD.organization_id, amount_to_release) THEN
                RAISE EXCEPTION 'Failed to release reserved funds for deleted request %', OLD.request_id;
            END IF;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Step 8: Update the complete_topup_transfer function to use request_id
CREATE OR REPLACE FUNCTION public.complete_topup_transfer(p_organization_id uuid, p_amount_cents integer, p_request_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    wallet_record RECORD;
    available_balance INTEGER;
BEGIN
    -- Get the wallet for this organization
    SELECT * INTO wallet_record 
    FROM wallets 
    WHERE organization_id = p_organization_id;
    
    IF wallet_record IS NULL THEN
        RAISE EXCEPTION 'No wallet found for organization %', p_organization_id;
    END IF;
    
    -- Calculate available balance (total - reserved)
    available_balance := wallet_record.balance_cents - wallet_record.reserved_balance_cents;
    
    -- Check if we have enough available balance (this should always pass since funds were reserved)
    IF wallet_record.reserved_balance_cents < p_amount_cents THEN
        RAISE EXCEPTION 'Insufficient reserved funds. Reserved: %, Required: %', 
            wallet_record.reserved_balance_cents, p_amount_cents;
    END IF;
    
    -- Update wallet: deduct from both balance and reserved balance
    UPDATE wallets 
    SET 
        balance_cents = balance_cents - p_amount_cents,
        reserved_balance_cents = reserved_balance_cents - p_amount_cents,
        updated_at = NOW()
    WHERE organization_id = p_organization_id;
    
    -- Create transaction record
    INSERT INTO transactions (
        organization_id,
        wallet_id,
        type,
        amount_cents,
        status,
        description,
        metadata,
        created_at
    ) VALUES (
        p_organization_id,
        wallet_record.wallet_id,
        'topup_deduction',
        -p_amount_cents, -- Negative for deduction
        'completed',
        CASE 
            WHEN p_request_id IS NOT NULL THEN 'Topup request completed: ' || p_request_id::text
            ELSE 'Manual topup transfer'
        END,
        CASE 
            WHEN p_request_id IS NOT NULL THEN jsonb_build_object('request_id', p_request_id)
            ELSE '{}'::jsonb
        END,
        NOW()
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to complete topup transfer: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- Step 9: Drop the old id column
ALTER TABLE topup_requests 
DROP COLUMN id;

-- Step 10: Add indexes for the new request_id column
CREATE INDEX IF NOT EXISTS idx_topup_requests_request_id ON topup_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_topup_requests_organization_id ON topup_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_topup_requests_status ON topup_requests(status);
CREATE INDEX IF NOT EXISTS idx_topup_requests_created_at ON topup_requests(created_at DESC);

-- Step 11: Update RLS policies to use request_id
DROP POLICY IF EXISTS "Users can view their organization's topup requests" ON topup_requests;
DROP POLICY IF EXISTS "Users can create topup requests for their organization" ON topup_requests;
DROP POLICY IF EXISTS "Users can update their own pending topup requests" ON topup_requests;
DROP POLICY IF EXISTS "Admins can view all topup requests" ON topup_requests;
DROP POLICY IF EXISTS "Admins can update all topup requests" ON topup_requests;

CREATE POLICY "Users can view their organization's topup requests" ON topup_requests
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create topup requests for their organization" ON topup_requests
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own pending topup requests" ON topup_requests
    FOR UPDATE USING (
        requested_by = auth.uid() 
        AND status = 'pending'
        AND organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all topup requests" ON topup_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.profile_id = auth.uid() 
            AND profiles.is_superuser = true
        )
    );

CREATE POLICY "Admins can update all topup requests" ON topup_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.profile_id = auth.uid() 
            AND profiles.is_superuser = true
        )
    ); 
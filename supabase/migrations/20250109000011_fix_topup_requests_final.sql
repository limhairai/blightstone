-- Final fix for topup_requests table to ensure proper schema
-- This migration ensures the table has the correct primary key and all necessary constraints

-- First, ensure the table exists with all required columns
CREATE TABLE IF NOT EXISTS public.topup_requests (
    organization_id UUID NOT NULL,
    requested_by UUID NOT NULL,
    ad_account_id TEXT NOT NULL,
    ad_account_name TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    priority TEXT DEFAULT 'normal' NOT NULL,
    notes TEXT,
    admin_notes TEXT,
    processed_by UUID,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    fee_amount_cents INTEGER DEFAULT 0,
    total_deducted_cents INTEGER DEFAULT 0,
    plan_fee_percentage DECIMAL(5,2) DEFAULT 0,
    approved_amount_cents INTEGER,
    metadata JSONB DEFAULT '{}',
    request_id UUID DEFAULT gen_random_uuid() NOT NULL,
    CONSTRAINT topup_requests_amount_cents_check CHECK (amount_cents > 0),
    CONSTRAINT topup_requests_priority_check CHECK (priority = ANY (ARRAY['low', 'normal', 'high', 'urgent'])),
    CONSTRAINT topup_requests_status_check CHECK (status = ANY (ARRAY['pending', 'processing', 'completed', 'failed', 'cancelled']))
);

-- Add primary key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'topup_requests' 
        AND constraint_name = 'topup_requests_pkey'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.topup_requests ADD CONSTRAINT topup_requests_pkey PRIMARY KEY (request_id);
    END IF;
END $$;

-- Drop old primary key on 'id' column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'topup_requests' 
        AND column_name = 'id'
        AND table_schema = 'public'
    ) THEN
        -- Drop the old id column if it exists
        ALTER TABLE public.topup_requests DROP COLUMN IF EXISTS id;
    END IF;
END $$;

-- Ensure foreign key constraints exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'topup_requests' 
        AND constraint_name = 'topup_requests_organization_id_fkey'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.topup_requests 
        ADD CONSTRAINT topup_requests_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'topup_requests' 
        AND constraint_name = 'topup_requests_requested_by_fkey'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.topup_requests 
        ADD CONSTRAINT topup_requests_requested_by_fkey 
        FOREIGN KEY (requested_by) REFERENCES auth.users(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'topup_requests' 
        AND constraint_name = 'topup_requests_processed_by_fkey'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.topup_requests 
        ADD CONSTRAINT topup_requests_processed_by_fkey 
        FOREIGN KEY (processed_by) REFERENCES auth.users(id);
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_topup_requests_organization_id ON public.topup_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_topup_requests_status ON public.topup_requests(status);
CREATE INDEX IF NOT EXISTS idx_topup_requests_created_at ON public.topup_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_topup_requests_request_id ON public.topup_requests(request_id);

-- Enable RLS
ALTER TABLE public.topup_requests ENABLE ROW LEVEL SECURITY;

-- Drop old policies and create new ones
DROP POLICY IF EXISTS "Users can view their organization's topup requests" ON public.topup_requests;
DROP POLICY IF EXISTS "Users can create topup requests for their organization" ON public.topup_requests;
DROP POLICY IF EXISTS "Users can update their own pending topup requests" ON public.topup_requests;
DROP POLICY IF EXISTS "Admins can view all topup requests" ON public.topup_requests;
DROP POLICY IF EXISTS "Admins can update all topup requests" ON public.topup_requests;

-- Create RLS policies
CREATE POLICY "Users can view their organization's topup requests" ON public.topup_requests
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
        OR organization_id IN (
            SELECT organization_id 
            FROM public.organizations 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create topup requests for their organization" ON public.topup_requests
    FOR INSERT WITH CHECK (
        (organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
        OR organization_id IN (
            SELECT organization_id 
            FROM public.organizations 
            WHERE owner_id = auth.uid()
        ))
        AND requested_by = auth.uid()
    );

CREATE POLICY "Users can update their own pending topup requests" ON public.topup_requests
    FOR UPDATE USING (
        requested_by = auth.uid() 
        AND status = 'pending'
        AND (organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
        OR organization_id IN (
            SELECT organization_id 
            FROM public.organizations 
            WHERE owner_id = auth.uid()
        ))
    );

CREATE POLICY "Admins can view all topup requests" ON public.topup_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.profile_id = auth.uid() 
            AND profiles.is_superuser = true
        )
    );

CREATE POLICY "Admins can update all topup requests" ON public.topup_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.profile_id = auth.uid() 
            AND profiles.is_superuser = true
        )
    );

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS topup_request_balance_trigger ON public.topup_requests;
CREATE TRIGGER topup_request_balance_trigger
    AFTER INSERT OR UPDATE ON public.topup_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_topup_request_changes();

-- Ensure the updated_at trigger exists
DROP TRIGGER IF EXISTS update_topup_requests_updated_at ON public.topup_requests;
CREATE TRIGGER update_topup_requests_updated_at
    BEFORE UPDATE ON public.topup_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.topup_requests IS 'Stores client requests to top up ad accounts from their wallet balance';
COMMENT ON COLUMN public.topup_requests.request_id IS 'Primary key for topup requests (semantic ID)';
COMMENT ON COLUMN public.topup_requests.approved_amount_cents IS 'Amount approved by admin (may differ from requested amount)';
COMMENT ON COLUMN public.topup_requests.metadata IS 'Additional metadata including business manager information';
COMMENT ON COLUMN public.topup_requests.fee_amount_cents IS 'Fee amount in cents based on organization plan';
COMMENT ON COLUMN public.topup_requests.total_deducted_cents IS 'Total amount deducted from wallet (amount + fee)';
COMMENT ON COLUMN public.topup_requests.plan_fee_percentage IS 'Fee percentage applied based on organization plan'; 
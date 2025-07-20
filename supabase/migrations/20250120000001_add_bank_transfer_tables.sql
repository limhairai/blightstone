-- ============================================================================
-- BANK TRANSFER TABLES
-- Add bank transfer request functionality for manual funding
-- ============================================================================

-- Bank transfer requests table
CREATE TABLE IF NOT EXISTS public.bank_transfer_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,
    requested_amount DECIMAL(10,2) NOT NULL CHECK (requested_amount >= 50 AND requested_amount <= 50000),
    reference_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    user_notes TEXT,
    admin_notes TEXT,
    processed_by UUID,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unmatched bank transfers table (for tracking transfers that come in without proper reference)
CREATE TABLE IF NOT EXISTS public.unmatched_transfers (
    transfer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(10,2) NOT NULL,
    sender_info JSONB,
    reference_provided TEXT,
    bank_transaction_id TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'unmatched' CHECK (status IN ('unmatched', 'matched', 'refunded')),
    matched_request_id UUID,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE public.bank_transfer_requests 
ADD CONSTRAINT bank_transfer_requests_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE CASCADE;

ALTER TABLE public.unmatched_transfers 
ADD CONSTRAINT unmatched_transfers_matched_request_id_fkey 
FOREIGN KEY (matched_request_id) REFERENCES public.bank_transfer_requests(request_id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bank_transfer_requests_organization_id ON public.bank_transfer_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_bank_transfer_requests_status ON public.bank_transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_bank_transfer_requests_reference_number ON public.bank_transfer_requests(reference_number);
CREATE INDEX IF NOT EXISTS idx_unmatched_transfers_status ON public.unmatched_transfers(status);
CREATE INDEX IF NOT EXISTS idx_unmatched_transfers_reference_provided ON public.unmatched_transfers(reference_provided);

-- Add updated_at triggers
CREATE TRIGGER set_updated_at_bank_transfer_requests 
BEFORE UPDATE ON public.bank_transfer_requests 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_unmatched_transfers 
BEFORE UPDATE ON public.unmatched_transfers 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.bank_transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unmatched_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bank_transfer_requests
CREATE POLICY "Users can view their organization's bank transfer requests" ON public.bank_transfer_requests
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create bank transfer requests for their organization" ON public.bank_transfer_requests
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

CREATE POLICY "Admins can manage all bank transfer requests" ON public.bank_transfer_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- RLS Policies for unmatched_transfers (admin only)
CREATE POLICY "Admins can manage all unmatched transfers" ON public.unmatched_transfers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- Service role policies
CREATE POLICY "Service role can manage all bank transfer requests" ON public.bank_transfer_requests 
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all unmatched transfers" ON public.unmatched_transfers 
FOR ALL USING (auth.role() = 'service_role'); 
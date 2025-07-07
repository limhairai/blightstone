-- Migration: Add bank transfer tables for Airwallex integration
-- This enables clients to request bank transfers and automatic processing via webhooks
-- NOTE: This migration runs AFTER semantic IDs migration (20250109000000) so profile_id exists

-- Bank transfer requests table
CREATE TABLE IF NOT EXISTS public.bank_transfer_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_amount DECIMAL(10,2) NOT NULL CHECK (requested_amount >= 50 AND requested_amount <= 50000),
    actual_amount DECIMAL(10,2), -- Amount actually received (may differ due to bank fees)
    reference_number TEXT NOT NULL UNIQUE, -- Unique reference for matching transfers
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    user_notes TEXT,
    admin_notes TEXT,
    airwallex_transfer_id TEXT, -- Airwallex transfer ID when processed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unmatched transfers table (for manual processing)
CREATE TABLE IF NOT EXISTS public.unmatched_transfers (
    unmatched_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    airwallex_transfer_id TEXT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    reference_text TEXT, -- Raw reference text from transfer
    attempted_reference TEXT, -- Reference we tried to match
    transfer_data JSONB NOT NULL, -- Full transfer data from Airwallex
    status TEXT NOT NULL DEFAULT 'unmatched' CHECK (status IN ('unmatched', 'matched', 'ignored')),
    matched_request_id UUID REFERENCES public.bank_transfer_requests(request_id),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bank_transfer_requests_org_id ON public.bank_transfer_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_bank_transfer_requests_user_id ON public.bank_transfer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_transfer_requests_status ON public.bank_transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_bank_transfer_requests_reference ON public.bank_transfer_requests(reference_number);
CREATE INDEX IF NOT EXISTS idx_bank_transfer_requests_created_at ON public.bank_transfer_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_unmatched_transfers_airwallex_id ON public.unmatched_transfers(airwallex_transfer_id);
CREATE INDEX IF NOT EXISTS idx_unmatched_transfers_status ON public.unmatched_transfers(status);
CREATE INDEX IF NOT EXISTS idx_unmatched_transfers_created_at ON public.unmatched_transfers(created_at);

-- Update trigger for bank_transfer_requests
CREATE OR REPLACE FUNCTION update_bank_transfer_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bank_transfer_requests_updated_at
    BEFORE UPDATE ON public.bank_transfer_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_bank_transfer_requests_updated_at();

-- RLS Policies
ALTER TABLE public.bank_transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unmatched_transfers ENABLE ROW LEVEL SECURITY;

-- Bank transfer requests policies
CREATE POLICY "Users can view their organization's bank transfer requests"
    ON public.bank_transfer_requests FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create bank transfer requests for their organization"
    ON public.bank_transfer_requests FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own bank transfer requests"
    ON public.bank_transfer_requests FOR UPDATE
    USING (
        user_id = auth.uid() AND 
        status = 'pending'
    );

-- Admin policies for bank transfer requests (using profile_id after semantic IDs migration)
CREATE POLICY "Admins can view all bank transfer requests"
    ON public.bank_transfer_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

CREATE POLICY "Admins can update all bank transfer requests"
    ON public.bank_transfer_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- Unmatched transfers policies (admin only)
CREATE POLICY "Admins can view all unmatched transfers"
    ON public.unmatched_transfers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

CREATE POLICY "Admins can update all unmatched transfers"
    ON public.unmatched_transfers FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- Service role policies (for webhooks)
CREATE POLICY "Service role can insert/update bank transfer requests"
    ON public.bank_transfer_requests FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert/update unmatched transfers"
    ON public.unmatched_transfers FOR ALL
    USING (auth.role() = 'service_role');

-- Comments for documentation
COMMENT ON TABLE public.bank_transfer_requests IS 'Bank transfer requests from clients with unique reference numbers for Airwallex webhook matching';
COMMENT ON TABLE public.unmatched_transfers IS 'Airwallex transfers that could not be automatically matched to requests, requiring manual processing';

COMMENT ON COLUMN public.bank_transfer_requests.reference_number IS 'Unique reference number in format ADHUB-{ORG_ID_SHORT}-{REQUEST_ID_SHORT}-{CHECKSUM}';
COMMENT ON COLUMN public.bank_transfer_requests.requested_amount IS 'Amount requested by client ($50-$50,000)';
COMMENT ON COLUMN public.bank_transfer_requests.actual_amount IS 'Amount actually received (may differ due to bank fees)';
COMMENT ON COLUMN public.unmatched_transfers.transfer_data IS 'Full Airwallex transfer data for debugging and manual matching'; 
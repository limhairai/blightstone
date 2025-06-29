-- Create top-up requests table
CREATE TABLE IF NOT EXISTS topup_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id),
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    ad_account_id TEXT NOT NULL,
    ad_account_name TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    notes TEXT,
    admin_notes TEXT,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_topup_requests_organization_id ON topup_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_topup_requests_status ON topup_requests(status);
CREATE INDEX IF NOT EXISTS idx_topup_requests_created_at ON topup_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_topup_requests_requested_by ON topup_requests(requested_by);

-- Create RLS policies
ALTER TABLE topup_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own organization's requests
CREATE POLICY "Users can view own organization topup requests" ON topup_requests
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_memberships 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can create requests for their organization
CREATE POLICY "Users can create topup requests for own organization" ON topup_requests
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_memberships 
            WHERE user_id = auth.uid()
        )
        AND requested_by = auth.uid()
    );

-- Policy: Users can update their own pending requests
CREATE POLICY "Users can update own pending topup requests" ON topup_requests
    FOR UPDATE USING (
        requested_by = auth.uid() 
        AND status = 'pending'
    );

-- Policy: Admins can view all requests
CREATE POLICY "Admins can view all topup requests" ON topup_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_memberships 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can update all requests
CREATE POLICY "Admins can update all topup requests" ON topup_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organization_memberships 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_topup_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_topup_requests_updated_at
    BEFORE UPDATE ON topup_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_topup_requests_updated_at();

-- Add comment
COMMENT ON TABLE topup_requests IS 'Stores client requests to top up ad accounts from their wallet balance'; 
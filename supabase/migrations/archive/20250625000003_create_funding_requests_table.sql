-- Create funding_requests table
CREATE TABLE IF NOT EXISTS public.funding_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    requested_amount DECIMAL(10,2) NOT NULL,
    approved_amount DECIMAL(10,2),
    notes TEXT,
    admin_notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    rejected_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER set_timestamp_funding_requests
    BEFORE UPDATE ON public.funding_requests
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_funding_requests_organization_id ON public.funding_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_funding_requests_user_id ON public.funding_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_funding_requests_status ON public.funding_requests(status);
CREATE INDEX IF NOT EXISTS idx_funding_requests_submitted_at ON public.funding_requests(submitted_at); 
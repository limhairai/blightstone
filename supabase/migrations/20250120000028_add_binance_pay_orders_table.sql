-- Add Binance Pay orders table for tracking crypto payments
CREATE TABLE public.binance_pay_orders (
    order_id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(organization_id),
    amount_usd DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
    
    -- Binance Pay specific fields
    binance_order_id TEXT,
    binance_transaction_id TEXT,
    payment_url TEXT,
    qr_code TEXT,
    
    -- Timestamps
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_binance_pay_orders_organization_id ON public.binance_pay_orders(organization_id);
CREATE INDEX idx_binance_pay_orders_status ON public.binance_pay_orders(status);
CREATE INDEX idx_binance_pay_orders_created_at ON public.binance_pay_orders(created_at);
CREATE INDEX idx_binance_pay_orders_binance_order_id ON public.binance_pay_orders(binance_order_id);

-- Add RLS (Row Level Security)
ALTER TABLE public.binance_pay_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see orders from their own organization
CREATE POLICY "Users can view their organization's Binance Pay orders"
    ON public.binance_pay_orders
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Users can insert orders for their own organization
CREATE POLICY "Users can create Binance Pay orders for their organization"
    ON public.binance_pay_orders
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: System can update orders (for webhooks)
CREATE POLICY "System can update Binance Pay orders"
    ON public.binance_pay_orders
    FOR UPDATE
    USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_binance_pay_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_binance_pay_orders_updated_at
    BEFORE UPDATE ON public.binance_pay_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_binance_pay_orders_updated_at();

-- Add comment
COMMENT ON TABLE public.binance_pay_orders IS 'Tracks Binance Pay cryptocurrency payment orders for wallet top-ups'; 
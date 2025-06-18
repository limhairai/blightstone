-- Add payment system tables
-- This migration adds support for Stripe payments and payment tracking

-- Add Stripe customer ID to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT UNIQUE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
    type TEXT NOT NULL DEFAULT 'wallet_topup' CHECK (type IN ('wallet_topup', 'subscription', 'one_time')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_organization_id ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);

-- Create payment_methods table (for storing Stripe payment method references)
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_payment_method_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'card' CHECK (type IN ('card', 'bank_account', 'crypto')),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    card_brand TEXT,
    card_last4 TEXT,
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for payment_methods table
CREATE INDEX IF NOT EXISTS idx_payment_methods_organization_id ON payment_methods(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(organization_id, is_default) WHERE is_default = TRUE;

-- Add stripe_payment_intent_id to transactions table for tracking
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent_id ON transactions(stripe_payment_intent_id);

-- Create function to ensure only one default payment method per organization
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a payment method as default, unset all others for this organization
    IF NEW.is_default = TRUE THEN
        UPDATE payment_methods 
        SET is_default = FALSE 
        WHERE organization_id = NEW.organization_id 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for default payment method constraint
DROP TRIGGER IF EXISTS trigger_ensure_single_default_payment_method ON payment_methods;
CREATE TRIGGER trigger_ensure_single_default_payment_method
    BEFORE INSERT OR UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_payment_method();

-- Create function to update payment_methods updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment_methods updated_at
DROP TRIGGER IF EXISTS trigger_update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER trigger_update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_methods_updated_at();

-- Add RLS policies for payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view payments for organizations they belong to
CREATE POLICY "Users can view organization payments" ON payments
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can create payments for organizations they belong to
CREATE POLICY "Users can create organization payments" ON payments
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

-- Policy: System can update payments (for webhook processing)
CREATE POLICY "System can update payments" ON payments
    FOR UPDATE
    USING (TRUE);

-- Add RLS policies for payment_methods table
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view payment methods for organizations they belong to
CREATE POLICY "Users can view organization payment methods" ON payment_methods
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Admins/owners can manage payment methods
CREATE POLICY "Admins can manage payment methods" ON payment_methods
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Create view for payment statistics
CREATE OR REPLACE VIEW payment_stats AS
SELECT 
    organization_id,
    COUNT(*) as total_payments,
    COUNT(*) FILTER (WHERE status = 'succeeded') as successful_payments,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
    COALESCE(SUM(amount) FILTER (WHERE status = 'succeeded'), 0) as total_amount,
    COALESCE(AVG(amount) FILTER (WHERE status = 'succeeded'), 0) as average_payment,
    MAX(completed_at) as last_payment_at
FROM payments
GROUP BY organization_id;

-- Grant access to the view
GRANT SELECT ON payment_stats TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE payments IS 'Tracks all payment attempts and their status';
COMMENT ON TABLE payment_methods IS 'Stores customer payment method references from Stripe';
COMMENT ON COLUMN organizations.stripe_customer_id IS 'Stripe customer ID for this organization';
COMMENT ON COLUMN payments.stripe_payment_intent_id IS 'Stripe Payment Intent ID for tracking';
COMMENT ON COLUMN transactions.stripe_payment_intent_id IS 'Links transaction to originating Stripe payment';

-- Insert initial data if needed (optional)
-- This could be used to migrate existing data or set up default values 
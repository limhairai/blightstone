-- Add balance and financial tracking to organizations
-- This enables real wallet balance tracking

-- Add balance column to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL;

-- Add financial tracking columns
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
ADD COLUMN IF NOT EXISTS monthly_spent DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Create index for balance queries
CREATE INDEX IF NOT EXISTS idx_organizations_balance ON organizations(balance);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON organizations(stripe_customer_id);

-- Add check constraint to ensure balance is not negative
ALTER TABLE organizations 
ADD CONSTRAINT check_organization_balance_positive 
CHECK (balance >= 0);

-- Create function to update organization balance
CREATE OR REPLACE FUNCTION update_organization_balance(
    org_id UUID,
    amount DECIMAL(10,2),
    operation TEXT DEFAULT 'add'
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    new_balance DECIMAL(10,2);
BEGIN
    -- Update balance based on operation
    IF operation = 'add' THEN
        UPDATE organizations 
        SET balance = balance + amount,
            updated_at = NOW()
        WHERE id = org_id
        RETURNING balance INTO new_balance;
    ELSIF operation = 'subtract' THEN
        UPDATE organizations 
        SET balance = GREATEST(0, balance - amount),
            total_spent = total_spent + amount,
            updated_at = NOW()
        WHERE id = org_id
        RETURNING balance INTO new_balance;
    ELSE
        RAISE EXCEPTION 'Invalid operation. Use "add" or "subtract"';
    END IF;
    
    RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_organization_balance(UUID, DECIMAL, TEXT) TO authenticated;

-- Create function to get organization financial summary
CREATE OR REPLACE FUNCTION get_organization_financial_summary(org_id UUID)
RETURNS TABLE (
    balance DECIMAL(10,2),
    total_spent DECIMAL(10,2),
    monthly_spent DECIMAL(10,2),
    total_accounts INTEGER,
    active_accounts INTEGER,
    total_account_balance DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.balance,
        o.total_spent,
        o.monthly_spent,
        COUNT(aa.id)::INTEGER as total_accounts,
        COUNT(CASE WHEN aa.status = 'active' THEN 1 END)::INTEGER as active_accounts,
        COALESCE(SUM(aa.balance), 0) as total_account_balance
    FROM organizations o
    LEFT JOIN businesses b ON b.organization_id = o.id
    LEFT JOIN ad_accounts aa ON aa.business_id = b.id
    WHERE o.id = org_id
    GROUP BY o.id, o.balance, o.total_spent, o.monthly_spent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_organization_financial_summary(UUID) TO authenticated;

-- Add RLS policy for financial functions
CREATE POLICY "Users can access their org financial data" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Add some demo balance for existing organizations
UPDATE organizations 
SET balance = 1500.00 
WHERE balance = 0.00;

-- Add comment
COMMENT ON COLUMN organizations.balance IS 'Organization wallet balance in USD';
COMMENT ON FUNCTION update_organization_balance(UUID, DECIMAL, TEXT) IS 'Updates organization balance safely';
COMMENT ON FUNCTION get_organization_financial_summary(UUID) IS 'Returns comprehensive financial summary for organization'; 
-- Function to deduct balance from organization wallet
CREATE OR REPLACE FUNCTION deduct_organization_balance(org_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Check if organization has sufficient balance
    IF (SELECT balance_cents FROM organizations WHERE organization_id = org_id) < amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;
    
    -- Deduct the amount
    UPDATE organizations 
    SET balance_cents = balance_cents - amount,
        updated_at = NOW()
    WHERE organization_id = org_id;
    
    -- Verify the update happened
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Organization not found';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add balance to organization wallet (for refunds/reversals)
CREATE OR REPLACE FUNCTION add_organization_balance(org_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Add the amount
    UPDATE organizations 
    SET balance_cents = balance_cents + amount,
        updated_at = NOW()
    WHERE organization_id = org_id;
    
    -- Verify the update happened
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Organization not found';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION deduct_organization_balance(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION add_organization_balance(UUID, INTEGER) TO authenticated; 
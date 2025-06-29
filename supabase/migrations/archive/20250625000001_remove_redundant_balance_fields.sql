-- Remove redundant balance fields from organizations table
-- The wallet balance should be the single source of truth

-- Remove the redundant balance field from organizations
ALTER TABLE organizations 
DROP COLUMN IF EXISTS balance,
DROP COLUMN IF EXISTS monthly_spent,
DROP COLUMN IF EXISTS total_spent,
DROP COLUMN IF EXISTS current_monthly_spend_cents,
DROP COLUMN IF EXISTS ad_spend_monthly;

-- Add comment to clarify the balance architecture
COMMENT ON TABLE wallets IS 'Main wallet balance - users top up here first';
COMMENT ON TABLE ad_accounts IS 'Individual ad account balances - allocated from wallet';

-- Update the organizations table comment
COMMENT ON TABLE organizations IS 'Organization metadata - balance is tracked in wallets table'; 
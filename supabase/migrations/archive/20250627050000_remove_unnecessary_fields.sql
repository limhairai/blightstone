-- Remove unnecessary fields from organizations and businesses tables
-- Simplifying the schema further

-- Remove unnecessary fields from organizations table
ALTER TABLE public.organizations 
DROP COLUMN IF EXISTS verification_status,
DROP COLUMN IF EXISTS support_channel_type,
DROP COLUMN IF EXISTS support_channel_contact,
DROP COLUMN IF EXISTS telegram_alerts_enabled,
DROP COLUMN IF EXISTS telegram_alert_thresholds;

-- Remove telegram_id from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS telegram_id;

-- Remove verification field from businesses table (not needed for simplified model)
ALTER TABLE public.businesses 
DROP COLUMN IF EXISTS verification;

-- Remove currency from wallets table (always USD)
ALTER TABLE public.wallets 
DROP COLUMN IF EXISTS currency;

-- Keep website_url, remove website (they're redundant)
ALTER TABLE public.businesses 
DROP COLUMN IF EXISTS website;

-- Add comments to clarify the simplified model
COMMENT ON TABLE public.organizations IS 'Simplified organizations table - essential fields only';
COMMENT ON TABLE public.businesses IS 'Simplified businesses table - name, website, and basic status only';
COMMENT ON TABLE public.wallets IS 'Simplified wallets table - balance in cents, always USD'; 
-- Remove unnecessary fields from businesses table
-- Remove campaign_objective, description, business_type fields
-- These are not needed for our simplified business application process

-- Remove fields from businesses table
ALTER TABLE businesses 
DROP COLUMN IF EXISTS business_type,
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS campaign_objective;

-- Remove platform field from ad_accounts table if it exists
ALTER TABLE ad_accounts 
DROP COLUMN IF EXISTS platform;

-- Remove any platform-related fields from ad_account_applications if they exist
ALTER TABLE ad_account_applications 
DROP COLUMN IF EXISTS platform,
DROP COLUMN IF EXISTS business_type,
DROP COLUMN IF EXISTS description;

-- Add comment to clarify the simplified business model
COMMENT ON TABLE businesses IS 'Simplified business table - only essential fields for policy verification';
COMMENT ON TABLE ad_accounts IS 'Ad accounts table - platform is always Meta/Facebook'; 
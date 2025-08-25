-- Add ad_account_id and offer_id columns to creatives table if they don't exist
-- This ensures the production database has the same schema as development

-- Add ad_account_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'creatives' 
                   AND column_name = 'ad_account_id') THEN
        ALTER TABLE creatives ADD COLUMN ad_account_id UUID NULL;
    END IF;
END $$;

-- Add offer_id column if it doesn't exist  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'creatives' 
                   AND column_name = 'offer_id') THEN
        ALTER TABLE creatives ADD COLUMN offer_id UUID NULL;
    END IF;
END $$;

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_creatives_ad_account_id ON creatives(ad_account_id);
CREATE INDEX IF NOT EXISTS idx_creatives_offer_id ON creatives(offer_id);

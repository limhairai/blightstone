-- Add campaign ID system to creatives table

-- Rename ad_concept to campaign_concept and add new fields
ALTER TABLE creatives 
RENAME COLUMN ad_concept TO campaign_concept;

-- Add batch number field
ALTER TABLE creatives 
ADD COLUMN IF NOT EXISTS batch_number INTEGER DEFAULT 1;

-- Add generated campaign ID field
ALTER TABLE creatives 
ADD COLUMN IF NOT EXISTS campaign_id TEXT;
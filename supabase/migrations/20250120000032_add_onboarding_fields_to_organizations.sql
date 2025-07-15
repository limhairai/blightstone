-- Add onboarding fields to organizations table
-- These fields capture information collected during the onboarding process

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS ad_spend_monthly TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS how_heard_about_us TEXT,
ADD COLUMN IF NOT EXISTS additional_info TEXT;

-- Add comments to document the purpose of these fields
COMMENT ON COLUMN public.organizations.ad_spend_monthly IS 'Monthly advertising spend range collected during onboarding';
COMMENT ON COLUMN public.organizations.industry IS 'Industry/business type collected during onboarding';
COMMENT ON COLUMN public.organizations.timezone IS 'User timezone for scheduling business managers and support';
COMMENT ON COLUMN public.organizations.how_heard_about_us IS 'Referral source tracking - how the user discovered AdHub';
COMMENT ON COLUMN public.organizations.additional_info IS 'Additional information about current advertising setup and goals';

-- Verify the changes
DO $$
BEGIN
    -- Check if columns were added successfully
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'ad_spend_monthly'
    ) THEN
        RAISE EXCEPTION 'Failed to add ad_spend_monthly column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'industry'
    ) THEN
        RAISE EXCEPTION 'Failed to add industry column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'timezone'
    ) THEN
        RAISE EXCEPTION 'Failed to add timezone column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'how_heard_about_us'
    ) THEN
        RAISE EXCEPTION 'Failed to add how_heard_about_us column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'additional_info'
    ) THEN
        RAISE EXCEPTION 'Failed to add additional_info column';
    END IF;
    
    RAISE NOTICE 'Successfully added onboarding fields to organizations table';
END $$; 
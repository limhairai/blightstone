-- Remove industry field from businesses table if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND column_name = 'industry' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.businesses DROP COLUMN industry;
    END IF;
END $$; 
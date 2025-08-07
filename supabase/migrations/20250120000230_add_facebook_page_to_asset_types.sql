-- Add facebook_page to the asset type constraint
ALTER TABLE public.asset 
DROP CONSTRAINT IF EXISTS asset_type_check,
ADD CONSTRAINT asset_type_check CHECK (type IN ('business_manager', 'ad_account', 'profile', 'pixel', 'facebook_page'));

COMMENT ON CONSTRAINT asset_type_check ON public.asset IS 'Ensures asset type is one of the supported types including facebook_page';
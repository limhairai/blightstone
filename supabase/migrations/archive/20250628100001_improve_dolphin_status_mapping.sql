-- ============================================================================
-- IMPROVE DOLPHIN STATUS MAPPING
-- This migration improves the status mapping to better reflect Dolphin API reality
-- ============================================================================

-- Add new status values that better reflect Dolphin API statuses
ALTER TABLE public.dolphin_assets 
DROP CONSTRAINT IF EXISTS dolphin_assets_status_check;

ALTER TABLE public.dolphin_assets 
ADD CONSTRAINT dolphin_assets_status_check 
CHECK (status IN ('active', 'restricted', 'suspended', 'connection_error'));

-- Add new health status values
ALTER TABLE public.dolphin_assets 
DROP CONSTRAINT IF EXISTS dolphin_assets_health_status_check;

ALTER TABLE public.dolphin_assets 
ADD CONSTRAINT dolphin_assets_health_status_check 
CHECK (health_status IN ('healthy', 'warning', 'critical', 'disconnected'));

-- Update existing records with TOKEN_ERROR to have correct status
UPDATE public.dolphin_assets 
SET 
    status = 'connection_error',
    health_status = 'disconnected'
WHERE asset_metadata->>'status' = 'TOKEN_ERROR';

-- Update existing records with correct mapping
UPDATE public.dolphin_assets 
SET 
    status = 'active',
    health_status = 'healthy'
WHERE asset_metadata->>'status' = 'ACTIVE';

UPDATE public.dolphin_assets 
SET 
    status = 'suspended',
    health_status = 'warning'
WHERE asset_metadata->>'status' = 'SUSPENDED';

UPDATE public.dolphin_assets 
SET 
    status = 'restricted',
    health_status = 'warning'
WHERE asset_metadata->>'status' = 'RESTRICTED';

-- Add comment to explain the status mapping
COMMENT ON COLUMN public.dolphin_assets.status IS 'Asset status: active (working), restricted (FB restricted), suspended (FB suspended), connection_error (Dolphin auth issue)';
COMMENT ON COLUMN public.dolphin_assets.health_status IS 'Connection health: healthy (all good), warning (minor issues), critical (major issues), disconnected (auth failed)';

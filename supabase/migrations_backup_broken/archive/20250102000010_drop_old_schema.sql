-- Migration: Drop OLD schema tables and functions
-- This migration removes the redundant OLD schema tables and functions
-- We're keeping only the NEW schema (asset + asset_binding)

-- Drop OLD schema tables
DROP TABLE IF EXISTS public.client_asset_bindings CASCADE;
DROP TABLE IF EXISTS public.dolphin_assets CASCADE;

-- Drop any OLD schema functions/triggers if they exist
DROP FUNCTION IF EXISTS public.sync_dolphin_assets() CASCADE;
DROP FUNCTION IF EXISTS public.get_client_assets(uuid, text) CASCADE;

-- Add comment to track migration
COMMENT ON SCHEMA public IS 'Cleaned up schema - removed old dolphin_assets and client_asset_bindings tables'; 
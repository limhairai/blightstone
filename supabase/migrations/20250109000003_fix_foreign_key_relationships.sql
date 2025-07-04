-- Fix foreign key relationships after semantic ID migration
-- This addresses the "Could not find a relationship between 'application' and 'organizations'" error

-- First, ensure the foreign key constraint exists between application and organizations
ALTER TABLE public.application 
DROP CONSTRAINT IF EXISTS application_organization_id_fkey;

ALTER TABLE public.application 
ADD CONSTRAINT application_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE CASCADE;

-- Fix other foreign key constraints that might be missing after semantic ID migration
ALTER TABLE public.application 
DROP CONSTRAINT IF EXISTS application_approved_by_fkey;

ALTER TABLE public.application 
ADD CONSTRAINT application_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.application 
DROP CONSTRAINT IF EXISTS application_rejected_by_fkey;

ALTER TABLE public.application 
ADD CONSTRAINT application_rejected_by_fkey 
FOREIGN KEY (rejected_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.application 
DROP CONSTRAINT IF EXISTS application_fulfilled_by_fkey;

ALTER TABLE public.application 
ADD CONSTRAINT application_fulfilled_by_fkey 
FOREIGN KEY (fulfilled_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix asset_binding foreign key constraints
ALTER TABLE public.asset_binding 
DROP CONSTRAINT IF EXISTS asset_binding_asset_id_fkey;

ALTER TABLE public.asset_binding 
ADD CONSTRAINT asset_binding_asset_id_fkey 
FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON DELETE CASCADE;

ALTER TABLE public.asset_binding 
DROP CONSTRAINT IF EXISTS asset_binding_organization_id_fkey;

ALTER TABLE public.asset_binding 
ADD CONSTRAINT asset_binding_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE CASCADE;

ALTER TABLE public.asset_binding 
DROP CONSTRAINT IF EXISTS asset_binding_bound_by_fkey;

ALTER TABLE public.asset_binding 
ADD CONSTRAINT asset_binding_bound_by_fkey 
FOREIGN KEY (bound_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix application_fulfillment foreign key constraints
ALTER TABLE public.application_fulfillment 
DROP CONSTRAINT IF EXISTS application_fulfillment_application_id_fkey;

ALTER TABLE public.application_fulfillment 
ADD CONSTRAINT application_fulfillment_application_id_fkey 
FOREIGN KEY (application_id) REFERENCES public.application(application_id) ON DELETE CASCADE;

ALTER TABLE public.application_fulfillment 
DROP CONSTRAINT IF EXISTS application_fulfillment_asset_id_fkey;

ALTER TABLE public.application_fulfillment 
ADD CONSTRAINT application_fulfillment_asset_id_fkey 
FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON CONSTRAINT application_organization_id_fkey ON public.application IS 'Foreign key relationship between application and organizations using semantic IDs'; 
-- Add missing foreign key constraints between application and profiles tables
-- These constraints are needed for the admin API to properly join user information

-- Add foreign key constraints for application audit trail fields
ALTER TABLE public.application 
ADD CONSTRAINT application_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES public.profiles(profile_id) ON DELETE SET NULL;

ALTER TABLE public.application 
ADD CONSTRAINT application_rejected_by_fkey 
FOREIGN KEY (rejected_by) REFERENCES public.profiles(profile_id) ON DELETE SET NULL;

ALTER TABLE public.application 
ADD CONSTRAINT application_fulfilled_by_fkey 
FOREIGN KEY (fulfilled_by) REFERENCES public.profiles(profile_id) ON DELETE SET NULL;

-- Add indexes for better performance on these foreign key columns
CREATE INDEX IF NOT EXISTS idx_application_approved_by ON public.application(approved_by);
CREATE INDEX IF NOT EXISTS idx_application_rejected_by ON public.application(rejected_by);
CREATE INDEX IF NOT EXISTS idx_application_fulfilled_by ON public.application(fulfilled_by);

-- Add comment for documentation
COMMENT ON CONSTRAINT application_approved_by_fkey ON public.application IS 'Links to the admin who approved this application';
COMMENT ON CONSTRAINT application_rejected_by_fkey ON public.application IS 'Links to the admin who rejected this application';
COMMENT ON CONSTRAINT application_fulfilled_by_fkey ON public.application IS 'Links to the admin who fulfilled this application'; 
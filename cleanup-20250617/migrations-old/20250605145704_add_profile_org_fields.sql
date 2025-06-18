-- Add is_superuser and role to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_superuser BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client' NOT NULL;

-- Optional: Add a check constraint for roles if you have a defined set and want to enforce it
-- ALTER TABLE public.profiles
-- ADD CONSTRAINT check_profile_role CHECK (role IN ('client', 'admin', 'editor', 'manager')); -- Customize roles as needed

COMMENT ON COLUMN public.profiles.is_superuser IS 'Indicates if the user has superuser/platform admin privileges.';
COMMENT ON COLUMN public.profiles.role IS 'Defines the general role of the user within the platform, distinct from org-specific roles.';

-- Add verification_status to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending_review' NOT NULL;

-- Optional: Add a check constraint for allowed verification statuses
ALTER TABLE public.organizations
ADD CONSTRAINT check_organization_verification_status CHECK (verification_status IN ('pending_review', 'approved', 'rejected', 'needs_more_info')); -- Customize statuses as needed

COMMENT ON COLUMN public.organizations.verification_status IS 'Tracks the admin verification status of the organization.';

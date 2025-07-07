-- Fix Schema Issues Migration
-- This migration addresses the schema inconsistencies causing API errors

-- =====================================================
-- PHASE 1: ADD MISSING COLUMNS
-- =====================================================

-- Add subscription_status column to organizations table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'subscription_status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.organizations 
        ADD COLUMN subscription_status TEXT DEFAULT 'active';
        
        COMMENT ON COLUMN public.organizations.subscription_status IS 'Subscription status: active, inactive, cancelled, etc.';
    END IF;
END $$;

-- =====================================================
-- PHASE 2: ENSURE PROFILES TABLE USES SEMANTIC IDs
-- =====================================================

-- Check if profiles table is using the correct primary key
DO $$ 
BEGIN
    -- If profiles table still uses 'id' as primary key, we need to fix it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'profiles' 
        AND tc.constraint_type = 'PRIMARY KEY'
        AND kcu.column_name = 'id'
        AND tc.table_schema = 'public'
    ) THEN
        -- Drop the old primary key constraint
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_pkey;
        
        -- Ensure profile_id column exists and has correct values
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name = 'profile_id'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.profiles ADD COLUMN profile_id UUID;
        END IF;
        
        -- Update profile_id with id values if they're different
        UPDATE public.profiles SET profile_id = id WHERE profile_id IS NULL OR profile_id != id;
        
        -- Make profile_id NOT NULL
        ALTER TABLE public.profiles ALTER COLUMN profile_id SET NOT NULL;
        
        -- Add new primary key constraint
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (profile_id);
        
        -- Update foreign key references if needed
        -- Note: This assumes auth.users still uses 'id' as primary key
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_profile_id_fkey 
        FOREIGN KEY (profile_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- PHASE 3: UPDATE FUNCTIONS TO USE CORRECT COLUMN NAMES
-- =====================================================

-- Update handle_new_user function to use profile_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id UUID;
  user_email TEXT;
  user_name TEXT;
  new_org_name TEXT;
BEGIN
  -- Get the email from the NEW record
  user_email := NEW.email;
  
  -- Extract user name more intelligently
  user_name := COALESCE(
    -- First try metadata fields
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'first_name',
    -- Then try to extract from email
    CASE 
      WHEN user_email IS NOT NULL THEN
        -- Convert email prefix to proper case (e.g., john.doe -> John Doe)
        initcap(replace(split_part(user_email, '@', 1), '.', ' '))
      ELSE 'User'
    END
  );
  
  -- Create a user-friendly default organization name
  new_org_name := user_name || '''s Organization';

  -- Create a new organization for the user
  INSERT INTO public.organizations (name, owner_id, subscription_status)
  VALUES (new_org_name, NEW.id, 'active')
  RETURNING organization_id INTO new_org_id;

  -- Create the user's profile, linking it to the new organization
  INSERT INTO public.profiles(profile_id, organization_id, name, email, role)
  VALUES (NEW.id, new_org_id, user_name, user_email, 'client');
  
  -- Add the user to the organization as a member with the 'owner' role
  INSERT INTO public.organization_members(user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');
  
  -- Create a wallet for the organization
  INSERT INTO public.wallets(organization_id)
  VALUES (new_org_id);
  
  -- Inject the organization_id into the user's app_metadata for easy access on the client
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('organization_id', new_org_id)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- PHASE 4: UPDATE INDEXES
-- =====================================================

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_profiles_profile_id ON public.profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON public.organizations(subscription_status);

-- =====================================================
-- PHASE 5: COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN public.organizations.subscription_status IS 'Current subscription status of the organization';
COMMENT ON COLUMN public.profiles.profile_id IS 'Semantic primary key for profiles table, references auth.users(id)'; 
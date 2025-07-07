-- ============================================================================
-- ENSURE IS_ADMIN FUNCTION EXISTS
-- This migration ensures the is_admin function exists to prevent RLS recursion
-- ============================================================================

-- Drop and recreate the function to ensure it exists
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- Create the is_admin function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- Use SECURITY DEFINER to bypass RLS when checking admin status
  SELECT COALESCE(
    (SELECT is_superuser FROM public.profiles WHERE profile_id = user_id LIMIT 1),
    false
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon;

-- Update the problematic RLS policies to use the function
-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Recreate policies using the function
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- Add comment
COMMENT ON FUNCTION public.is_admin(UUID) IS 'SECURITY DEFINER function to check admin status without RLS recursion. Created by ensure_is_admin_function migration.';

-- Log success
DO $$
BEGIN
    RAISE NOTICE 'is_admin function created successfully';
    RAISE NOTICE 'RLS policies updated to use is_admin function';
END $$; 
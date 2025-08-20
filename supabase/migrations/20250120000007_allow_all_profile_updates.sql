-- Allow any authenticated user to update any profile
-- This is appropriate for an internal CRM where team members should be able to manage each other's names

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create a more permissive policy for internal CRM use
CREATE POLICY "Users can update any profile" ON public.profiles
    FOR UPDATE USING (auth.uid() IS NOT NULL);
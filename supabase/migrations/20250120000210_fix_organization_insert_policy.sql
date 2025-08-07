-- Fix organization INSERT policy issue
-- The policy exists but may not be working properly due to conflicting policies

-- First, let's check if the INSERT policy exists and recreate it if needed
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
CREATE POLICY "Users can create organizations" ON public.organizations
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Also ensure users can insert their own profiles
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Users can create their own profile" ON public.profiles
    FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Ensure users can insert organization memberships for organizations they own
DROP POLICY IF EXISTS "Users can create memberships for their organizations" ON public.organization_members;
CREATE POLICY "Users can create memberships for their organizations" ON public.organization_members
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
        )
        OR user_id = auth.uid() -- Allow users to create their own membership
    );

-- Add comment explaining the fix
COMMENT ON POLICY "Users can create organizations" ON public.organizations IS 
'Allows authenticated users to create organizations where they are the owner. Required for onboarding flow.';

-- Debug: Let's also check if there are any conflicting policies
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Organization policies after fix:';
    FOR rec IN 
        SELECT schemaname, tablename, policyname, cmd, qual 
        FROM pg_policies 
        WHERE tablename = 'organizations'
    LOOP
        RAISE NOTICE 'Policy: % - Command: % - Check: %', rec.policyname, rec.cmd, rec.qual;
    END LOOP;
END $$;
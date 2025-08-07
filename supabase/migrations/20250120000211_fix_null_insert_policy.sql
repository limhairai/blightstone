-- Fix the NULL check condition in the organization INSERT policy
-- The previous migration showed that the policy has a NULL check condition which causes permission denied

-- Drop the broken policy and recreate it with proper syntax
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;

-- Create the INSERT policy with explicit WITH CHECK clause
CREATE POLICY "Users can create organizations" ON public.organizations
    FOR INSERT 
    WITH CHECK (owner_id = auth.uid());

-- Also ensure profiles INSERT policy exists
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Users can create their own profile" ON public.profiles
    FOR INSERT 
    WITH CHECK (profile_id = auth.uid());

-- Debug: Verify the policy was created correctly
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Checking INSERT policy after fix:';
    FOR rec IN 
        SELECT policyname, cmd, with_check 
        FROM pg_policies 
        WHERE tablename = 'organizations' AND cmd = 'INSERT'
    LOOP
        RAISE NOTICE 'INSERT Policy: % - Check: %', rec.policyname, rec.with_check;
    END LOOP;
END $$;

COMMENT ON POLICY "Users can create organizations" ON public.organizations IS 
'Fixed INSERT policy - allows authenticated users to create organizations where they are the owner';
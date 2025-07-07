-- Fix RLS policies that still reference old column names after semantic ID migration

-- Drop existing policies that reference profiles.id
DROP POLICY IF EXISTS "Admins can manage all onboarding states" ON public.onboarding_states;
DROP POLICY IF EXISTS "Admins can manage all topup requests" ON public.topup_requests;

-- Recreate policies with correct semantic IDs
CREATE POLICY "Admins can manage all onboarding states" ON public.onboarding_states
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

CREATE POLICY "Admins can manage all topup requests" ON public.topup_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- Add comment
COMMENT ON POLICY "Admins can manage all onboarding states" ON public.onboarding_states IS 'Allows superuser profiles to manage all onboarding states';
COMMENT ON POLICY "Admins can manage all topup requests" ON public.topup_requests IS 'Allows superuser profiles to manage all topup requests'; 
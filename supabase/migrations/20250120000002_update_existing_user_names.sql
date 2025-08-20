-- Update existing users who have "Unknown" or empty names
-- Use email prefix as a fallback name

UPDATE public.profiles 
SET name = SPLIT_PART(email, '@', 1)
WHERE (name IS NULL OR name = '' OR name = 'Unknown' OR name = 'User')
AND email IS NOT NULL;

-- Update the handle_new_user function to use email prefix instead of 'User' as fallback
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_org_id UUID;
    user_name TEXT;
BEGIN
    -- Extract user name from metadata or use email prefix
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- Create a profile for the user
    INSERT INTO public.profiles (profile_id, name, email, is_superuser)
    VALUES (
        NEW.id, 
        user_name, 
        NEW.email, 
        FALSE
    );

    -- Create a default organization for the user and get its ID
    INSERT INTO public.organizations (owner_id, name)
    VALUES (
        NEW.id, 
        user_name || '''s Organization'
    ) RETURNING id INTO new_org_id;

    -- Add user as organization member using the captured ID
    INSERT INTO public.organization_members (user_id, organization_id, role)
    VALUES (NEW.id, new_org_id, 'owner');

    -- Create a wallet for the organization using the captured ID
    INSERT INTO public.wallets (organization_id)
    VALUES (new_org_id);

    -- Create onboarding progress record
    INSERT INTO public.onboarding_progress (user_id, has_verified_email)
    VALUES (NEW.id, NEW.email_confirmed_at IS NOT NULL);

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;
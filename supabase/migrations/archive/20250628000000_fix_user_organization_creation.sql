-- Fix user organization creation
-- Ensure the handle_new_user function is correct and the trigger is active

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
        SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- Create a profile for the user
    INSERT INTO public.profiles (id, name, email, is_superuser)
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

-- Recreate the trigger to ensure it's active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create organizations for any existing users who don't have them
DO $$
DECLARE
    user_record RECORD;
    new_org_id UUID;
    user_name TEXT;
BEGIN
    FOR user_record IN 
        SELECT u.id, u.email, u.raw_user_meta_data
        FROM auth.users u
        LEFT JOIN public.organizations o ON o.owner_id = u.id
        WHERE o.id IS NULL
    LOOP
        -- Extract user name
        user_name := COALESCE(
            user_record.raw_user_meta_data->>'full_name',
            SPLIT_PART(user_record.email, '@', 1)
        );
        
        -- Create organization for this user
        INSERT INTO public.organizations (owner_id, name)
        VALUES (
            user_record.id,
            user_name || '''s Organization'
        ) RETURNING id INTO new_org_id;

        -- Add user as organization member
        INSERT INTO public.organization_members (user_id, organization_id, role)
        VALUES (user_record.id, new_org_id, 'owner');

        -- Create wallet for the organization
        INSERT INTO public.wallets (organization_id)
        VALUES (new_org_id);

        RAISE NOTICE 'Created organization "%" for user: %', user_name || '''s Organization', user_record.email;
    END LOOP;
END $$; 
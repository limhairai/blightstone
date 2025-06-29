CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Create a profile for the user
    INSERT INTO public.profiles (id, name, email, is_superuser)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 
        NEW.email, 
        FALSE
    );

    -- Create a default organization for the user and get its ID
    INSERT INTO public.organizations (owner_id, name)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User') || '''s Organization'
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
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user(); 
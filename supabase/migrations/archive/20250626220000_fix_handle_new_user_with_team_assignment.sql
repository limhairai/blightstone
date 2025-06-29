CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_org_id UUID;
    available_team_id UUID;
BEGIN
    -- Create a profile for the user
    INSERT INTO public.profiles (id, name, email, is_superuser)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 
        NEW.email, 
        FALSE
    );

    -- Find an available team
    SELECT get_available_team_by_org() INTO available_team_id;

    -- Create a default organization for the user and get its ID
    INSERT INTO public.organizations (owner_id, name, team_id)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User') || '''s Organization',
        available_team_id
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
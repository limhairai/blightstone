-- Create organizations for existing users who don't have them
DO $$
DECLARE
    user_record RECORD;
    new_org_id UUID;
BEGIN
    -- Loop through users who don't have organizations
    FOR user_record IN 
        SELECT u.id, u.email, u.raw_user_meta_data
        FROM auth.users u
        LEFT JOIN public.organizations o ON o.owner_id = u.id
        WHERE o.id IS NULL
    LOOP
        -- Create organization for this user
        INSERT INTO public.organizations (owner_id, name)
        VALUES (
            user_record.id,
            COALESCE(user_record.raw_user_meta_data->>'full_name', 'User') || '''s Organization'
        ) RETURNING id INTO new_org_id;

        -- Add user as organization member
        INSERT INTO public.organization_members (user_id, organization_id, role)
        VALUES (user_record.id, new_org_id, 'owner');

        -- Create wallet for the organization
        INSERT INTO public.wallets (organization_id)
        VALUES (new_org_id);

        RAISE NOTICE 'Created organization for user: %', user_record.email;
    END LOOP;
END $$; 
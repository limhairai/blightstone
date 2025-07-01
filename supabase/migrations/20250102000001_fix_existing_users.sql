-- Fix existing users who don't have organizations assigned
-- This handles users created before the improved handle_new_user function

DO $$
DECLARE
  user_record RECORD;
  new_org_id UUID;
  user_name TEXT;
BEGIN
  -- Find all profiles without organization_id
  FOR user_record IN 
    SELECT p.id, p.name, p.email, u.raw_user_meta_data, u.email as auth_email
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.organization_id IS NULL
  LOOP
    -- Extract user name
    user_name := COALESCE(
      user_record.name,
      user_record.raw_user_meta_data->>'name',
      user_record.raw_user_meta_data->>'full_name',
      split_part(COALESCE(user_record.email, user_record.auth_email), '@', 1),
      'User'
    );

    -- Create organization for the user
    INSERT INTO public.organizations (name, owner_id)
    VALUES (user_name || '''s Organization', user_record.id)
    RETURNING organization_id INTO new_org_id;

    -- Create wallet for the organization
    INSERT INTO public.wallets (organization_id, balance_cents)
    VALUES (new_org_id, 0);

    -- Add user as owner in organization_members
    INSERT INTO public.organization_members (user_id, organization_id, role)
    VALUES (user_record.id, new_org_id, 'owner');

    -- Update profile with organization_id
    UPDATE public.profiles 
    SET organization_id = new_org_id,
        name = user_name,
        updated_at = NOW()
    WHERE id = user_record.id;

    RAISE NOTICE 'Fixed user % with new organization %', user_record.id, new_org_id;
  END LOOP;
END $$; 
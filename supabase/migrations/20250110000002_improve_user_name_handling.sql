-- Improve user name handling during signup
-- Extract names more intelligently from email and metadata

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id UUID;
  user_email TEXT;
  user_name TEXT;
  new_org_name TEXT;
BEGIN
  -- Get the email from the NEW record
  user_email := NEW.email;
  
  -- Extract user name more intelligently
  user_name := COALESCE(
    -- First try metadata fields
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'first_name',
    -- Then try to extract from email
    CASE 
      WHEN user_email IS NOT NULL THEN
        -- Convert email prefix to proper case (e.g., john.doe -> John Doe)
        initcap(replace(split_part(user_email, '@', 1), '.', ' '))
      ELSE 'User'
    END
  );
  
  -- Create a user-friendly default organization name
  new_org_name := user_name || '''s Organization';

  -- Create a new organization for the user
  INSERT INTO public.organizations (name, owner_id)
  VALUES (new_org_name, NEW.id)
  RETURNING organization_id INTO new_org_id;

  -- Create the user's profile, linking it to the new organization
  INSERT INTO public.profiles(profile_id, organization_id, name, email, role)
  VALUES (NEW.id, new_org_id, user_name, user_email, 'client');
  
  -- Add the user to the organization as a member with the 'owner' role
  INSERT INTO public.organization_members(user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');
  
  -- Create a wallet for the organization
  INSERT INTO public.wallets(organization_id)
  VALUES (new_org_id);
  
  -- Inject the organization_id into the user's app_metadata for easy access on the client
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('organization_id', new_org_id)
  WHERE id = NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Update existing users who have generic names
UPDATE public.profiles 
SET name = CASE 
  WHEN name IN ('User', 'Unknown') AND email IS NOT NULL THEN
    initcap(replace(split_part(email, '@', 1), '.', ' '))
  ELSE name
END,
updated_at = NOW()
WHERE name IN ('User', 'Unknown') AND email IS NOT NULL;

-- Update organization names for users with generic names
UPDATE public.organizations 
SET name = CASE 
  WHEN name LIKE '%User''s%' OR name LIKE '%Unknown''s%' THEN
    (SELECT initcap(replace(split_part(p.email, '@', 1), '.', ' ')) || '''s Organization'
     FROM profiles p WHERE p.profile_id = organizations.owner_id)
  ELSE name
END,
updated_at = NOW()
WHERE name LIKE '%User''s%' OR name LIKE '%Unknown''s%';

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile and organization with intelligent name extraction from email and metadata'; 
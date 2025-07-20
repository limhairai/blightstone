-- Fix organization name format to be "Name's Organization"
-- This addresses the issue where new signups create organizations with just the user's name

-- Update the handle_new_user function to create organization names in the format "Name's Organization"
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
  new_wallet_id UUID;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  
  -- Extract user name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(user_email, '@', 1),
    'User'
  );
  
  -- Generate organization name in the format "Name's Organization"
  new_org_name := user_name || '''s Organization';
  
  -- Create organization
  new_org_id := gen_random_uuid();
  INSERT INTO public.organizations (organization_id, name, owner_id, plan_id)
  VALUES (new_org_id, new_org_name, NEW.id, 'free');
  
  -- Create wallet for the organization
  new_wallet_id := gen_random_uuid();
  INSERT INTO public.wallets (wallet_id, organization_id, balance_cents, reserved_balance_cents)
  VALUES (new_wallet_id, new_org_id, 0, 0);
  
  -- Create profile
  INSERT INTO public.profiles (profile_id, email, name, avatar_url, organization_id)
  VALUES (
    NEW.id,
    user_email,
    user_name,
    NEW.raw_user_meta_data->>'avatar_url',
    new_org_id
  );
  
  -- Add user as organization member (CRITICAL: This was missing!)
  INSERT INTO public.organization_members (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');
  
  RETURN NEW;
END;
$$;

-- Update existing organizations that have just the name to "Name's Organization" format
-- Only update organizations that don't already have the "'s Organization" suffix
UPDATE public.organizations 
SET name = (
  SELECT COALESCE(p.name, split_part(p.email, '@', 1)) || '''s Organization'
  FROM public.profiles p 
  WHERE p.organization_id = organizations.organization_id
),
updated_at = NOW()
WHERE name NOT LIKE '%''s Organization'
  AND name NOT LIKE '%''s Team'
  AND name NOT LIKE '%Organization%'
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.organization_id = organizations.organization_id
  ); 
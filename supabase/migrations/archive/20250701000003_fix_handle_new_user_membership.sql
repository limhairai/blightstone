-- Migration to fix the handle_new_user function to correctly create an organization_members entry.
BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a new organization for the user
  INSERT INTO public.organizations (name, owner_id)
  VALUES (NEW.email, NEW.id)
  RETURNING organization_id INTO new_org_id;

  -- Create the user's profile
  INSERT INTO public.profiles(id, organization_id, email, name, role)
  VALUES (NEW.id, new_org_id, NEW.email, '', 'client');
  
  -- Add the user to the organization as a member (the missing step)
  INSERT INTO public.organization_members(user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT; 
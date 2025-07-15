-- Fix missing organization membership entries
-- This addresses cases where users exist but don't have proper organization membership

-- Add missing organization_members entries for users who have organizations but no membership
INSERT INTO public.organization_members (user_id, organization_id, role)
SELECT 
  p.profile_id,
  p.organization_id,
  'owner'
FROM public.profiles p
JOIN public.organizations o ON p.organization_id = o.organization_id
LEFT JOIN public.organization_members om ON p.profile_id = om.user_id AND p.organization_id = om.organization_id
WHERE om.user_id IS NULL
  AND p.organization_id IS NOT NULL;

-- Also add for organization owners who might not have membership entries
INSERT INTO public.organization_members (user_id, organization_id, role)
SELECT 
  o.owner_id,
  o.organization_id,
  'owner'
FROM public.organizations o
LEFT JOIN public.organization_members om ON o.owner_id = om.user_id AND o.organization_id = om.organization_id
WHERE om.user_id IS NULL
ON CONFLICT (user_id, organization_id) DO NOTHING; 
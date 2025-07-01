// Database repair script for missing organization membership entries
// This fixes users who have a profile.organization_id but no organization_members entry

console.log('🔧 Repairing missing organization membership entries...');

// This would typically be run on the backend, but for quick debugging:
// You can use this in Supabase SQL Editor or adapt for your backend

const repairSQL = `
-- Find and fix users with profile.organization_id but no organization_members entry
INSERT INTO public.organization_members (user_id, organization_id, role)
SELECT DISTINCT 
    p.id as user_id,
    p.organization_id,
    'owner' as role
FROM public.profiles p
LEFT JOIN public.organization_members om ON (om.user_id = p.id AND om.organization_id = p.organization_id)
WHERE p.organization_id IS NOT NULL 
  AND om.user_id IS NULL;

-- Also ensure the organizations exist for those profile entries
-- (In case organizations were deleted but profiles still reference them)
`;

console.log('SQL to run in Supabase SQL Editor:');
console.log(repairSQL);

// Alternative: If you want to clear invalid profile.organization_id entries:
const cleanupSQL = `
-- Clear invalid organization_id from profiles where organization doesn't exist
UPDATE public.profiles 
SET organization_id = NULL 
WHERE organization_id IS NOT NULL 
  AND organization_id NOT IN (SELECT organization_id FROM public.organizations);
`;

console.log('\\nAlternative cleanup SQL:');
console.log(cleanupSQL); 
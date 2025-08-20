-- Fix the handle_new_user trigger to ensure profiles are created for new signups
-- This ensures new users appear in the team table automatically

-- Recreate the trigger to ensure it's active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create profiles for any existing auth users who don't have profiles yet
INSERT INTO public.profiles (profile_id, name, email, is_superuser)
SELECT 
    u.id,
    COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        SPLIT_PART(u.email, '@', 1)
    ),
    u.email,
    FALSE
FROM auth.users u
LEFT JOIN public.profiles p ON p.profile_id = u.id
WHERE p.profile_id IS NULL;
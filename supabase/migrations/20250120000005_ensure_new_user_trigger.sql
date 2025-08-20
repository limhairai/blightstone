-- Ensure the trigger for creating profiles on user signup is properly created
-- This is the long-term solution to automatically add new signups to the team table

-- First, ensure the trigger is dropped if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger that will automatically create profiles for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the trigger was created by attempting to create profiles for any existing users
-- This will catch any existing users who signed up but don't have profiles
DO $$
DECLARE
    user_record RECORD;
    user_name TEXT;
BEGIN
    -- Loop through all auth users and create profiles if they don't exist
    FOR user_record IN 
        SELECT u.id, u.email, u.raw_user_meta_data, u.created_at
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.profile_id = u.id
        WHERE p.profile_id IS NULL
    LOOP
        -- Extract user name from metadata or use email prefix
        user_name := COALESCE(
            user_record.raw_user_meta_data->>'full_name',
            user_record.raw_user_meta_data->>'name',
            SPLIT_PART(user_record.email, '@', 1),
            'User'
        );
        
        -- Create profile for this user
        INSERT INTO public.profiles (profile_id, name, email, is_superuser, created_at)
        VALUES (
            user_record.id,
            user_name,
            user_record.email,
            FALSE,
            user_record.created_at
        );
        
        RAISE NOTICE 'Created profile for user: % with name: %', user_record.email, user_name;
    END LOOP;
END $$;
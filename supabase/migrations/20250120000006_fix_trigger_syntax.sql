-- Fix the trigger syntax issue
-- Use the correct PostgreSQL syntax for creating triggers

-- Drop any existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger with correct syntax
-- Note: Using EXECUTE PROCEDURE for compatibility with Supabase
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Test that the trigger was created by checking system catalog
-- This will help us debug if the trigger creation fails
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created' 
        AND tgrelid = 'auth.users'::regclass
    ) THEN
        RAISE NOTICE 'SUCCESS: Trigger on_auth_user_created was created successfully';
    ELSE
        RAISE NOTICE 'ERROR: Trigger on_auth_user_created was NOT created';
    END IF;
END $$;
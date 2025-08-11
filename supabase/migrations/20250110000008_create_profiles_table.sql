-- Create profiles table for user management and team tracking
-- This table stores additional user information beyond what's in auth.users

CREATE TABLE IF NOT EXISTS profiles (
    profile_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    is_superuser BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on profile_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_profile_id ON profiles(profile_id);

-- Create an index on email for faster searches
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create an index on created_at for sorting by join date
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Create a function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (profile_id, name, email, created_at)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
        new.email,
        new.created_at
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create profiles for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at() 
RETURNS trigger AS $$
BEGIN
    new.updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at on profile changes
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Insert profiles for any existing users who don't have profiles yet
INSERT INTO public.profiles (profile_id, name, email, created_at)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', ''),
    u.email,
    u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.profile_id = u.id
WHERE p.profile_id IS NULL;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view all profiles (for team page)
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = profile_id);

-- Only authenticated users can insert profiles (handled by trigger)
CREATE POLICY "Service role can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO service_role;
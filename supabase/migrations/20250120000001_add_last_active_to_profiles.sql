-- Add last_active field to profiles table for proper activity tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();

-- Create index for performance when querying by last_active
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active);

-- Update existing profiles to have a last_active timestamp
UPDATE public.profiles 
SET last_active = updated_at 
WHERE last_active IS NULL;

-- Create a function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_user_last_active(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles 
  SET last_active = NOW()
  WHERE profile_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Add Onboarding Tracking Migration
-- This migration adds comprehensive onboarding tracking to the profiles table

-- ============================================================================
-- 1. ADD ONBOARDING FIELDS TO PROFILES TABLE
-- ============================================================================

-- Add onboarding state JSONB column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_state JSONB DEFAULT '{
  "hasEverCompletedEmail": false,
  "hasEverFundedWallet": false,
  "hasEverCreatedBusiness": false,
  "hasEverCreatedAccount": false,
  "hasExplicitlyDismissedOnboarding": false,
  "onboardingVersion": "1.0",
  "currentStep": 0,
  "completedSteps": [],
  "lastUpdated": null
}'::jsonb;

-- Add onboarding completion tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add first login tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add last seen tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- ============================================================================
-- 2. CREATE ONBOARDING TRACKING FUNCTIONS
-- ============================================================================

-- Function to update onboarding state
CREATE OR REPLACE FUNCTION public.update_user_onboarding_state(
  p_user_id UUID,
  p_field TEXT,
  p_value BOOLEAN
) RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    onboarding_state = jsonb_set(
      onboarding_state, 
      ARRAY[p_field], 
      to_jsonb(p_value)
    ),
    onboarding_state = jsonb_set(
      onboarding_state, 
      ARRAY['lastUpdated'], 
      to_jsonb(timezone('utc'::text, now()))
    )
  WHERE id = p_user_id;
  
  -- Check if onboarding is complete and update completion timestamp
  PERFORM public.check_onboarding_completion(p_user_id);
END;
$$ LANGUAGE plpgsql;

-- Function to dismiss onboarding
CREATE OR REPLACE FUNCTION public.dismiss_onboarding(
  p_user_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    onboarding_state = jsonb_set(
      onboarding_state, 
      ARRAY['hasExplicitlyDismissedOnboarding'], 
      'true'::jsonb
    ),
    onboarding_state = jsonb_set(
      onboarding_state, 
      ARRAY['lastUpdated'], 
      to_jsonb(timezone('utc'::text, now()))
    ),
    onboarding_completed_at = timezone('utc'::text, now())
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if onboarding is complete
CREATE OR REPLACE FUNCTION public.check_onboarding_completion(
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  onboarding_data JSONB;
  is_complete BOOLEAN := false;
BEGIN
  SELECT onboarding_state INTO onboarding_data 
  FROM public.profiles 
  WHERE id = p_user_id;
  
  -- Check if all required steps are completed
  IF (onboarding_data->>'hasEverCompletedEmail')::boolean = true AND
     (onboarding_data->>'hasEverFundedWallet')::boolean = true AND
     (onboarding_data->>'hasEverCreatedBusiness')::boolean = true AND
     (onboarding_data->>'hasEverCreatedAccount')::boolean = true THEN
    
    is_complete := true;
    
    -- Update completion timestamp if not already set
    UPDATE public.profiles 
    SET onboarding_completed_at = COALESCE(onboarding_completed_at, timezone('utc'::text, now()))
    WHERE id = p_user_id AND onboarding_completed_at IS NULL;
  END IF;
  
  RETURN is_complete;
END;
$$ LANGUAGE plpgsql;

-- Function to reset onboarding state
CREATE OR REPLACE FUNCTION public.reset_onboarding(
  p_user_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    onboarding_state = '{
      "hasEverCompletedEmail": false,
      "hasEverFundedWallet": false,
      "hasEverCreatedBusiness": false,
      "hasEverCreatedAccount": false,
      "hasExplicitlyDismissedOnboarding": false,
      "onboardingVersion": "1.0",
      "currentStep": 0,
      "completedSteps": [],
      "lastUpdated": null
    }'::jsonb,
    onboarding_completed_at = NULL
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get onboarding progress
CREATE OR REPLACE FUNCTION public.get_onboarding_progress(
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  profile_data RECORD;
  progress JSONB;
BEGIN
  SELECT 
    onboarding_state,
    onboarding_completed_at,
    created_at
  INTO profile_data
  FROM public.profiles 
  WHERE id = p_user_id;
  
  -- Build progress object
  progress := jsonb_build_object(
    'onboardingState', profile_data.onboarding_state,
    'completedAt', profile_data.onboarding_completed_at,
    'accountCreatedAt', profile_data.created_at,
    'isComplete', public.check_onboarding_completion(p_user_id)
  );
  
  RETURN progress;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. CREATE TRIGGERS FOR AUTOMATIC ONBOARDING TRACKING
-- ============================================================================

-- Trigger to track first login
CREATE OR REPLACE FUNCTION public.track_first_login()
RETURNS TRIGGER AS $$
BEGIN
  -- Update first_login_at if it's null (first time)
  IF NEW.last_sign_in_at IS NOT NULL AND OLD.last_sign_in_at IS NULL THEN
    UPDATE public.profiles 
    SET first_login_at = timezone('utc'::text, now())
    WHERE id = NEW.id AND first_login_at IS NULL;
  END IF;
  
  -- Always update last_seen_at
  UPDATE public.profiles 
  SET last_seen_at = timezone('utc'::text, now())
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on auth.users for login tracking
DROP TRIGGER IF EXISTS track_user_login ON auth.users;
CREATE TRIGGER track_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.track_first_login();

-- ============================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for onboarding queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_state 
ON public.profiles USING GIN (onboarding_state);

-- Index for completion tracking
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
ON public.profiles (onboarding_completed_at);

-- Index for first login tracking
CREATE INDEX IF NOT EXISTS idx_profiles_first_login 
ON public.profiles (first_login_at);

-- ============================================================================
-- 5. SET UP ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Policy for users to read their own onboarding data
CREATE POLICY "Users can view own onboarding data" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy for users to update their own onboarding data
CREATE POLICY "Users can update own onboarding data" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- 6. INITIALIZE EXISTING USERS
-- ============================================================================

-- Update existing users with default onboarding state
UPDATE public.profiles 
SET onboarding_state = '{
  "hasEverCompletedEmail": true,
  "hasEverFundedWallet": false,
  "hasEverCreatedBusiness": false,
  "hasEverCreatedAccount": false,
  "hasExplicitlyDismissedOnboarding": false,
  "onboardingVersion": "1.0",
  "currentStep": 0,
  "completedSteps": ["email-verification"],
  "lastUpdated": null
}'::jsonb
WHERE onboarding_state IS NULL;

-- Set first_login_at for existing users to their created_at
UPDATE public.profiles 
SET first_login_at = created_at 
WHERE first_login_at IS NULL;

-- ============================================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN public.profiles.onboarding_state IS 'JSONB object tracking onboarding progress and state';
COMMENT ON COLUMN public.profiles.onboarding_completed_at IS 'Timestamp when onboarding was completed';
COMMENT ON COLUMN public.profiles.first_login_at IS 'Timestamp of users first login';
COMMENT ON COLUMN public.profiles.last_seen_at IS 'Timestamp of users last activity';

COMMENT ON FUNCTION public.update_user_onboarding_state IS 'Updates a specific field in the users onboarding state';
COMMENT ON FUNCTION public.dismiss_onboarding IS 'Marks onboarding as dismissed by user';
COMMENT ON FUNCTION public.check_onboarding_completion IS 'Checks if user has completed all onboarding steps';
COMMENT ON FUNCTION public.reset_onboarding IS 'Resets user onboarding state to initial values';
COMMENT ON FUNCTION public.get_onboarding_progress IS 'Returns complete onboarding progress for a user'; 
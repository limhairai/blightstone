-- Create onboarding_states table to track user onboarding progress
CREATE TABLE IF NOT EXISTS onboarding_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    has_explicitly_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per user
    UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE onboarding_states ENABLE ROW LEVEL SECURITY;

-- Users can only access their own onboarding state
CREATE POLICY "Users can view their own onboarding state"
    ON onboarding_states FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding state"
    ON onboarding_states FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding state"
    ON onboarding_states FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow service role to bypass RLS for admin operations
CREATE POLICY "Service role can manage all onboarding states"
    ON onboarding_states FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_states_user_id ON onboarding_states(user_id);

-- Add comment
COMMENT ON TABLE onboarding_states IS 'Tracks user onboarding progress and dismissal state'; 
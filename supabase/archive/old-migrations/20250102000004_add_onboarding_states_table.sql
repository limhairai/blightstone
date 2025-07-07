-- Create onboarding_states table to track user onboarding progress and dismissal
CREATE TABLE IF NOT EXISTS public.onboarding_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    has_explicitly_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.onboarding_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own onboarding state" 
ON public.onboarding_states FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding state" 
ON public.onboarding_states FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding state" 
ON public.onboarding_states FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all onboarding states" 
ON public.onboarding_states FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_superuser = true));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_states_user_id ON public.onboarding_states(user_id);

-- Add updated_at trigger
CREATE TRIGGER update_onboarding_states_updated_at
    BEFORE UPDATE ON public.onboarding_states
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.onboarding_states IS 'Tracks user onboarding progress and dismissal state'; 
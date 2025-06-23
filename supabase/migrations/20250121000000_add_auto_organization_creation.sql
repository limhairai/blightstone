-- Migration: Auto-create organization on user registration
-- This ensures every user gets an organization automatically when they sign up

-- Create function to auto-create organization for new users
CREATE OR REPLACE FUNCTION create_user_organization()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id uuid;
    org_name text;
    user_name text;
BEGIN
    -- Extract user's name from metadata or email
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name', 
        split_part(NEW.email, '@', 1)
    );
    
    -- Generate organization name
    org_name := user_name || '''s Organization';
    
    -- Create organization for the new user
    INSERT INTO public.organizations (
        name, 
        owner_id, 
        plan_id,
        verification_status,
        current_businesses_count,
        current_ad_accounts_count,
        current_team_members_count,
        current_monthly_spend_cents
    )
    VALUES (
        org_name,
        NEW.id,
        'free', -- Start with free plan
        'pending',
        0,
        0,
        1, -- Owner is the first team member
        0
    )
    RETURNING id INTO new_org_id;
    
    -- Add user as owner to organization_members
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, NEW.id, 'owner');
    
    -- Create wallet for the organization
    INSERT INTO public.wallets (organization_id, balance_cents, currency)
    VALUES (new_org_id, 0, 'USD');
    
    -- Create user profile
    INSERT INTO public.profiles (
        id,
        full_name,
        avatar_url,
        updated_at
    )
    VALUES (
        NEW.id,
        user_name,
        NEW.raw_user_meta_data->>'avatar_url',
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create organization on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    WHEN (NEW.email IS NOT NULL) -- Only for real users, not system accounts
    EXECUTE FUNCTION create_user_organization();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_user_organization() TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_organization() TO anon;

-- Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON public.organizations(created_at);
CREATE INDEX IF NOT EXISTS idx_wallets_created_at ON public.wallets(created_at);

-- Add comment for documentation
COMMENT ON FUNCTION create_user_organization() IS 'Automatically creates organization, wallet, and profile when a new user signs up'; 
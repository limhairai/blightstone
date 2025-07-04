-- Fix remaining a.id references in triggers and functions
-- This addresses the "column a.id does not exist" error in asset binding

-- Fix BM account limits trigger
CREATE OR REPLACE FUNCTION check_bm_account_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_account_count INTEGER;
    bm_asset_id UUID;
    asset_type TEXT;
BEGIN
    -- Check if this is an ad account binding
    SELECT a.type INTO asset_type
    FROM asset a
    WHERE a.asset_id = NEW.asset_id;

    -- Only enforce limit for ad account bindings
    IF asset_type != 'ad_account' THEN
        RETURN NEW;
    END IF;

    -- Get the business manager asset_id from the binding
    SELECT ab.asset_id INTO bm_asset_id
    FROM asset_binding ab
    JOIN asset a ON ab.asset_id = a.asset_id
    WHERE ab.organization_id = NEW.organization_id 
    AND a.type = 'business_manager'
    AND ab.status = 'active'
    LIMIT 1;

    -- If no BM found, allow (this shouldn't happen in normal flow)
    IF bm_asset_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Count current ad accounts for this organization
    SELECT COUNT(*) INTO current_account_count
    FROM asset_binding ab
    JOIN asset a ON ab.asset_id = a.asset_id
    WHERE ab.organization_id = NEW.organization_id
    AND a.type = 'ad_account'
    AND ab.status = 'active';

    -- Check if adding this account would exceed 5 per BM
    -- Get number of active BMs for this org
    DECLARE
        active_bm_count INTEGER;
        max_allowed_accounts INTEGER;
    BEGIN
        SELECT COUNT(*) INTO active_bm_count
        FROM asset_binding ab
        JOIN asset a ON ab.asset_id = a.asset_id
        WHERE ab.organization_id = NEW.organization_id
        AND a.type = 'business_manager'
        AND ab.status = 'active';

        max_allowed_accounts := active_bm_count * 5;

        IF current_account_count >= max_allowed_accounts THEN
            RAISE EXCEPTION 'Maximum 5 ad accounts per business manager allowed. Current: % accounts, % BMs', 
                current_account_count, active_bm_count;
        END IF;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix subscription system plan limits function
CREATE OR REPLACE FUNCTION check_plan_limits(org_id UUID, limit_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    org_record RECORD;
    plan_record RECORD;
    current_count INTEGER;
BEGIN
    -- Get organization and plan data
    SELECT o.* INTO org_record
    FROM organizations o
    WHERE o.organization_id = org_id;
    
    SELECT p.* INTO plan_record
    FROM plans p
    WHERE p.plan_id = org_record.plan_id;
    
    -- Check specific limit type
    CASE limit_type
        WHEN 'team_members' THEN
            SELECT COUNT(*) INTO current_count 
            FROM organization_members 
            WHERE organization_id = org_id;
            
            RETURN (plan_record.max_team_members = -1 OR current_count < plan_record.max_team_members);
            
        WHEN 'businesses' THEN
            SELECT COUNT(*) INTO current_count 
            FROM asset_binding ab
            JOIN asset a ON ab.asset_id = a.asset_id
            WHERE ab.organization_id = org_id 
            AND a.type = 'business_manager'
            AND ab.status = 'active';
            
            RETURN (plan_record.max_businesses = -1 OR current_count < plan_record.max_businesses);
            
        WHEN 'ad_accounts' THEN
            SELECT COUNT(*) INTO current_count 
            FROM asset_binding ab
            JOIN asset a ON ab.asset_id = a.asset_id
            WHERE ab.organization_id = org_id 
            AND a.type = 'ad_account'
            AND ab.status = 'active';
            
            RETURN (plan_record.max_ad_accounts = -1 OR current_count < plan_record.max_ad_accounts);
            
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Fix admin policies that reference profiles.id instead of profiles.profile_id
DROP POLICY IF EXISTS "Admins can manage all topup requests" ON public.topup_requests;
CREATE POLICY "Admins can manage all topup requests" ON public.topup_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS enforce_bm_account_limit ON asset_binding;
CREATE TRIGGER enforce_bm_account_limit
    BEFORE INSERT OR UPDATE ON asset_binding
    FOR EACH ROW
    WHEN (NEW.status = 'active')
    EXECUTE FUNCTION check_bm_account_limit();

-- Add comment for documentation
COMMENT ON FUNCTION check_bm_account_limit() IS 'Enforces maximum 5 ad accounts per business manager using semantic IDs';
COMMENT ON FUNCTION check_plan_limits(uuid, text) IS 'Checks plan limits using semantic IDs for assets and profiles'; 
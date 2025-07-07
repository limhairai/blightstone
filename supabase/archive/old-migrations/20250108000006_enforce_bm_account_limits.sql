-- Enforce maximum 5 accounts per business manager
-- This prevents exceeding provider limits and maintains clean ratios

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
    WHERE a.id = NEW.asset_id;

    -- Only enforce limit for ad account bindings
    IF asset_type != 'ad_account' THEN
        RETURN NEW;
    END IF;

    -- Get the business manager asset_id from the binding
    SELECT ab.asset_id INTO bm_asset_id
    FROM asset_binding ab
    JOIN asset a ON ab.asset_id = a.id
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
    JOIN asset a ON ab.asset_id = a.id
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
        JOIN asset a ON ab.asset_id = a.id
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

-- Create trigger to enforce limit on ad account binding
DROP TRIGGER IF EXISTS enforce_bm_account_limit ON asset_binding;
CREATE TRIGGER enforce_bm_account_limit
    BEFORE INSERT OR UPDATE ON asset_binding
    FOR EACH ROW
    WHEN (NEW.status = 'active')
    EXECUTE FUNCTION check_bm_account_limit(); 
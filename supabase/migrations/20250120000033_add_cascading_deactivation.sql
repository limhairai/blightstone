-- Add cascading deactivation functionality
-- When a business manager is deactivated, all its ad accounts should also be deactivated

-- Create function to toggle asset activation with cascading support
CREATE OR REPLACE FUNCTION public.toggle_asset_activation_cascade(
    p_asset_id UUID,
    p_organization_id UUID,
    p_is_active BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
    binding_exists BOOLEAN;
    asset_type TEXT;
    bm_dolphin_id TEXT;
BEGIN
    -- Check if the binding exists and belongs to the organization
    SELECT EXISTS(
        SELECT 1 FROM asset_binding ab
        JOIN asset a ON ab.asset_id = a.asset_id
        WHERE ab.asset_id = p_asset_id 
        AND ab.organization_id = p_organization_id 
        AND ab.status = 'active'
    ) INTO binding_exists;
    
    IF NOT binding_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Get the asset type and dolphin_id
    SELECT a.type, a.dolphin_id INTO asset_type, bm_dolphin_id
    FROM asset a
    JOIN asset_binding ab ON a.asset_id = ab.asset_id
    WHERE ab.asset_id = p_asset_id 
    AND ab.organization_id = p_organization_id 
    AND ab.status = 'active';
    
    -- Update the activation status of the main asset
    UPDATE asset_binding 
    SET is_active = p_is_active,
        updated_at = NOW()
    WHERE asset_id = p_asset_id 
    AND organization_id = p_organization_id 
    AND status = 'active';
    
    -- If this is a business manager being deactivated, also deactivate all its ad accounts
    IF asset_type = 'business_manager' AND p_is_active = FALSE THEN
        UPDATE asset_binding 
        SET is_active = FALSE,
            updated_at = NOW()
        WHERE organization_id = p_organization_id 
        AND status = 'active'
        AND asset_id IN (
            SELECT a.asset_id 
            FROM asset a
            WHERE a.type = 'ad_account'
            AND a.metadata->>'business_manager_id' = bm_dolphin_id
        );
    END IF;
    
    -- If this is a business manager being activated, we DON'T automatically activate ad accounts
    -- This gives users more control - they can choose which ad accounts to reactivate
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.toggle_asset_activation_cascade(UUID, UUID, BOOLEAN) IS 'Toggle asset activation status with cascading support. When deactivating a business manager, also deactivates all its ad accounts.';

-- Update the API endpoint to use the new cascading function by default
-- The old function is still available for non-cascading operations if needed 
-- Fix ambiguous asset_id column reference in resolve_asset_names function
-- The issue is in the WHERE clause where asset_id is ambiguous

-- Drop and recreate the function with proper table aliases
DROP FUNCTION IF EXISTS public.resolve_asset_names(TEXT[]);

CREATE OR REPLACE FUNCTION public.resolve_asset_names(asset_ids TEXT[])
RETURNS JSONB AS $$
DECLARE
    result JSONB := '[]'::JSONB;
    asset_id_param TEXT;
    asset_record RECORD;
BEGIN
    -- Return empty array if no asset IDs provided
    IF asset_ids IS NULL OR array_length(asset_ids, 1) IS NULL THEN
        RETURN result;
    END IF;
    
    -- Loop through each asset ID and resolve its name
    FOREACH asset_id_param IN ARRAY asset_ids
    LOOP
        -- Try to find the asset in the asset table with proper table alias
        SELECT a.asset_id, a.name, a.type, a.dolphin_id
        INTO asset_record
        FROM public.asset a
        WHERE a.asset_id::TEXT = asset_id_param OR a.dolphin_id = asset_id_param;
        
        -- If found, add to result
        IF FOUND THEN
            result := result || jsonb_build_object(
                'id', asset_record.asset_id,
                'name', asset_record.name,
                'type', asset_record.type,
                'dolphin_id', asset_record.dolphin_id
            );
        ELSE
            -- If not found, add placeholder
            result := result || jsonb_build_object(
                'id', asset_id_param,
                'name', 'Unknown Asset',
                'type', 'unknown',
                'dolphin_id', asset_id_param
            );
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.resolve_asset_names TO authenticated; 
-- Add subscription management and data retention system

-- Add subscription status and retention fields to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'suspended', 'grace_period')),
ADD COLUMN IF NOT EXISTS subscription_cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_retention_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS previous_plan_id TEXT,
ADD COLUMN IF NOT EXISTS downgrade_scheduled_at TIMESTAMPTZ;

-- Add usage tracking to asset_binding for smart deactivation
ALTER TABLE public.asset_binding
ADD COLUMN IF NOT EXISTS last_topup_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_topup_amount_cents BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMPTZ DEFAULT NOW();

-- Create function to calculate data retention period based on plan
CREATE OR REPLACE FUNCTION public.calculate_data_retention_period(plan_id TEXT)
RETURNS INTERVAL AS $$
BEGIN
    RETURN CASE 
        WHEN plan_id = 'starter' THEN INTERVAL '7 days'
        WHEN plan_id = 'growth' THEN INTERVAL '30 days'
        WHEN plan_id = 'scale' THEN INTERVAL '90 days'
        WHEN plan_id = 'enterprise' THEN INTERVAL '180 days'
        ELSE INTERVAL '7 days' -- Default fallback
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to handle subscription cancellation
CREATE OR REPLACE FUNCTION public.handle_subscription_cancellation(
    p_organization_id UUID,
    p_cancelled_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_plan TEXT;
    v_retention_period INTERVAL;
BEGIN
    -- Get current plan
    SELECT plan_id INTO v_current_plan
    FROM public.organizations
    WHERE organization_id = p_organization_id;
    
    -- Calculate retention period
    v_retention_period := public.calculate_data_retention_period(v_current_plan);
    
    -- Update organization status
    UPDATE public.organizations
    SET 
        subscription_status = 'grace_period',
        subscription_cancelled_at = p_cancelled_at,
        data_retention_until = p_cancelled_at + v_retention_period,
        updated_at = NOW()
    WHERE organization_id = p_organization_id;
    
    -- Deactivate all assets immediately
    UPDATE public.asset_binding
    SET 
        is_active = FALSE,
        updated_at = NOW()
    WHERE organization_id = p_organization_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get assets for deactivation during downgrade
CREATE OR REPLACE FUNCTION public.get_assets_for_deactivation(
    p_organization_id UUID,
    p_asset_type TEXT, -- 'business_manager' or 'ad_account'
    p_count_to_deactivate INTEGER
)
RETURNS TABLE (
    asset_id UUID,
    name TEXT,
    last_topup_date TIMESTAMPTZ,
    total_topup_amount_cents BIGINT,
    last_activity_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.asset_id,
        a.name,
        ab.last_topup_date,
        ab.total_topup_amount_cents,
        ab.last_activity_date
    FROM public.asset_binding ab
    JOIN public.asset a ON ab.asset_id = a.asset_id
    WHERE ab.organization_id = p_organization_id
      AND a.type = p_asset_type
      AND ab.is_active = TRUE
    ORDER BY 
        ab.last_topup_date ASC NULLS FIRST,
        ab.total_topup_amount_cents ASC,
        ab.last_activity_date ASC
    LIMIT p_count_to_deactivate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle plan downgrade
CREATE OR REPLACE FUNCTION public.handle_plan_downgrade(
    p_organization_id UUID,
    p_new_plan_id TEXT,
    p_downgrade_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_plan TEXT;
    v_current_bm_count INTEGER;
    v_current_account_count INTEGER;
    v_new_bm_limit INTEGER;
    v_new_account_limit INTEGER;
    v_bm_to_deactivate INTEGER;
    v_accounts_to_deactivate INTEGER;
    v_asset_record RECORD;
BEGIN
    -- Get current plan and counts
    SELECT plan_id INTO v_current_plan
    FROM public.organizations
    WHERE organization_id = p_organization_id;
    
    -- Get current active asset counts
    SELECT 
        COUNT(CASE WHEN a.type = 'business_manager' THEN 1 END),
        COUNT(CASE WHEN a.type = 'ad_account' THEN 1 END)
    INTO v_current_bm_count, v_current_account_count
    FROM public.asset_binding ab
    JOIN public.asset a ON ab.asset_id = a.asset_id
    WHERE ab.organization_id = p_organization_id AND ab.is_active = TRUE;
    
    -- Get new plan limits
    SELECT max_businesses, max_ad_accounts
    INTO v_new_bm_limit, v_new_account_limit
    FROM public.plans
    WHERE plan_id = p_new_plan_id;
    
    -- Calculate how many assets to deactivate
    v_bm_to_deactivate := GREATEST(0, v_current_bm_count - v_new_bm_limit);
    v_accounts_to_deactivate := GREATEST(0, v_current_account_count - v_new_account_limit);
    
    -- Update organization with new plan
    UPDATE public.organizations
    SET 
        previous_plan_id = v_current_plan,
        plan_id = p_new_plan_id,
        downgrade_scheduled_at = p_downgrade_date,
        updated_at = NOW()
    WHERE organization_id = p_organization_id;
    
    -- Deactivate excess business managers
    IF v_bm_to_deactivate > 0 THEN
        FOR v_asset_record IN
            SELECT asset_id FROM public.get_assets_for_deactivation(
                p_organization_id, 'business_manager', v_bm_to_deactivate
            )
        LOOP
            UPDATE public.asset_binding
            SET is_active = FALSE, updated_at = NOW()
            WHERE asset_id = v_asset_record.asset_id;
        END LOOP;
    END IF;
    
    -- Deactivate excess ad accounts
    IF v_accounts_to_deactivate > 0 THEN
        FOR v_asset_record IN
            SELECT asset_id FROM public.get_assets_for_deactivation(
                p_organization_id, 'ad_account', v_accounts_to_deactivate
            )
        LOOP
            UPDATE public.asset_binding
            SET is_active = FALSE, updated_at = NOW()
            WHERE asset_id = v_asset_record.asset_id;
        END LOOP;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to permanently delete expired organizations
CREATE OR REPLACE FUNCTION public.cleanup_expired_organizations()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER := 0;
    v_org_record RECORD;
BEGIN
    -- Find organizations past their retention period
    FOR v_org_record IN
        SELECT organization_id, name
        FROM public.organizations
        WHERE subscription_status = 'grace_period'
          AND data_retention_until < NOW()
    LOOP
        -- Archive historical data (transactions, tickets, etc.)
        -- This is a soft delete - we keep the org but mark it as deleted
        UPDATE public.organizations
        SET 
            subscription_status = 'deleted',
            name = 'DELETED_' || v_org_record.organization_id::TEXT,
            updated_at = NOW()
        WHERE organization_id = v_org_record.organization_id;
        
        -- Permanently deactivate all assets
        UPDATE public.asset_binding
        SET is_active = FALSE, updated_at = NOW()
        WHERE organization_id = v_org_record.organization_id;
        
        v_deleted_count := v_deleted_count + 1;
    END LOOP;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_topup_date when topup requests are completed
CREATE OR REPLACE FUNCTION public.update_asset_topup_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update on completed topups
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE public.asset_binding
        SET 
            last_topup_date = NOW(),
            total_topup_amount_cents = COALESCE(total_topup_amount_cents, 0) + NEW.amount_cents,
            last_activity_date = NOW()
        WHERE asset_id = NEW.ad_account_id::UUID; -- Assuming ad_account_id is stored as text
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for topup stats
DROP TRIGGER IF EXISTS update_asset_topup_stats_trigger ON public.topup_requests;
CREATE TRIGGER update_asset_topup_stats_trigger
    AFTER UPDATE ON public.topup_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_asset_topup_stats();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_subscription_cancellation TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_plan_downgrade TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_assets_for_deactivation TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_organizations TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_data_retention_period TO authenticated;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON public.organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_data_retention_until ON public.organizations(data_retention_until);
CREATE INDEX IF NOT EXISTS idx_asset_binding_last_topup_date ON public.asset_binding(last_topup_date);
CREATE INDEX IF NOT EXISTS idx_asset_binding_total_topup_amount ON public.asset_binding(total_topup_amount_cents); 
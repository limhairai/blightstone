-- ============================================================================
-- DOLPHIN CLOUD INTEGRATION TABLES
-- This migration creates all tables needed for Dolphin Cloud asset management
-- ============================================================================

-- Dolphin assets table (stores Facebook assets from Dolphin API)
CREATE TABLE IF NOT EXISTS public.dolphin_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_type TEXT NOT NULL CHECK (asset_type IN ('business_manager', 'ad_account', 'profile')),
    asset_id TEXT NOT NULL, -- Facebook asset ID
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'restricted', 'suspended')),
    health_status TEXT DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'warning', 'critical')),
    parent_business_manager_id TEXT, -- For ad accounts under business managers
    asset_metadata JSONB DEFAULT '{}', -- Store additional Dolphin API data
    spend_limit_cents INTEGER,
    current_spend_cents INTEGER DEFAULT 0,
    daily_spend_limit_cents INTEGER,
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique asset_id per asset_type
    UNIQUE(asset_type, asset_id)
);

-- Client asset bindings table (links assets to organizations/businesses)  
CREATE TABLE IF NOT EXISTS public.client_asset_bindings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES public.dolphin_assets(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    spend_limit_cents INTEGER NOT NULL DEFAULT 500000, -- $5000 default
    fee_percentage DECIMAL(5,2) DEFAULT 5.00, -- 5% default fee
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    bound_at TIMESTAMPTZ DEFAULT NOW(),
    bound_by UUID REFERENCES auth.users(id), -- Admin who created the binding
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one active binding per asset
    UNIQUE(asset_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Dolphin API sync logs table (track sync operations)
CREATE TABLE IF NOT EXISTS public.dolphin_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type TEXT NOT NULL CHECK (sync_type IN ('discover', 'update', 'health_check')),
    status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
    assets_discovered INTEGER DEFAULT 0,
    assets_updated INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    error_details JSONB,
    sync_duration_ms INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset spend tracking table (track daily/monthly spend per asset)
CREATE TABLE IF NOT EXISTS public.asset_spend_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES public.dolphin_assets(id) ON DELETE CASCADE,
    binding_id UUID REFERENCES public.client_asset_bindings(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    spend_cents INTEGER DEFAULT 0,
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one record per asset per date
    UNIQUE(asset_id, date)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_dolphin_assets_asset_type ON public.dolphin_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_dolphin_assets_status ON public.dolphin_assets(status);
CREATE INDEX IF NOT EXISTS idx_dolphin_assets_asset_id ON public.dolphin_assets(asset_id);
CREATE INDEX IF NOT EXISTS idx_dolphin_assets_parent_bm ON public.dolphin_assets(parent_business_manager_id);
CREATE INDEX IF NOT EXISTS idx_dolphin_assets_last_sync ON public.dolphin_assets(last_sync_at);

CREATE INDEX IF NOT EXISTS idx_client_asset_bindings_asset_id ON public.client_asset_bindings(asset_id);
CREATE INDEX IF NOT EXISTS idx_client_asset_bindings_organization_id ON public.client_asset_bindings(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_asset_bindings_business_id ON public.client_asset_bindings(business_id);
CREATE INDEX IF NOT EXISTS idx_client_asset_bindings_status ON public.client_asset_bindings(status);

CREATE INDEX IF NOT EXISTS idx_dolphin_sync_logs_status ON public.dolphin_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_dolphin_sync_logs_sync_type ON public.dolphin_sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_dolphin_sync_logs_started_at ON public.dolphin_sync_logs(started_at);

CREATE INDEX IF NOT EXISTS idx_asset_spend_tracking_asset_id ON public.asset_spend_tracking(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_spend_tracking_date ON public.asset_spend_tracking(date);
CREATE INDEX IF NOT EXISTS idx_asset_spend_tracking_binding_id ON public.asset_spend_tracking(binding_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE TRIGGER set_timestamp_dolphin_assets
    BEFORE UPDATE ON public.dolphin_assets
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER set_timestamp_client_asset_bindings
    BEFORE UPDATE ON public.client_asset_bindings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER set_timestamp_asset_spend_tracking
    BEFORE UPDATE ON public.asset_spend_tracking
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- FUNCTIONS FOR DOLPHIN INTEGRATION
-- ============================================================================

-- Function to get unassigned assets
CREATE OR REPLACE FUNCTION public.get_unassigned_dolphin_assets(
    p_asset_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    asset_type TEXT,
    asset_id TEXT,
    name TEXT,
    status TEXT,
    health_status TEXT,
    parent_business_manager_id TEXT,
    asset_metadata JSONB,
    discovered_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        da.id,
        da.asset_type,
        da.asset_id,
        da.name,
        da.status,
        da.health_status,
        da.parent_business_manager_id,
        da.asset_metadata,
        da.discovered_at,
        da.last_sync_at
    FROM public.dolphin_assets da
    LEFT JOIN public.client_asset_bindings cab ON da.id = cab.asset_id AND cab.status = 'active'
    WHERE cab.id IS NULL
    AND (p_asset_type IS NULL OR da.asset_type = p_asset_type)
    ORDER BY da.discovered_at DESC;
END;
$$;

-- Function to get asset binding details
CREATE OR REPLACE FUNCTION public.get_asset_binding_details(p_asset_id UUID)
RETURNS TABLE (
    binding_id UUID,
    organization_name TEXT,
    business_name TEXT,
    spend_limit_cents INTEGER,
    fee_percentage DECIMAL,
    bound_at TIMESTAMPTZ,
    current_spend_cents INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cab.id as binding_id,
        o.name as organization_name,
        b.name as business_name,
        cab.spend_limit_cents,
        cab.fee_percentage,
        cab.bound_at,
        COALESCE(SUM(ast.spend_cents), 0)::INTEGER as current_spend_cents
    FROM public.client_asset_bindings cab
    JOIN public.organizations o ON cab.organization_id = o.id
    LEFT JOIN public.businesses b ON cab.business_id = b.id
    LEFT JOIN public.asset_spend_tracking ast ON cab.id = ast.binding_id
        AND ast.date >= DATE_TRUNC('month', CURRENT_DATE)
    WHERE cab.asset_id = p_asset_id
    AND cab.status = 'active'
    GROUP BY cab.id, o.name, b.name, cab.spend_limit_cents, cab.fee_percentage, cab.bound_at;
END;
$$; 
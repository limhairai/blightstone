-- Dolphin Asset Binding System Migration
-- Adds tables for managing Dolphin Cloud asset discovery and client assignments

-- Master registry of all assets discovered from Dolphin Cloud
CREATE TABLE dolphin_assets (
    id TEXT PRIMARY KEY DEFAULT ('dolphin_' || substr(md5(random()::text), 1, 12)),
    
    -- Asset Type
    asset_type TEXT NOT NULL CHECK (asset_type IN ('business_manager', 'ad_account', 'profile')),
    
    -- Facebook/Dolphin IDs
    facebook_id TEXT NOT NULL UNIQUE, -- FB BM ID or Ad Account ID
    dolphin_profile_id TEXT NOT NULL, -- Which Dolphin profile manages this
    dolphin_team_id TEXT, -- Team within profile
    
    -- Asset Details
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'restricted', 'suspended')),
    
    -- Hierarchy (for ad accounts)
    parent_business_manager_id TEXT, -- Links ad accounts to BMs
    
    -- Assignment Status
    is_assigned BOOLEAN DEFAULT FALSE,
    assigned_to_organization_id UUID REFERENCES organizations(id),
    assigned_to_business_id UUID REFERENCES businesses(id),
    assigned_at TIMESTAMPTZ,
    assigned_by TEXT, -- Admin user ID
    
    -- Sync & Health
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ,
    health_status TEXT DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'warning', 'critical')),
    sync_errors JSONB,
    
    -- Metadata from Dolphin Cloud
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Binding configuration between clients and their assigned Dolphin assets
CREATE TABLE client_asset_bindings (
    id TEXT PRIMARY KEY DEFAULT ('binding_' || substr(md5(random()::text), 1, 12)),
    
    -- Client Info
    organization_id UUID NOT NULL REFERENCES organizations(id),
    business_id UUID REFERENCES businesses(id),
    
    -- Asset Assignment
    dolphin_asset_id TEXT NOT NULL REFERENCES dolphin_assets(id),
    
    -- Permissions & Limits
    permissions JSONB DEFAULT '{
        "can_view_insights": true,
        "can_create_campaigns": false,
        "can_edit_budgets": false,
        "can_manage_pages": false,
        "can_access_audiences": false
    }'::jsonb,
    
    -- Spend Limits (your controls based on client payments)
    spend_limits JSONB DEFAULT '{
        "daily": 0,
        "monthly": 0,
        "total": 0
    }'::jsonb,
    
    -- Client Top-up Tracking
    client_topped_up_total DECIMAL(12,2) DEFAULT 0.00, -- Total client has paid you
    your_fee_percentage DECIMAL(5,4) DEFAULT 0.0500, -- Your fee (5%)
    
    -- Assignment Details
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by TEXT NOT NULL, -- Admin user ID
    notes TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    deactivated_at TIMESTAMPTZ,
    deactivated_by TEXT,
    deactivation_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track synchronization events with Dolphin Cloud
CREATE TABLE dolphin_sync_logs (
    id TEXT PRIMARY KEY DEFAULT ('sync_' || substr(md5(random()::text), 1, 12)),
    
    -- Sync Details
    sync_type TEXT NOT NULL CHECK (sync_type IN ('full_discovery', 'asset_update', 'spend_sync')),
    dolphin_profile_id TEXT,
    assets_discovered INTEGER DEFAULT 0,
    assets_updated INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    
    -- Results
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'partial', 'failed')),
    sync_data JSONB, -- Store sync results
    error_details JSONB,
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds DECIMAL(10,3),
    
    -- Triggered by
    triggered_by TEXT CHECK (triggered_by IN ('admin', 'cron', 'webhook')),
    triggered_by_user_id TEXT
);

-- Track client spending and top-ups for accurate budget calculations
CREATE TABLE client_spend_tracking (
    id TEXT PRIMARY KEY DEFAULT ('spend_' || substr(md5(random()::text), 1, 12)),
    
    -- Client & Asset
    organization_id UUID NOT NULL REFERENCES organizations(id),
    business_id UUID REFERENCES businesses(id),
    dolphin_asset_id TEXT NOT NULL REFERENCES dolphin_assets(id),
    facebook_account_id TEXT NOT NULL, -- FB Ad Account ID
    
    -- Financial Data
    amount_spent DECIMAL(12,2) DEFAULT 0.00, -- From Dolphin Cloud
    spend_limit DECIMAL(12,2) DEFAULT 0.00, -- Your imposed limit
    client_balance DECIMAL(12,2) DEFAULT 0.00, -- Calculated remaining budget
    
    -- Top-up History
    total_topped_up DECIMAL(12,2) DEFAULT 0.00, -- Total client payments
    fee_collected DECIMAL(12,2) DEFAULT 0.00, -- Your fees collected
    
    -- Sync Data
    last_dolphin_sync TIMESTAMPTZ,
    daily_spend_average DECIMAL(10,2) DEFAULT 0.00,
    days_remaining_estimate DECIMAL(8,2),
    
    -- Timestamps
    date DATE DEFAULT CURRENT_DATE, -- Daily tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one record per asset per day
    UNIQUE(dolphin_asset_id, date)
);

-- Indexes for performance
CREATE INDEX idx_dolphin_assets_facebook_id ON dolphin_assets(facebook_id);
CREATE INDEX idx_dolphin_assets_asset_type ON dolphin_assets(asset_type);
CREATE INDEX idx_dolphin_assets_is_assigned ON dolphin_assets(is_assigned);
CREATE INDEX idx_dolphin_assets_assigned_org ON dolphin_assets(assigned_to_organization_id);

CREATE INDEX idx_client_bindings_org ON client_asset_bindings(organization_id);
CREATE INDEX idx_client_bindings_business ON client_asset_bindings(business_id);
CREATE INDEX idx_client_bindings_asset ON client_asset_bindings(dolphin_asset_id);
CREATE INDEX idx_client_bindings_active ON client_asset_bindings(is_active);

CREATE INDEX idx_sync_logs_type ON dolphin_sync_logs(sync_type);
CREATE INDEX idx_sync_logs_status ON dolphin_sync_logs(status);
CREATE INDEX idx_sync_logs_started ON dolphin_sync_logs(started_at);

CREATE INDEX idx_spend_tracking_org ON client_spend_tracking(organization_id);
CREATE INDEX idx_spend_tracking_asset ON client_spend_tracking(dolphin_asset_id);
CREATE INDEX idx_spend_tracking_date ON client_spend_tracking(date);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dolphin_assets_updated_at 
    BEFORE UPDATE ON dolphin_assets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_asset_bindings_updated_at 
    BEFORE UPDATE ON client_asset_bindings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_spend_tracking_updated_at 
    BEFORE UPDATE ON client_spend_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE dolphin_assets IS 'Master registry of all Facebook assets discovered from Dolphin Cloud profiles';
COMMENT ON TABLE client_asset_bindings IS 'Configuration for assigning Dolphin assets to specific clients with permissions and limits';
COMMENT ON TABLE dolphin_sync_logs IS 'Audit log of synchronization events with Dolphin Cloud API';
COMMENT ON TABLE client_spend_tracking IS 'Daily tracking of client spending and budget calculations per asset';

COMMENT ON COLUMN dolphin_assets.facebook_id IS 'Facebook Business Manager ID or Ad Account ID from Dolphin Cloud';
COMMENT ON COLUMN dolphin_assets.dolphin_profile_id IS 'Which Dolphin profile/team manages this asset';
COMMENT ON COLUMN client_asset_bindings.permissions IS 'JSON object defining what the client can do with this asset';
COMMENT ON COLUMN client_asset_bindings.spend_limits IS 'JSON object with daily/monthly/total spend limits you control';
COMMENT ON COLUMN client_asset_bindings.your_fee_percentage IS 'Your fee percentage (e.g., 0.05 for 5%)';
COMMENT ON COLUMN client_spend_tracking.client_balance IS 'Calculated as: (client_topped_up * (1 - fee_percentage)) - amount_spent'; 
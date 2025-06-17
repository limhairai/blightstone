-- Organization to Business Manager Mapping
-- This table maps Supabase organizations to Dolphin Cloud Business Manager IDs

CREATE TABLE IF NOT EXISTS organization_business_managers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    business_manager_id TEXT NOT NULL, -- Dolphin Cloud BM ID (e.g., "1760514248108495")
    business_manager_name TEXT, -- Human readable name (e.g., "Client ABC - BM 1")
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one BM can only belong to one organization
    UNIQUE(business_manager_id)
);

-- Telegram Group to Organization Mapping
-- This table maps Telegram group IDs to organizations for group-specific data access
CREATE TABLE IF NOT EXISTS organization_telegram_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    telegram_group_id BIGINT NOT NULL, -- Telegram group chat ID
    group_name TEXT, -- Human readable group name
    group_type TEXT DEFAULT 'group', -- 'group', 'supergroup', 'channel'
    is_active BOOLEAN DEFAULT true,
    added_by_user_id UUID REFERENCES profiles(id), -- Admin who added the group
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one group can only belong to one organization
    UNIQUE(telegram_group_id)
);

-- Add RLS (Row Level Security)
ALTER TABLE organization_business_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_telegram_groups ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see BMs for organizations they belong to
CREATE POLICY "Users can view org BMs they belong to" ON organization_business_managers
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Only org owners/admins can manage BM mappings
CREATE POLICY "Org admins can manage BMs" ON organization_business_managers
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Policy: Users can only see groups for organizations they belong to
CREATE POLICY "Users can view org groups they belong to" ON organization_telegram_groups
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Only org owners/admins can manage group mappings
CREATE POLICY "Org admins can manage groups" ON organization_telegram_groups
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Add indexes for performance
CREATE INDEX idx_org_bm_org_id ON organization_business_managers(organization_id);
CREATE INDEX idx_org_bm_bm_id ON organization_business_managers(business_manager_id);
CREATE INDEX idx_org_groups_org_id ON organization_telegram_groups(organization_id);
CREATE INDEX idx_org_groups_tg_id ON organization_telegram_groups(telegram_group_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_org_bm_updated_at 
    BEFORE UPDATE ON organization_business_managers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_groups_updated_at 
    BEFORE UPDATE ON organization_telegram_groups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
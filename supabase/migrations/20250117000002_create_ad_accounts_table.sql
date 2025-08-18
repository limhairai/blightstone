-- Create ad_accounts table for tracking ad accounts per project

CREATE TABLE IF NOT EXISTS ad_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    business_manager TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add ad_account_id column to creatives table
ALTER TABLE creatives 
ADD COLUMN IF NOT EXISTS ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ad_accounts_project_id ON ad_accounts(project_id);
CREATE INDEX IF NOT EXISTS idx_creatives_ad_account_id ON creatives(ad_account_id);

-- Add updated_at trigger for ad_accounts
CREATE TRIGGER update_ad_accounts_updated_at BEFORE UPDATE ON ad_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ad_accounts
CREATE POLICY "Users can view ad accounts from their projects" ON ad_accounts
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert ad accounts to their projects" ON ad_accounts
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update ad accounts from their projects" ON ad_accounts
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete ad accounts from their projects" ON ad_accounts
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );
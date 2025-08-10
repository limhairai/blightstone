-- Create top_ads table for tracking high-performing ads
CREATE TABLE IF NOT EXISTS top_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Basic Ad Info
    ad_title TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'google', 'tiktok', 'youtube', 'linkedin', 'twitter', 'other')),
    campaign_name TEXT,
    ad_set_name TEXT,
    
    -- Performance Metrics
    spend DECIMAL(10,2),
    revenue DECIMAL(10,2),
    roas DECIMAL(8,2), -- Return on Ad Spend
    ctr DECIMAL(5,2), -- Click Through Rate (%)
    cpm DECIMAL(8,2), -- Cost Per Mille
    conversion_rate DECIMAL(5,2), -- Conversion Rate (%)
    cost_per_conversion DECIMAL(8,2),
    impressions INTEGER,
    clicks INTEGER,
    conversions INTEGER,
    
    -- Time Period
    performance_start_date DATE,
    performance_end_date DATE,
    
    -- Creative Details
    ad_copy TEXT,
    headline TEXT,
    call_to_action TEXT,
    creative_url TEXT, -- Link to image/video
    landing_page_url TEXT,
    
    -- Strategy & Analysis
    angle TEXT, -- The hook/angle used
    target_audience TEXT,
    placement TEXT, -- Feed, Stories, etc.
    objective TEXT, -- Awareness, Conversion, etc.
    
    -- Insights
    notes TEXT,
    why_it_worked TEXT,
    key_insights TEXT,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_top_ads_project_id ON top_ads(project_id);
CREATE INDEX IF NOT EXISTS idx_top_ads_created_by ON top_ads(created_by);
CREATE INDEX IF NOT EXISTS idx_top_ads_platform ON top_ads(platform);
CREATE INDEX IF NOT EXISTS idx_top_ads_roas ON top_ads(roas DESC);
CREATE INDEX IF NOT EXISTS idx_top_ads_created_at ON top_ads(created_at DESC);

-- Enable Row Level Security
ALTER TABLE top_ads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view top_ads for their projects" ON top_ads
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert top_ads for their projects" ON top_ads
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
        AND created_by = auth.email()
    );

CREATE POLICY "Users can update their own top_ads" ON top_ads
    FOR UPDATE USING (created_by = auth.email());

CREATE POLICY "Users can delete their own top_ads" ON top_ads
    FOR DELETE USING (created_by = auth.email());

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_top_ads_updated_at BEFORE UPDATE ON top_ads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
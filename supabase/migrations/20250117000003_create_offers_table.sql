-- Create offers table for tracking offers per project

CREATE TABLE IF NOT EXISTS offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price TEXT NOT NULL, -- Store as text to allow formats like "$99", "€50", "Free"
    url TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add offer_id column to creatives table
ALTER TABLE creatives 
ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES offers(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_offers_project_id ON offers(project_id);
CREATE INDEX IF NOT EXISTS idx_creatives_offer_id ON creatives(offer_id);

-- Add updated_at trigger for offers
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for offers
CREATE POLICY "Users can view offers from their projects" ON offers
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert offers to their projects" ON offers
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update offers from their projects" ON offers
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete offers from their projects" ON offers
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );
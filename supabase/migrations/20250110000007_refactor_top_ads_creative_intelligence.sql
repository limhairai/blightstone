-- Refactor top_ads table to focus on creative intelligence and Facebook-only
-- Drop the existing table and recreate with better structure
DROP TABLE IF EXISTS top_ads CASCADE;

-- Create the new creative_intelligence table (renamed from top_ads)
CREATE TABLE IF NOT EXISTS creative_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Basic Creative Info
    title TEXT NOT NULL, -- Creative title/name
    platform TEXT DEFAULT 'facebook' CHECK (platform = 'facebook'), -- Facebook only for now
    
    -- Creative Assets (direct upload, not links)
    image_url TEXT, -- Uploaded image URL
    video_url TEXT, -- Uploaded video URL  
    creative_type TEXT CHECK (creative_type IN ('image', 'video', 'carousel')) DEFAULT 'image',
    
    -- Creative Content
    headline TEXT,
    primary_copy TEXT, -- Main ad copy
    hook TEXT, -- Opening hook/first line
    call_to_action TEXT,
    
    -- Creative Intelligence - The Core Value
    concept TEXT, -- The core concept/idea
    angle TEXT, -- Psychological angle (pain, aspiration, fear, etc.)
    hook_pattern TEXT, -- Type of hook (problem/solution, curiosity, social proof, etc.)
    visual_style TEXT, -- Visual approach (lifestyle, product demo, before/after, UGC, etc.)
    target_emotion TEXT, -- What emotion does it trigger?
    
    -- Creative Categories for Organization
    creative_category TEXT CHECK (creative_category IN (
        'hook_library',      -- Proven opening hooks
        'winning_angles',    -- Successful psychological angles  
        'concept_gold',      -- Core winning concepts
        'script_templates',  -- Video script structures
        'headline_formulas', -- Proven headline patterns
        'visual_patterns'    -- Successful visual approaches
    )) DEFAULT 'concept_gold',
    
    -- Performance Context (optional, team discretion)
    performance_notes TEXT, -- Why this worked, context
    
    -- Systematic Thinking
    psychology_trigger TEXT, -- What psychological principle does this use?
    scalability_notes TEXT, -- How can this concept be scaled/varied?
    remix_potential TEXT, -- How can this be combined with other concepts?
    
    -- Metadata
    tags TEXT[], -- Flexible tagging system
    is_template BOOLEAN DEFAULT false, -- Is this a reusable template?
    template_variables TEXT, -- What parts can be customized?
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'template'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_creative_intelligence_project_id ON creative_intelligence(project_id);
CREATE INDEX IF NOT EXISTS idx_creative_intelligence_created_by ON creative_intelligence(created_by);
CREATE INDEX IF NOT EXISTS idx_creative_intelligence_category ON creative_intelligence(creative_category);
CREATE INDEX IF NOT EXISTS idx_creative_intelligence_angle ON creative_intelligence(angle);
CREATE INDEX IF NOT EXISTS idx_creative_intelligence_hook_pattern ON creative_intelligence(hook_pattern);
CREATE INDEX IF NOT EXISTS idx_creative_intelligence_tags ON creative_intelligence USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_creative_intelligence_created_at ON creative_intelligence(created_at DESC);

-- Enable Row Level Security
ALTER TABLE creative_intelligence ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view creative_intelligence for their projects" ON creative_intelligence
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert creative_intelligence for their projects" ON creative_intelligence
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
        AND created_by = auth.email()
    );

CREATE POLICY "Users can update their own creative_intelligence" ON creative_intelligence
    FOR UPDATE USING (created_by = auth.email());

CREATE POLICY "Users can delete their own creative_intelligence" ON creative_intelligence
    FOR DELETE USING (created_by = auth.email());

-- Add trigger for updated_at
CREATE TRIGGER update_creative_intelligence_updated_at BEFORE UPDATE ON creative_intelligence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for easy querying by category
CREATE OR REPLACE VIEW creative_library AS
SELECT 
    ci.*,
    p.name as project_name
FROM creative_intelligence ci
JOIN projects p ON ci.project_id = p.id
ORDER BY ci.created_at DESC;
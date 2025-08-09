-- ============================================================================
-- BLIGHTSTONE CRM DATABASE SETUP (FIXED VERSION)
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to create all CRM tables
-- ============================================================================

-- First, let's check if auth schema exists and create tables without foreign keys initially
-- Create projects table (without foreign key constraint initially)
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    user_id UUID NOT NULL,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'completed', 'blocked')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assignee TEXT,
    due_date DATE,
    category TEXT,
    notes TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    links JSONB DEFAULT '[]'::jsonb,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create personas table
CREATE TABLE IF NOT EXISTS personas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    age_gender_location TEXT,
    daily_struggles TEXT,
    desired_characteristics TEXT,
    desired_social_status TEXT,
    product_help_achieve_status TEXT,
    beliefs_to_overcome TEXT,
    failed_solutions TEXT,
    market_awareness TEXT,
    market_sophistication TEXT,
    insecurities TEXT,
    mindset TEXT,
    deeper_pain_points TEXT,
    hidden_specific_desires TEXT,
    objections TEXT,
    angle TEXT,
    domino_statement TEXT,
    notes TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create competitors table
CREATE TABLE IF NOT EXISTS competitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    website_url TEXT,
    ad_library_link TEXT,
    market TEXT,
    offer_url TEXT,
    traffic_volume TEXT,
    level TEXT DEFAULT 'medium' CHECK (level IN ('poor', 'medium', 'high')),
    notes TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create creatives table
CREATE TABLE IF NOT EXISTS creatives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in-review', 'live', 'paused', 'completed')),
    launch_date DATE,
    ad_concept TEXT,
    test_hypothesis TEXT,
    ad_type TEXT,
    ad_variable TEXT,
    desire TEXT,
    benefit TEXT,
    objections TEXT,
    persona TEXT,
    hook_pattern TEXT,
    results TEXT,
    winning_ad_link TEXT,
    brief_link TEXT,
    drive_link TEXT,
    notes TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_personas_project_id ON personas(project_id);
CREATE INDEX IF NOT EXISTS idx_competitors_project_id ON competitors(project_id);
CREATE INDEX IF NOT EXISTS idx_creatives_project_id ON creatives(project_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competitors_updated_at BEFORE UPDATE ON competitors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creatives_updated_at BEFORE UPDATE ON creatives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE creatives ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Projects: Users can only access their own projects
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Tasks: Users can only access tasks from their projects
CREATE POLICY "Users can view tasks from their projects" ON tasks
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert tasks to their projects" ON tasks
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update tasks from their projects" ON tasks
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tasks from their projects" ON tasks
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Personas: Users can only access personas from their projects
CREATE POLICY "Users can view personas from their projects" ON personas
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert personas to their projects" ON personas
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update personas from their projects" ON personas
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete personas from their projects" ON personas
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Competitors: Users can only access competitors from their projects
CREATE POLICY "Users can view competitors from their projects" ON competitors
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert competitors to their projects" ON competitors
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update competitors from their projects" ON competitors
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete competitors from their projects" ON competitors
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Creatives: Users can only access creatives from their projects
CREATE POLICY "Users can view creatives from their projects" ON creatives
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert creatives to their projects" ON creatives
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update creatives from their projects" ON creatives
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete creatives from their projects" ON creatives
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Your Blightstone CRM database is now ready!
-- 
-- Next steps:
-- 1. The app will now use real database instead of mock data
-- 2. All data will be persisted and secure
-- 3. Each user can only see their own projects and data
-- 
-- Tables created:
-- ✅ projects - Core project management
-- ✅ tasks - Task management with attachments/links
-- ✅ personas - Customer avatar tracking
-- ✅ competitors - Competitor analysis
-- ✅ creatives - Creative campaign management
-- 
-- Security features:
-- ✅ Row Level Security enabled
-- ✅ User data isolation
-- ✅ Proper foreign key relationships
-- ✅ Audit trails with created_by fields
-- ============================================================================
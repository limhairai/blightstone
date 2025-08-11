-- Update RLS policies for shared data system
-- Since we converted to shared data, all authenticated users should be able to access all data

-- Drop existing restrictive policies and create shared access policies

-- Tasks table policies
DROP POLICY IF EXISTS "Users can view tasks in their projects" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in their projects" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks in their projects" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their projects" ON tasks;

-- Create shared policies for tasks
CREATE POLICY "Authenticated users can view all tasks" ON tasks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create tasks" ON tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all tasks" ON tasks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all tasks" ON tasks
    FOR DELETE USING (auth.role() = 'authenticated');

-- Personas table policies
DROP POLICY IF EXISTS "Users can view personas in their projects" ON personas;
DROP POLICY IF EXISTS "Users can create personas in their projects" ON personas;
DROP POLICY IF EXISTS "Users can update personas in their projects" ON personas;
DROP POLICY IF EXISTS "Users can delete personas in their projects" ON personas;

-- Create shared policies for personas
CREATE POLICY "Authenticated users can view all personas" ON personas
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create personas" ON personas
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all personas" ON personas
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all personas" ON personas
    FOR DELETE USING (auth.role() = 'authenticated');

-- Competitors table policies
DROP POLICY IF EXISTS "Users can view competitors in their projects" ON competitors;
DROP POLICY IF EXISTS "Users can create competitors in their projects" ON competitors;
DROP POLICY IF EXISTS "Users can update competitors in their projects" ON competitors;
DROP POLICY IF EXISTS "Users can delete competitors in their projects" ON competitors;

-- Create shared policies for competitors
CREATE POLICY "Authenticated users can view all competitors" ON competitors
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create competitors" ON competitors
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all competitors" ON competitors
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all competitors" ON competitors
    FOR DELETE USING (auth.role() = 'authenticated');

-- Creatives table policies
DROP POLICY IF EXISTS "Users can view creatives in their projects" ON creatives;
DROP POLICY IF EXISTS "Users can create creatives in their projects" ON creatives;
DROP POLICY IF EXISTS "Users can update creatives in their projects" ON creatives;
DROP POLICY IF EXISTS "Users can delete creatives in their projects" ON creatives;

-- Create shared policies for creatives
CREATE POLICY "Authenticated users can view all creatives" ON creatives
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create creatives" ON creatives
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all creatives" ON creatives
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all creatives" ON creatives
    FOR DELETE USING (auth.role() = 'authenticated');

-- Creative Intelligence table policies
DROP POLICY IF EXISTS "Users can view creative_intelligence in their projects" ON creative_intelligence;
DROP POLICY IF EXISTS "Users can create creative_intelligence in their projects" ON creative_intelligence;
DROP POLICY IF EXISTS "Users can update creative_intelligence in their projects" ON creative_intelligence;
DROP POLICY IF EXISTS "Users can delete creative_intelligence in their projects" ON creative_intelligence;

-- Create shared policies for creative_intelligence
CREATE POLICY "Authenticated users can view all creative_intelligence" ON creative_intelligence
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create creative_intelligence" ON creative_intelligence
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all creative_intelligence" ON creative_intelligence
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all creative_intelligence" ON creative_intelligence
    FOR DELETE USING (auth.role() = 'authenticated');
-- Update projects RLS policies for shared access
-- All authenticated users should be able to access all projects

-- Drop existing user-based policies for projects
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can view all projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects they created" ON projects;
DROP POLICY IF EXISTS "Users can delete projects they created" ON projects;
DROP POLICY IF EXISTS "Users can view projects they created" ON projects;

-- Create shared policies for projects
CREATE POLICY "Authenticated users can view all projects" ON projects
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create projects" ON projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all projects" ON projects
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all projects" ON projects
    FOR DELETE USING (auth.role() = 'authenticated');
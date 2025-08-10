-- Add user_id column to projects table if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID;

-- Update existing projects to use created_by as user_id if user_id is null (with proper casting)
UPDATE projects SET user_id = created_by::uuid WHERE user_id IS NULL AND created_by IS NOT NULL AND created_by ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Make user_id NOT NULL after populating it
ALTER TABLE projects ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraint to auth.users if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'projects_user_id_fkey' 
        AND table_name = 'projects'
    ) THEN
        ALTER TABLE projects ADD CONSTRAINT projects_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update RLS policies to use user_id instead of created_by
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can view all projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects they created" ON projects;
DROP POLICY IF EXISTS "Users can delete projects they created" ON projects;

-- Create new RLS policies using user_id (drop first if they exist)
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

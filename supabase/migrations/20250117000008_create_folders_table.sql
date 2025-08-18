-- Create folders table for proper folder management
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_folders_project_id ON folders(project_id);
CREATE INDEX IF NOT EXISTS idx_folders_created_by ON folders(created_by);

-- Enable RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simplified for development)
CREATE POLICY "Authenticated users can view all folders" ON folders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert folders" ON folders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all folders" ON folders
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all folders" ON folders
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add folder_id column to files table for proper relationship
ALTER TABLE files ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Add index for folder_id
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);
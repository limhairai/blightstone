-- Add parent_folder_id to folders table for nested folder support
ALTER TABLE folders ADD COLUMN parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE;

-- Create index for better performance when querying folder hierarchies
CREATE INDEX idx_folders_parent_folder_id ON folders(parent_folder_id);

-- Update RLS policies to handle nested folders
-- The existing policies should work fine since they check project_id which is inherited
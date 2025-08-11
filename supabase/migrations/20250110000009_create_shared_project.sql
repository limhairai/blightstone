-- Create a shared project for the internal CRM system
-- Since we converted to shared data, we need a single project that all data belongs to

-- Make user_id nullable for the shared project
ALTER TABLE projects ALTER COLUMN user_id DROP NOT NULL;

-- Insert a shared project with a fixed UUID for consistency
INSERT INTO projects (id, name, description, status, user_id, created_by, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Shared CRM Data',
    'Internal shared project for all CRM data in the shared system',
    'active',
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1), -- Will be NULL if no users exist
    'System',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Update any existing data that might have invalid project_id values
-- This will catch any data created with "shared" string instead of UUID

-- Update tasks with invalid project_id
UPDATE tasks 
SET project_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE project_id IS NULL OR project_id::text = 'shared';

-- Update personas with invalid project_id  
UPDATE personas 
SET project_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE project_id IS NULL OR project_id::text = 'shared';

-- Update competitors with invalid project_id
UPDATE competitors 
SET project_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE project_id IS NULL OR project_id::text = 'shared';

-- Update creatives with invalid project_id
UPDATE creatives 
SET project_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE project_id IS NULL OR project_id::text = 'shared';

-- Update creative_intelligence with invalid project_id
UPDATE creative_intelligence 
SET project_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE project_id IS NULL OR project_id::text = 'shared';
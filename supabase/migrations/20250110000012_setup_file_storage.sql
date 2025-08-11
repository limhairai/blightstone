-- Enable file storage for CRM attachments
-- Create storage buckets and policies for authenticated users

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
  ('task-attachments', 'task-attachments', false, 52428800, ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
  ('project-media', 'project-media', false, 52428800, ARRAY['image/*', 'video/*', 'application/pdf']);

-- RLS policies for task attachments bucket
CREATE POLICY "Authenticated users can upload task files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-attachments');

CREATE POLICY "Authenticated users can view task files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'task-attachments');

CREATE POLICY "Authenticated users can update task files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'task-attachments');

CREATE POLICY "Authenticated users can delete task files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'task-attachments');

-- RLS policies for project media bucket
CREATE POLICY "Authenticated users can upload project media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-media');

CREATE POLICY "Authenticated users can view project media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-media');

CREATE POLICY "Authenticated users can update project media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-media');

CREATE POLICY "Authenticated users can delete project media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-media');

-- Create task_attachments table for better file management
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Storage path for deletion
  file_type TEXT,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- RLS for task_attachments table
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view task attachments"
ON task_attachments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert task attachments"
ON task_attachments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update task attachments"
ON task_attachments FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete task attachments"
ON task_attachments FOR DELETE
TO authenticated
USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON task_attachments(uploaded_by);
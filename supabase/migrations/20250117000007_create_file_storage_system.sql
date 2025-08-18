-- Create file storage system for Blightstone CRM
-- This allows teams to upload files directly to the app instead of using external Google Drive

-- Files table to store file metadata
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in Supabase Storage
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    
    -- Organization
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
    ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE SET NULL,
    
    -- File categorization
    category TEXT DEFAULT 'general', -- 'creative', 'document', 'image', 'video', 'general'
    tags TEXT[], -- Array of tags for flexible organization
    
    -- Metadata
    description TEXT,
    created_by TEXT NOT NULL, -- User email
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_offer_id ON files(offer_id);
CREATE INDEX IF NOT EXISTS idx_files_ad_account_id ON files(ad_account_id);
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_files_created_by ON files(created_by);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simplified for local development)
CREATE POLICY "Authenticated users can view all files" ON files
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert files" ON files
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all files" ON files
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all files" ON files
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create storage bucket for files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the files bucket
CREATE POLICY "Authenticated users can view files" ON storage.objects
    FOR SELECT USING (bucket_id = 'files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update files" ON storage.objects
    FOR UPDATE USING (bucket_id = 'files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete files" ON storage.objects
    FOR DELETE USING (bucket_id = 'files' AND auth.role() = 'authenticated');
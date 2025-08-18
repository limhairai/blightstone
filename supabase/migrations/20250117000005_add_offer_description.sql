-- Add description column to offers table

ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS description TEXT;
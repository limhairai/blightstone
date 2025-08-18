-- Temporarily disable RLS for development environment
-- This allows local testing without authentication complications

-- Update ad_accounts policies to be more permissive for development
DROP POLICY IF EXISTS "Users can view ad accounts from their projects" ON ad_accounts;
DROP POLICY IF EXISTS "Users can insert ad accounts to their projects" ON ad_accounts;
DROP POLICY IF EXISTS "Users can update ad accounts from their projects" ON ad_accounts;
DROP POLICY IF EXISTS "Users can delete ad accounts from their projects" ON ad_accounts;

-- Create more permissive policies for development
CREATE POLICY "Allow all authenticated users to view ad accounts" ON ad_accounts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to insert ad accounts" ON ad_accounts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to update ad accounts" ON ad_accounts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to delete ad accounts" ON ad_accounts
    FOR DELETE USING (auth.role() = 'authenticated');

-- Update offers policies to be more permissive for development
DROP POLICY IF EXISTS "Users can view offers from their projects" ON offers;
DROP POLICY IF EXISTS "Users can insert offers to their projects" ON offers;
DROP POLICY IF EXISTS "Users can update offers from their projects" ON offers;
DROP POLICY IF EXISTS "Users can delete offers from their projects" ON offers;

-- Create more permissive policies for development
CREATE POLICY "Allow all authenticated users to view offers" ON offers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to insert offers" ON offers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to update offers" ON offers
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to delete offers" ON offers
    FOR DELETE USING (auth.role() = 'authenticated');
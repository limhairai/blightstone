-- Migration: Rename projects to businesses
-- This migration renames the projects table and all related references to businesses

BEGIN;

-- 1. Rename the projects table to businesses
ALTER TABLE public.projects RENAME TO businesses;

-- 2. Rename the project_domains table to business_domains
ALTER TABLE public.project_domains RENAME TO business_domains;

-- 3. Update column references in business_domains table
ALTER TABLE public.business_domains RENAME COLUMN project_id TO business_id;

-- 4. Update foreign key constraint name (drop and recreate)
ALTER TABLE public.business_domains DROP CONSTRAINT project_domains_project_id_fkey;
ALTER TABLE public.business_domains ADD CONSTRAINT business_domains_business_id_fkey 
  FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

-- 5. Update transactions table column reference
ALTER TABLE public.transactions RENAME COLUMN project_id TO business_id;

-- 6. Update foreign key constraint in transactions table
ALTER TABLE public.transactions DROP CONSTRAINT transactions_project_id_fkey;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_business_id_fkey 
  FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;

-- 7. Rename indexes
DROP INDEX IF EXISTS idx_projects_organization_id;
CREATE INDEX idx_businesses_organization_id ON public.businesses(organization_id);

DROP INDEX IF EXISTS idx_project_domains_project_id;
CREATE INDEX idx_business_domains_business_id ON public.business_domains(business_id);

DROP INDEX IF EXISTS idx_transactions_project_id;
CREATE INDEX idx_transactions_business_id ON public.transactions(business_id);

-- 8. Update triggers
DROP TRIGGER IF EXISTS set_projects_updated_at ON public.businesses;
CREATE TRIGGER set_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();

-- 9. Drop old policies and create new ones for businesses table
DROP POLICY IF EXISTS "Users can read projects of organizations they are a member of" ON public.businesses;
DROP POLICY IF EXISTS "Org owners/admins can create projects for their organization" ON public.businesses;
DROP POLICY IF EXISTS "Org owners/admins can update projects in their organization" ON public.businesses;
DROP POLICY IF EXISTS "Org owners/admins can delete projects in their organization" ON public.businesses;

-- Create new policies for businesses
CREATE POLICY "Users can read businesses of organizations they are a member of"
ON public.businesses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = public.businesses.organization_id
    AND om.user_id = (select auth.uid())
  )
);

CREATE POLICY "Org owners/admins can create businesses for their organization"
ON public.businesses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = public.businesses.organization_id
    AND om.user_id = (select auth.uid())
    AND om.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Org owners/admins can update businesses in their organization"
ON public.businesses FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = public.businesses.organization_id
    AND om.user_id = (select auth.uid())
    AND om.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Org owners/admins can delete businesses in their organization"
ON public.businesses FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = public.businesses.organization_id
    AND om.user_id = (select auth.uid())
    AND om.role IN ('owner', 'admin')
  )
);

-- 10. Drop old policies and create new ones for business_domains table
DROP POLICY IF EXISTS "Project domains access control" ON public.business_domains;

CREATE POLICY "Business domains access control"
ON public.business_domains FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.businesses b ON b.organization_id = om.organization_id
    WHERE b.id = public.business_domains.business_id
    AND om.user_id = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.businesses b ON b.organization_id = om.organization_id
    WHERE b.id = public.business_domains.business_id
    AND om.user_id = (select auth.uid())
    AND om.role IN ('owner', 'admin')
  )
);

-- 11. Add comments to document the new structure
COMMENT ON TABLE public.businesses IS 'Business managers that contain ad accounts';
COMMENT ON TABLE public.business_domains IS 'Domains associated with each business manager';
COMMENT ON COLUMN public.transactions.business_id IS 'Optional link to the business manager for this transaction';

COMMIT; 
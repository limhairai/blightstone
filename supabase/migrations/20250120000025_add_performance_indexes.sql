-- Add performance indexes for transactions table
-- This will significantly improve query performance on the transactions page

-- Index on organization_id (most important - filters all queries)
CREATE INDEX IF NOT EXISTS idx_transactions_organization_id 
ON public.transactions(organization_id);

-- Index on created_at for ordering (used in ORDER BY)
CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
ON public.transactions(created_at DESC);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_transactions_org_status_type 
ON public.transactions(organization_id, status, type);

-- Index for search queries (description only - display_id doesn't exist in transactions table)
CREATE INDEX IF NOT EXISTS idx_transactions_search 
ON public.transactions USING gin(to_tsvector('english', coalesce(description, '')));

-- Index on type for transaction type filtering
CREATE INDEX IF NOT EXISTS idx_transactions_type 
ON public.transactions(type);

-- Index on status for status filtering  
CREATE INDEX IF NOT EXISTS idx_transactions_status 
ON public.transactions(status);

-- Composite index for pagination performance (org + created_at)
CREATE INDEX IF NOT EXISTS idx_transactions_org_created_at 
ON public.transactions(organization_id, created_at DESC);

-- Note: business_id column doesn't exist in transactions table, skipping this index

-- Add similar indexes for topup_requests table
CREATE INDEX IF NOT EXISTS idx_topup_requests_organization_id 
ON public.topup_requests(organization_id);

CREATE INDEX IF NOT EXISTS idx_topup_requests_created_at 
ON public.topup_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_topup_requests_status 
ON public.topup_requests(status);

CREATE INDEX IF NOT EXISTS idx_topup_requests_org_created_at 
ON public.topup_requests(organization_id, created_at DESC);

-- Add index for profiles table (used in auth check)
CREATE INDEX IF NOT EXISTS idx_profiles_profile_id 
ON public.profiles(profile_id);

-- Analyze tables to update query planner statistics
ANALYZE public.transactions;
ANALYZE public.topup_requests;
ANALYZE public.profiles; 
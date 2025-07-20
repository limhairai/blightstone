-- Performance optimization: Add indexes for common queries
-- This will dramatically improve query performance for frequently accessed data

-- ============================================
-- ORGANIZATIONS TABLE INDEXES
-- ============================================

-- Index for organization lookups by owner (very common)
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);

-- Index for organization status and plan lookups (admin panels)
CREATE INDEX IF NOT EXISTS idx_organizations_status_plan ON organizations(subscription_status, plan_id);

-- Index for organization creation date (for sorting)
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at DESC);

-- ============================================
-- PROFILES TABLE INDEXES
-- ============================================

-- Index for profile lookups by user ID (most common query)
CREATE INDEX IF NOT EXISTS idx_profiles_profile_id ON profiles(profile_id);

-- Index for organization membership lookups
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);

-- Index for admin user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_superuser ON profiles(is_superuser) WHERE is_superuser = true;

-- ============================================
-- ASSET_BINDING TABLE INDEXES
-- ============================================

-- Composite index for organization asset lookups (very common)
CREATE INDEX IF NOT EXISTS idx_asset_binding_org_status ON asset_binding(organization_id, status);

-- Index for active asset lookups
CREATE INDEX IF NOT EXISTS idx_asset_binding_status_active ON asset_binding(status, is_active) WHERE status = 'active';

-- Index for asset type filtering
CREATE INDEX IF NOT EXISTS idx_asset_binding_asset_org ON asset_binding(asset_id, organization_id);

-- ============================================
-- ASSET TABLE INDEXES
-- ============================================

-- Index for asset type lookups (business_manager, ad_account, etc.)
CREATE INDEX IF NOT EXISTS idx_asset_type ON asset(type);

-- Index for asset status
CREATE INDEX IF NOT EXISTS idx_asset_status ON asset(status);

-- Index for dolphin_id lookups (external system integration)
CREATE INDEX IF NOT EXISTS idx_asset_dolphin_id ON asset(dolphin_id);

-- Index for asset creation date
CREATE INDEX IF NOT EXISTS idx_asset_created_at ON asset(created_at DESC);

-- ============================================
-- TRANSACTIONS TABLE INDEXES
-- ============================================

-- Composite index for organization transaction lookups
CREATE INDEX IF NOT EXISTS idx_transactions_org_created ON transactions(organization_id, created_at DESC);

-- Index for transaction status filtering
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Index for transaction type filtering
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Index for transaction amount (for reporting)
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount_cents);

-- ============================================
-- APPLICATION TABLE INDEXES
-- ============================================

-- Index for organization application lookups
CREATE INDEX IF NOT EXISTS idx_application_organization_id ON application(organization_id);

-- Index for application status (admin filtering)
CREATE INDEX IF NOT EXISTS idx_application_status ON application(status);

-- Index for application type
CREATE INDEX IF NOT EXISTS idx_application_request_type ON application(request_type);

-- Index for application creation date
CREATE INDEX IF NOT EXISTS idx_application_created_at ON application(created_at DESC);

-- Composite index for admin application filtering
CREATE INDEX IF NOT EXISTS idx_application_status_created ON application(status, created_at DESC);

-- ============================================
-- BUSINESS MANAGERS DOMAIN TABLE INDEXES
-- ============================================

-- Index for business manager domain lookups
CREATE INDEX IF NOT EXISTS idx_bm_domains_bm_asset_id ON bm_domains(bm_asset_id);

-- Index for active domains
CREATE INDEX IF NOT EXISTS idx_bm_domains_active ON bm_domains(is_active) WHERE is_active = true;

-- Index for organization domain lookups
CREATE INDEX IF NOT EXISTS idx_bm_domains_organization_id ON bm_domains(organization_id);

-- ============================================
-- WALLETS TABLE INDEXES
-- ============================================

-- Index for wallet organization lookups
CREATE INDEX IF NOT EXISTS idx_wallets_organization_id ON wallets(organization_id);

-- Index for wallet balance queries
CREATE INDEX IF NOT EXISTS idx_wallets_balance ON wallets(balance_cents);

-- ============================================
-- SUPPORT TICKETS TABLE INDEXES
-- ============================================

-- Index for organization ticket lookups
CREATE INDEX IF NOT EXISTS idx_support_tickets_organization_id ON support_tickets(organization_id);

-- Index for ticket status filtering
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- Index for ticket creation date
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- Index for assigned tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);

-- ============================================
-- ORGANIZATION MEMBERS TABLE INDEXES
-- ============================================

-- Index for user membership lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);

-- Index for organization membership lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON organization_members(organization_id);

-- Composite index for membership validation
CREATE INDEX IF NOT EXISTS idx_organization_members_user_org ON organization_members(user_id, organization_id);

-- ============================================
-- TOPUP REQUESTS TABLE INDEXES
-- ============================================

-- Index for organization topup lookups
CREATE INDEX IF NOT EXISTS idx_topup_requests_organization_id ON topup_requests(organization_id);

-- Index for topup status filtering
CREATE INDEX IF NOT EXISTS idx_topup_requests_status ON topup_requests(status);

-- Index for topup creation date
CREATE INDEX IF NOT EXISTS idx_topup_requests_created_at ON topup_requests(created_at DESC);

-- ============================================
-- PARTIAL INDEXES FOR BETTER PERFORMANCE
-- ============================================

-- Partial index for active business managers only
CREATE INDEX IF NOT EXISTS idx_asset_binding_active_bm ON asset_binding(organization_id, asset_id) 
WHERE status = 'active';

-- Partial index for active ad accounts only
CREATE INDEX IF NOT EXISTS idx_asset_binding_active_ad ON asset_binding(organization_id, asset_id) 
WHERE status = 'active';

-- Partial index for pending applications only
CREATE INDEX IF NOT EXISTS idx_application_pending ON application(organization_id, created_at DESC) 
WHERE status IN ('pending', 'processing');

-- ============================================
-- PERFORMANCE MONITORING
-- ============================================

-- Add comment for tracking
COMMENT ON SCHEMA public IS 'Performance indexes added';

-- Log the completion
DO $$
BEGIN
    RAISE NOTICE 'Performance indexes have been successfully created for improved query performance';
END $$; 
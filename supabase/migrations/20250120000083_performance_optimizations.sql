-- Performance Optimization Migration
-- Adds critical indexes and optimizes queries for 0ms perceived latency

-- 1. Critical indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id 
ON organizations(owner_id);

CREATE INDEX IF NOT EXISTS idx_transactions_org_id_created 
ON transactions(organization_id, created_at DESC);

-- 2. Wallet and balance queries
CREATE INDEX IF NOT EXISTS idx_wallets_org_id 
ON wallets(organization_id);

CREATE INDEX IF NOT EXISTS idx_topup_requests_org_id_status 
ON topup_requests(organization_id, status, created_at DESC);

-- 3. Application and support queries
CREATE INDEX IF NOT EXISTS idx_application_org_id_status 
ON application(organization_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_org_id_status 
ON support_tickets(organization_id, status, created_at DESC);

-- 4. User profile queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON profiles(profile_id);

-- 5. Audit trail queries
CREATE INDEX IF NOT EXISTS idx_application_audit_fields 
ON application(approved_by, rejected_by, fulfilled_by) 
WHERE approved_by IS NOT NULL OR rejected_by IS NOT NULL OR fulfilled_by IS NOT NULL;

-- 6. Asset and binding queries
CREATE INDEX IF NOT EXISTS idx_asset_binding_org_id 
ON asset_binding(organization_id);

CREATE INDEX IF NOT EXISTS idx_asset_binding_asset_id 
ON asset_binding(asset_id);

-- 7. Create optimized views for dashboard
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT 
    o.organization_id,
    o.name as org_name,
    COALESCE(w.balance_cents, 0) as balance_cents,
    COALESCE(w.reserved_balance_cents, 0) as reserved_balance_cents,
    o.subscription_status,
    COUNT(DISTINCT CASE WHEN app.status = 'pending' THEN app.application_id END) as pending_applications,
    COUNT(DISTINCT CASE WHEN st.status = 'open' THEN st.ticket_id END) as open_tickets
FROM organizations o
LEFT JOIN wallets w ON o.organization_id = w.organization_id
LEFT JOIN application app ON o.organization_id = app.organization_id
LEFT JOIN support_tickets st ON o.organization_id = st.organization_id
GROUP BY o.organization_id, o.name, w.balance_cents, w.reserved_balance_cents, o.subscription_status;

-- 8. Create function for ultra-fast organization data retrieval
CREATE OR REPLACE FUNCTION get_organization_dashboard_data(org_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'organization', json_build_object(
            'organization_id', o.organization_id,
            'name', o.name,
            'balance_cents', COALESCE(w.balance_cents, 0),
            'balance', COALESCE(w.balance_cents, 0) / 100.0,
            'reserved_balance_cents', COALESCE(w.reserved_balance_cents, 0),
            'subscription_status', o.subscription_status,
            'created_at', o.created_at
        ),
        'summary', json_build_object(
            'pending_applications', COALESCE(ds.pending_applications, 0),
            'open_tickets', COALESCE(ds.open_tickets, 0)
        ),
        'wallets', COALESCE(
            (SELECT json_agg(json_build_object(
                'wallet_id', w.wallet_id,
                'balance_cents', w.balance_cents,
                'balance', w.balance_cents / 100.0
            )) FROM wallets w WHERE w.organization_id = org_id),
            '[]'::json
        )
    ) INTO result
    FROM organizations o
    LEFT JOIN wallets w ON o.organization_id = w.organization_id
    LEFT JOIN dashboard_summary ds ON o.organization_id = ds.organization_id
    WHERE o.organization_id = org_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- 9. Grant necessary permissions
GRANT SELECT ON dashboard_summary TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_organization_dashboard_data(UUID) TO anon, authenticated;

-- 10. Analyze tables for query planner optimization
ANALYZE organizations;
ANALYZE transactions;
ANALYZE wallets;
ANALYZE topup_requests;
ANALYZE application;
ANALYZE support_tickets;
ANALYZE profiles;
ANALYZE asset_binding; 
-- ============================================================================
-- SUBSCRIPTION SYSTEM MIGRATION
-- Implements 4-tier pricing with Stripe integration
-- ============================================================================

-- Update plans table with new pricing structure
DROP TABLE IF EXISTS public.plans CASCADE;
CREATE TABLE public.plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    monthly_subscription_fee_cents INTEGER NOT NULL,
    ad_spend_fee_percentage DECIMAL(5,2) NOT NULL,
    max_team_members INTEGER NOT NULL, -- -1 for unlimited
    max_businesses INTEGER NOT NULL,   -- -1 for unlimited  
    max_ad_accounts INTEGER NOT NULL,  -- -1 for unlimited
    features JSONB DEFAULT '[]',
    stripe_price_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert new pricing plans
INSERT INTO public.plans (id, name, description, monthly_subscription_fee_cents, ad_spend_fee_percentage, max_team_members, max_businesses, max_ad_accounts, features) VALUES
('starter', 'Starter', 'Perfect for testing and small projects', 2900, 6.00, 2, 1, 5, '["Basic Support", "Standard Features"]'),
('growth', 'Growth', 'For growing businesses', 14900, 3.00, 5, 3, 21, '["Priority Support", "Advanced Analytics"]'),
('scale', 'Scale', 'For scaling teams', 49900, 1.50, 15, 10, 70, '["Dedicated Support", "Custom Integrations", "Advanced Reporting"]'),
('enterprise', 'Enterprise', 'For large organizations', 149900, 1.00, -1, -1, -1, '["White-label Options", "Account Manager", "API Access", "Priority Feature Requests"]');

-- Add subscription management columns to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES public.plans(id) DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS can_topup BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS can_request_assets BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;

-- Create subscriptions tracking table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES public.plans(id),
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create topup_requests table with fee tracking if it doesn't exist
CREATE TABLE IF NOT EXISTS public.topup_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    ad_account_id TEXT NOT NULL,
    ad_account_name TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    notes TEXT,
    admin_notes TEXT,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Fee tracking fields
    fee_amount_cents INTEGER DEFAULT 0,
    total_deducted_cents INTEGER DEFAULT 0,
    plan_fee_percentage DECIMAL(5,2) DEFAULT 0
);

-- Add fee tracking columns to existing table if they don't exist
ALTER TABLE public.topup_requests 
ADD COLUMN IF NOT EXISTS fee_amount_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_deducted_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS plan_fee_percentage DECIMAL(5,2) DEFAULT 0;

-- Create indexes and policies for topup_requests
CREATE INDEX IF NOT EXISTS idx_topup_requests_organization_id ON public.topup_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_topup_requests_status ON public.topup_requests(status);
CREATE INDEX IF NOT EXISTS idx_topup_requests_created_at ON public.topup_requests(created_at DESC);

-- Enable RLS and create policies
ALTER TABLE public.topup_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their organization's requests
DROP POLICY IF EXISTS "Users can view own organization topup requests" ON public.topup_requests;
CREATE POLICY "Users can view own organization topup requests" ON public.topup_requests
            FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Users can create requests for their organization
DROP POLICY IF EXISTS "Users can create topup requests" ON public.topup_requests;
CREATE POLICY "Users can create topup requests" ON public.topup_requests
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organizations 
            WHERE owner_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
        AND requested_by = auth.uid()
    );

-- RLS Policy: Admins can view and update all requests
DROP POLICY IF EXISTS "Admins can manage all topup requests" ON public.topup_requests;
CREATE POLICY "Admins can manage all topup requests" ON public.topup_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_superuser = true
        )
    );

-- Create admin tasks table for manual reviews
CREATE TABLE IF NOT EXISTS public.admin_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    organization_id UUID REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create function to check plan limits
CREATE OR REPLACE FUNCTION check_plan_limits(org_id UUID, limit_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    org_record RECORD;
    plan_record RECORD;
    current_count INTEGER;
BEGIN
    -- Get organization and plan data
    SELECT o.* INTO org_record
    FROM organizations o
    WHERE o.organization_id = org_id;
    
    SELECT p.* INTO plan_record
    FROM plans p
    WHERE p.id = org_record.plan_id;
    
    -- Check specific limit type
    CASE limit_type
        WHEN 'team_members' THEN
            SELECT COUNT(*) INTO current_count 
            FROM organization_members 
            WHERE organization_id = org_id;
            
            RETURN (plan_record.max_team_members = -1 OR current_count < plan_record.max_team_members);
            
        WHEN 'businesses' THEN
            SELECT COUNT(*) INTO current_count 
            FROM asset_binding ab
            JOIN asset a ON ab.asset_id = a.id
            WHERE ab.organization_id = org_id 
            AND a.type = 'business_manager'
            AND ab.status = 'active';
            
            RETURN (plan_record.max_businesses = -1 OR current_count < plan_record.max_businesses);
            
        WHEN 'ad_accounts' THEN
            SELECT COUNT(*) INTO current_count 
            FROM asset_binding ab
            JOIN asset a ON ab.asset_id = a.id
            WHERE ab.organization_id = org_id 
            AND a.type = 'ad_account'
            AND ab.status = 'active';
            
            RETURN (plan_record.max_ad_accounts = -1 OR current_count < plan_record.max_ad_accounts);
            
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle subscription status changes
CREATE OR REPLACE FUNCTION handle_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update organization subscription status
    UPDATE organizations 
    SET 
        subscription_status = NEW.status,
        current_period_start = NEW.current_period_start,
        current_period_end = NEW.current_period_end,
        updated_at = NOW()
    WHERE organization_id = NEW.organization_id;
    
    -- Handle payment failures
    IF NEW.status = 'past_due' AND OLD.status != 'past_due' THEN
        -- Create admin task for payment failure
        INSERT INTO admin_tasks (type, organization_id, title, description, priority, metadata)
        VALUES (
            'payment_failed',
            NEW.organization_id,
            'Payment Failed',
            'Subscription payment failed - review account',
            'high',
            jsonb_build_object('stripe_subscription_id', NEW.stripe_subscription_id)
        );
    END IF;
    
    -- Handle account freezing after grace period
    IF NEW.status = 'unpaid' THEN
        UPDATE organizations 
        SET 
            subscription_status = 'frozen',
            frozen_at = NOW(),
            can_topup = FALSE,
            can_request_assets = FALSE
        WHERE organization_id = NEW.organization_id;
        
        -- Create admin task
        INSERT INTO admin_tasks (type, organization_id, title, description, priority)
        VALUES (
            'account_frozen',
            NEW.organization_id,
            'Account Frozen',
            'Account frozen due to payment failure',
            'high'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription changes
CREATE TRIGGER subscription_status_change
    AFTER UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION handle_subscription_change();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_plan_id ON organizations(plan_id);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_status ON admin_tasks(status);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_organization ON admin_tasks(organization_id);

-- Update existing organizations to have default plan
UPDATE organizations 
SET plan_id = 'starter' 
WHERE plan_id IS NULL; 
-- Add production-ready features for billing, payments, usage tracking, and team management

-- 1. PAYMENT METHODS TABLE
CREATE TABLE public.payment_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations ON DELETE CASCADE,
    stripe_payment_method_id text UNIQUE NOT NULL, -- Stripe PaymentMethod ID
    type text NOT NULL CHECK (type IN ('credit_card', 'bank_transfer', 'paypal')), 
    brand text, -- e.g., 'visa', 'mastercard', 'amex'
    last4 text, -- Last 4 digits
    expiry_month integer,
    expiry_year integer,
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for payment methods
CREATE INDEX idx_payment_methods_organization_id ON public.payment_methods(organization_id);
CREATE INDEX idx_payment_methods_stripe_id ON public.payment_methods(stripe_payment_method_id);

-- RLS for payment methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their payment methods"
    ON public.payment_methods FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.payment_methods.organization_id AND om.user_id = auth.uid()
    ));

CREATE POLICY "Org owners/admins can manage payment methods"
    ON public.payment_methods FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.payment_methods.organization_id
        AND om.user_id = auth.uid()
        AND (om.role = 'owner' OR om.role = 'admin')
    ));

-- 2. SUBSCRIPTIONS TABLE (Enhanced)
CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations ON DELETE CASCADE,
    plan_id text NOT NULL REFERENCES public.plans(id) ON UPDATE CASCADE,
    stripe_subscription_id text UNIQUE,
    stripe_customer_id text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid', 'trialing')),
    billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    trial_end timestamp with time zone,
    cancel_at_period_end boolean DEFAULT false NOT NULL,
    canceled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for subscriptions
CREATE INDEX idx_subscriptions_organization_id ON public.subscriptions(organization_id);
CREATE INDEX idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their subscription"
    ON public.subscriptions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.subscriptions.organization_id AND om.user_id = auth.uid()
    ));

CREATE POLICY "Org owners/admins can manage subscription"
    ON public.subscriptions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.subscriptions.organization_id
        AND om.user_id = auth.uid()
        AND (om.role = 'owner' OR om.role = 'admin')
    ));

-- 3. INVOICES TABLE
CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations ON DELETE CASCADE,
    subscription_id uuid REFERENCES public.subscriptions ON DELETE SET NULL,
    stripe_invoice_id text UNIQUE,
    invoice_number text UNIQUE NOT NULL,
    amount_cents bigint NOT NULL,
    currency char(3) NOT NULL DEFAULT 'USD',
    status text NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    description text,
    invoice_date timestamp with time zone NOT NULL,
    due_date timestamp with time zone,
    paid_at timestamp with time zone,
    invoice_pdf_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for invoices
CREATE INDEX idx_invoices_organization_id ON public.invoices(organization_id);
CREATE INDEX idx_invoices_subscription_id ON public.invoices(subscription_id);
CREATE INDEX idx_invoices_stripe_id ON public.invoices(stripe_invoice_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_invoice_date ON public.invoices(invoice_date);

-- RLS for invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their invoices"
    ON public.invoices FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.invoices.organization_id AND om.user_id = auth.uid()
    ));

-- 4. USAGE TRACKING TABLE
CREATE TABLE public.usage_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations ON DELETE CASCADE,
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    businesses_count integer DEFAULT 0 NOT NULL,
    ad_accounts_count integer DEFAULT 0 NOT NULL,
    team_members_count integer DEFAULT 0 NOT NULL,
    monthly_spend_cents bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, period_start, period_end)
);

-- Indexes for usage tracking
CREATE INDEX idx_usage_tracking_organization_id ON public.usage_tracking(organization_id);
CREATE INDEX idx_usage_tracking_period ON public.usage_tracking(period_start, period_end);

-- RLS for usage tracking
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their usage"
    ON public.usage_tracking FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.usage_tracking.organization_id AND om.user_id = auth.uid()
    ));

-- 5. TEAM INVITATIONS TABLE
CREATE TABLE public.team_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations ON DELETE CASCADE,
    email text NOT NULL,
    role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    invited_by uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    token text UNIQUE NOT NULL, -- Secure invitation token
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at timestamp with time zone NOT NULL,
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, email) -- Prevent duplicate invitations
);

-- Indexes for team invitations
CREATE INDEX idx_team_invitations_organization_id ON public.team_invitations(organization_id);
CREATE INDEX idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX idx_team_invitations_status ON public.team_invitations(status);

-- RLS for team invitations
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners/admins can manage invitations"
    ON public.team_invitations FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.team_invitations.organization_id
        AND om.user_id = auth.uid()
        AND (om.role = 'owner' OR om.role = 'admin')
    ));

CREATE POLICY "Users can view invitations sent to their email"
    ON public.team_invitations FOR SELECT
    USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 6. AUDIT LOGS TABLE
CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users ON DELETE SET NULL,
    action text NOT NULL, -- e.g., 'user_invited', 'payment_method_added', 'plan_upgraded'
    resource_type text NOT NULL, -- e.g., 'user', 'payment_method', 'subscription'
    resource_id text, -- ID of the affected resource
    details jsonb, -- Additional details about the action
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for audit logs
CREATE INDEX idx_audit_logs_organization_id ON public.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- RLS for audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners/admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.audit_logs.organization_id
        AND om.user_id = auth.uid()
        AND (om.role = 'owner' OR om.role = 'admin')
    ));

-- 7. ENHANCE PLANS TABLE WITH MORE DETAILS
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_businesses integer DEFAULT 1 NOT NULL;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_ad_accounts integer DEFAULT 10 NOT NULL;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_team_members integer DEFAULT 1 NOT NULL;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_monthly_spend_cents bigint DEFAULT 1000000 NOT NULL; -- $10,000 default
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS trial_days integer DEFAULT 0 NOT NULL;

-- 8. ADD ORGANIZATION USAGE LIMITS TRACKING
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS current_businesses_count integer DEFAULT 0 NOT NULL;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS current_ad_accounts_count integer DEFAULT 0 NOT NULL;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS current_team_members_count integer DEFAULT 1 NOT NULL;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS current_monthly_spend_cents bigint DEFAULT 0 NOT NULL;

-- 9. FUNCTIONS FOR USAGE TRACKING

-- Function to update organization usage counts
CREATE OR REPLACE FUNCTION update_organization_usage_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update businesses count
    UPDATE public.organizations 
    SET current_businesses_count = (
        SELECT COUNT(*) FROM public.businesses 
        WHERE organization_id = COALESCE(NEW.organization_id, OLD.organization_id)
    )
    WHERE id = COALESCE(NEW.organization_id, OLD.organization_id);
    
    -- Update ad accounts count
    UPDATE public.organizations 
    SET current_ad_accounts_count = (
        SELECT COUNT(*) FROM public.ad_accounts a
        JOIN public.businesses b ON a.business_id = b.id
        WHERE b.organization_id = COALESCE(NEW.organization_id, OLD.organization_id)
    )
    WHERE id = COALESCE(NEW.organization_id, OLD.organization_id);
    
    -- Update team members count
    UPDATE public.organizations 
    SET current_team_members_count = (
        SELECT COUNT(*) FROM public.organization_members 
        WHERE organization_id = COALESCE(NEW.organization_id, OLD.organization_id)
    )
    WHERE id = COALESCE(NEW.organization_id, OLD.organization_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update usage counts
CREATE TRIGGER update_org_usage_on_business_change
    AFTER INSERT OR UPDATE OR DELETE ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION update_organization_usage_counts();

CREATE TRIGGER update_org_usage_on_member_change
    AFTER INSERT OR UPDATE OR DELETE ON public.organization_members
    FOR EACH ROW EXECUTE FUNCTION update_organization_usage_counts();

-- Function to check if organization can add more resources
CREATE OR REPLACE FUNCTION check_organization_limits(
    org_id uuid,
    resource_type text
) RETURNS boolean AS $$
DECLARE
    org_plan_id text;
    current_count integer;
    max_allowed integer;
BEGIN
    -- Get organization's plan
    SELECT plan_id INTO org_plan_id
    FROM public.organizations
    WHERE id = org_id;
    
    -- Check limits based on resource type
    CASE resource_type
        WHEN 'businesses' THEN
            SELECT current_businesses_count INTO current_count
            FROM public.organizations WHERE id = org_id;
            
            SELECT max_businesses INTO max_allowed
            FROM public.plans WHERE id = org_plan_id;
            
        WHEN 'ad_accounts' THEN
            SELECT current_ad_accounts_count INTO current_count
            FROM public.organizations WHERE id = org_id;
            
            SELECT max_ad_accounts INTO max_allowed
            FROM public.plans WHERE id = org_plan_id;
            
        WHEN 'team_members' THEN
            SELECT current_team_members_count INTO current_count
            FROM public.organizations WHERE id = org_id;
            
            SELECT max_team_members INTO max_allowed
            FROM public.plans WHERE id = org_plan_id;
            
        ELSE
            RETURN false;
    END CASE;
    
    RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION check_organization_limits(uuid, text) TO authenticated;

-- Apply updated_at triggers to new tables
CREATE TRIGGER set_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_usage_tracking_updated_at
    BEFORE UPDATE ON public.usage_tracking
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_team_invitations_updated_at
    BEFORE UPDATE ON public.team_invitations
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp(); 
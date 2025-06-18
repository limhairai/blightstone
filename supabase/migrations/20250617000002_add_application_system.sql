-- Ad Account Application System Migration
-- Creates tables and functions for client application workflow

-- Create ad_account_applications table
CREATE TABLE IF NOT EXISTS ad_account_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Application details
    account_name TEXT NOT NULL,
    spend_limit DECIMAL(10,2) DEFAULT 5000.00,
    landing_page_url TEXT,
    facebook_page_url TEXT,
    campaign_description TEXT,
    notes TEXT,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    
    -- Admin review fields
    assigned_account_id TEXT, -- References ad_accounts.account_id when approved
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES auth.users(id),
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    admin_notes TEXT,
    
    -- Timestamps
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_ad_account_applications_user_id ON ad_account_applications(user_id);
CREATE INDEX idx_ad_account_applications_organization_id ON ad_account_applications(organization_id);
CREATE INDEX idx_ad_account_applications_business_id ON ad_account_applications(business_id);
CREATE INDEX idx_ad_account_applications_status ON ad_account_applications(status);
CREATE INDEX idx_ad_account_applications_submitted_at ON ad_account_applications(submitted_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ad_account_applications_updated_at 
    BEFORE UPDATE ON ad_account_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create application notifications table
CREATE TABLE IF NOT EXISTS application_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES ad_account_applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('submitted', 'approved', 'rejected', 'under_review')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_application_notifications_user_id ON application_notifications(user_id);
CREATE INDEX idx_application_notifications_read ON application_notifications(read);
CREATE INDEX idx_application_notifications_created_at ON application_notifications(created_at DESC);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE ad_account_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_notifications ENABLE ROW LEVEL SECURITY;

-- Applications: Users can see their own applications and org members can see org applications
CREATE POLICY "Users can view own applications" ON ad_account_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Organization members can view org applications" ON ad_account_applications
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Users can create applications for their businesses
CREATE POLICY "Users can create applications" ON ad_account_applications
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        business_id IN (
            SELECT b.id FROM businesses b
            JOIN organization_members om ON b.organization_id = om.organization_id
            WHERE om.user_id = auth.uid()
        )
    );

-- Only admins can update applications (approve/reject)
CREATE POLICY "Admins can update applications" ON ad_account_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND (is_superuser = true OR role = 'admin')
        )
    );

-- Notifications: Users can see their own notifications
CREATE POLICY "Users can view own notifications" ON application_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON application_notifications
    FOR INSERT WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON application_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to automatically create notifications
CREATE OR REPLACE FUNCTION create_application_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification when application status changes
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO application_notifications (
            application_id,
            user_id,
            type,
            title,
            message
        ) VALUES (
            NEW.id,
            NEW.user_id,
            NEW.status,
            CASE NEW.status
                WHEN 'approved' THEN 'Application Approved!'
                WHEN 'rejected' THEN 'Application Rejected'
                WHEN 'under_review' THEN 'Application Under Review'
                ELSE 'Application Status Updated'
            END,
            CASE NEW.status
                WHEN 'approved' THEN 'Your ad account application has been approved and an account has been assigned.'
                WHEN 'rejected' THEN 'Your ad account application has been rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'No reason provided.')
                WHEN 'under_review' THEN 'Your ad account application is now under review by our team.'
                ELSE 'Your application status has been updated to ' || NEW.status
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notifications
CREATE TRIGGER application_status_notification_trigger
    AFTER UPDATE ON ad_account_applications
    FOR EACH ROW
    EXECUTE FUNCTION create_application_notification();

-- Create view for application statistics
CREATE OR REPLACE VIEW application_stats AS
SELECT 
    COUNT(*) as total_applications,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_applications,
    COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review_applications,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_applications,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_applications,
    ROUND(
        COUNT(CASE WHEN status = 'approved' THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(CASE WHEN status IN ('approved', 'rejected') THEN 1 END), 0) * 100, 
        2
    ) as approval_rate,
    AVG(
        CASE 
            WHEN status IN ('approved', 'rejected') 
            THEN EXTRACT(EPOCH FROM (COALESCE(approved_at, rejected_at) - submitted_at)) / 3600 
        END
    ) as avg_processing_hours
FROM ad_account_applications;

-- Grant permissions
GRANT SELECT ON application_stats TO authenticated;
GRANT ALL ON ad_account_applications TO authenticated;
GRANT ALL ON application_notifications TO authenticated;

-- Comment the tables
COMMENT ON TABLE ad_account_applications IS 'Stores ad account applications from clients';
COMMENT ON TABLE application_notifications IS 'Stores notifications related to application status changes';
COMMENT ON VIEW application_stats IS 'Provides statistics about application processing'; 
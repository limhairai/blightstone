-- Add Telegram integration to existing schema
-- Migration: 20250115000000_add_telegram_integration.sql

BEGIN;

-- Add telegram_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE;

-- Add index for telegram_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON public.profiles(telegram_id);

-- Add telegram_notifications table for bot alerts
CREATE TABLE IF NOT EXISTS public.telegram_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    account_id TEXT, -- ad account ID
    alert_type TEXT NOT NULL, -- 'low_balance', 'critical', 'topup_success', 'daily_report'
    message TEXT NOT NULL,
    sent_to_telegram_ids BIGINT[] NOT NULL DEFAULT '{}',
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.telegram_notifications ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_org_id ON public.telegram_notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_alert_type ON public.telegram_notifications(alert_type);
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_created_at ON public.telegram_notifications(created_at);

-- RLS policies for telegram_notifications
CREATE POLICY "Users can view notifications for their organizations"
    ON public.telegram_notifications FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.telegram_notifications.organization_id
        AND om.user_id = (select auth.uid())
    ));

-- Add telegram bot settings to organizations (optional)
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS telegram_alerts_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS telegram_alert_thresholds JSONB DEFAULT '{"critical": 1, "warning": 3}'::jsonb;

COMMIT; 
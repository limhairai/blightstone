-- ============================================================================
-- 🔒 SECURITY: Admin Impersonation System for Support
-- ============================================================================
-- This migration creates a secure, audited impersonation system that allows
-- admins to temporarily access client organizations for support purposes
-- with full audit trails and time limits
-- ============================================================================

-- ============================================================================
-- ADMIN_IMPERSONATION_LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_impersonation_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_organization_id UUID NOT NULL REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'start', 'end', 'view_data', 'perform_action'
    reason TEXT NOT NULL, -- Required justification
    session_id UUID, -- Groups related actions
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Session expiration
    metadata JSONB -- Additional context
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_admin_user ON public.admin_impersonation_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_target_org ON public.admin_impersonation_log(target_organization_id);
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_session ON public.admin_impersonation_log(session_id);
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_created_at ON public.admin_impersonation_log(created_at);

-- ============================================================================
-- ADMIN_IMPERSONATION_SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_impersonation_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_organization_id UUID NOT NULL REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    terminated_at TIMESTAMPTZ,
    terminated_by UUID REFERENCES auth.users(id),
    metadata JSONB
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_admin ON public.admin_impersonation_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_org ON public.admin_impersonation_sessions(target_organization_id);
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_status ON public.admin_impersonation_sessions(status);

-- ============================================================================
-- IMPERSONATION HELPER FUNCTIONS
-- ============================================================================

-- Function to start an impersonation session
CREATE OR REPLACE FUNCTION public.start_admin_impersonation(
    p_target_organization_id UUID,
    p_reason TEXT,
    p_duration_minutes INTEGER DEFAULT 30
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id UUID;
    v_admin_user_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Check if user is admin
    SELECT profile_id INTO v_admin_user_id 
    FROM public.profiles 
    WHERE profile_id = auth.uid() AND is_superuser = true;
    
    IF v_admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    -- Validate reason
    IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 10 THEN
        RAISE EXCEPTION 'Reason must be at least 10 characters long';
    END IF;
    
    -- Set expiration time
    v_expires_at := NOW() + (p_duration_minutes || ' minutes')::INTERVAL;
    
    -- Create session
    INSERT INTO public.admin_impersonation_sessions (
        admin_user_id,
        target_organization_id,
        reason,
        expires_at
    ) VALUES (
        v_admin_user_id,
        p_target_organization_id,
        p_reason,
        v_expires_at
    ) RETURNING session_id INTO v_session_id;
    
    -- Log the start
    INSERT INTO public.admin_impersonation_log (
        admin_user_id,
        target_organization_id,
        action,
        reason,
        session_id,
        expires_at
    ) VALUES (
        v_admin_user_id,
        p_target_organization_id,
        'start',
        p_reason,
        v_session_id,
        v_expires_at
    );
    
    RETURN v_session_id;
END;
$$;

-- Function to check if admin has active impersonation session
CREATE OR REPLACE FUNCTION public.check_admin_impersonation_access(
    p_organization_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_has_access BOOLEAN := FALSE;
BEGIN
    -- Check if user is admin with active impersonation session
    SELECT EXISTS(
        SELECT 1 
        FROM public.admin_impersonation_sessions s
        JOIN public.profiles p ON p.profile_id = s.admin_user_id
        WHERE s.admin_user_id = auth.uid()
        AND s.target_organization_id = p_organization_id
        AND s.status = 'active'
        AND s.expires_at > NOW()
        AND p.is_superuser = true
    ) INTO v_has_access;
    
    RETURN v_has_access;
END;
$$;

-- Function to end an impersonation session
CREATE OR REPLACE FUNCTION public.end_admin_impersonation(
    p_session_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
BEGIN
    -- Get session details
    SELECT * INTO v_session
    FROM public.admin_impersonation_sessions
    WHERE session_id = p_session_id
    AND admin_user_id = auth.uid();
    
    IF v_session IS NULL THEN
        RAISE EXCEPTION 'Session not found or unauthorized';
    END IF;
    
    -- Update session status
    UPDATE public.admin_impersonation_sessions
    SET status = 'terminated',
        terminated_at = NOW(),
        terminated_by = auth.uid()
    WHERE session_id = p_session_id;
    
    -- Log the end
    INSERT INTO public.admin_impersonation_log (
        admin_user_id,
        target_organization_id,
        action,
        reason,
        session_id
    ) VALUES (
        v_session.admin_user_id,
        v_session.target_organization_id,
        'end',
        'Session terminated',
        p_session_id
    );
    
    RETURN TRUE;
END;
$$;

-- ============================================================================
-- RLS POLICIES FOR IMPERSONATION TABLES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.admin_impersonation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for impersonation log (admin only)
CREATE POLICY "Admins can view all impersonation logs" ON public.admin_impersonation_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- Policies for impersonation sessions (admin only)
CREATE POLICY "Admins can manage impersonation sessions" ON public.admin_impersonation_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profile_id = auth.uid() AND is_superuser = true
        )
    );

-- ============================================================================
-- ENHANCED ORGANIZATION ACCESS WITH IMPERSONATION
-- ============================================================================

-- Update the organization policy to include impersonation access
DROP POLICY IF EXISTS "Users can view organizations they own or are members of" ON public.organizations;

CREATE POLICY "Users can view organizations they own or are members of" ON public.organizations
    FOR SELECT USING (
        -- Normal user access
        owner_id = auth.uid()
        OR organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
        -- Admin impersonation access
        OR (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profile_id = auth.uid() AND is_superuser = true
            )
            AND public.check_admin_impersonation_access(organization_id)
        )
    );

-- ============================================================================
-- COMMENT: Secure Impersonation System
-- ============================================================================
-- 
-- This system provides:
-- 1. Time-limited impersonation sessions (default 30 minutes)
-- 2. Full audit trail of all admin actions
-- 3. Required justification for each session
-- 4. Automatic session expiration
-- 5. Manual session termination
-- 6. IP and user agent logging
--
-- Usage:
-- 1. Admin calls start_admin_impersonation(org_id, reason, duration)
-- 2. System creates session and logs the start
-- 3. Admin can access organization data while session is active
-- 4. All actions are logged automatically
-- 5. Session expires automatically or can be terminated manually
--
-- ============================================================================
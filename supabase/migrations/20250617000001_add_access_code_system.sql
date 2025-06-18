-- Access Code System for AdHub
-- Inspired by BullX authentication system

-- Access Codes Table
CREATE TABLE IF NOT EXISTS access_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    created_by_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    code_type VARCHAR(50) NOT NULL DEFAULT 'user_invite', -- 'user_invite', 'group_invite', 'admin_invite'
    max_uses INTEGER NOT NULL DEFAULT 1,
    current_uses INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Access Code Redemptions Table (for audit trail)
CREATE TABLE IF NOT EXISTS access_code_redemptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    access_code VARCHAR(20) NOT NULL,
    telegram_id BIGINT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_org ON access_codes(organization_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_active ON access_codes(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_access_code_redemptions_telegram ON access_code_redemptions(telegram_id);
CREATE INDEX IF NOT EXISTS idx_access_code_redemptions_code ON access_code_redemptions(access_code);

-- Row Level Security
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_code_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for access_codes
CREATE POLICY "Users can view access codes for their organizations"
    ON access_codes FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Organization owners/admins can create access codes"
    ON access_codes FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Organization owners/admins can update access codes"
    ON access_codes FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Organization owners/admins can delete access codes"
    ON access_codes FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- RLS Policies for access_code_redemptions
CREATE POLICY "Users can view redemptions for their organizations"
    ON access_code_redemptions FOR SELECT
    USING (
        access_code IN (
            SELECT code 
            FROM access_codes 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM organization_members 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'admin')
            )
        )
    );

-- Allow service role to insert redemptions (for bot)
CREATE POLICY "Service role can insert redemptions"
    ON access_code_redemptions FOR INSERT
    WITH CHECK (true);

-- Function to automatically deactivate expired codes
CREATE OR REPLACE FUNCTION deactivate_expired_access_codes()
RETURNS void AS $$
BEGIN
    UPDATE access_codes 
    SET is_active = false, updated_at = NOW()
    WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to check if access code is valid
CREATE OR REPLACE FUNCTION is_access_code_valid(code_to_check VARCHAR(20))
RETURNS BOOLEAN AS $$
DECLARE
    code_record access_codes%ROWTYPE;
BEGIN
    SELECT * INTO code_record 
    FROM access_codes 
    WHERE code = UPPER(code_to_check) 
    AND is_active = true;
    
    -- Check if code exists
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check if expired
    IF code_record.expires_at < NOW() THEN
        RETURN false;
    END IF;
    
    -- Check if max uses exceeded
    IF code_record.current_uses >= code_record.max_uses THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to redeem access code (atomic operation)
CREATE OR REPLACE FUNCTION redeem_access_code(
    code_to_redeem VARCHAR(20),
    telegram_user_id BIGINT,
    redeemer_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    code_record access_codes%ROWTYPE;
    result JSON;
BEGIN
    -- Lock the row for update
    SELECT * INTO code_record 
    FROM access_codes 
    WHERE code = UPPER(code_to_redeem) 
    AND is_active = true
    FOR UPDATE;
    
    -- Check if code exists and is valid
    IF NOT FOUND THEN
        RETURN '{"success": false, "error": "Invalid access code"}'::JSON;
    END IF;
    
    -- Check if expired
    IF code_record.expires_at < NOW() THEN
        RETURN '{"success": false, "error": "Access code has expired"}'::JSON;
    END IF;
    
    -- Check if max uses exceeded
    IF code_record.current_uses >= code_record.max_uses THEN
        RETURN '{"success": false, "error": "Access code has been used up"}'::JSON;
    END IF;
    
    -- Increment usage count
    UPDATE access_codes 
    SET current_uses = current_uses + 1, updated_at = NOW()
    WHERE id = code_record.id;
    
    -- Log the redemption
    INSERT INTO access_code_redemptions (access_code, telegram_id, user_id)
    VALUES (code_to_redeem, telegram_user_id, redeemer_user_id);
    
    -- Return success with code details
    SELECT json_build_object(
        'success', true,
        'organization_id', code_record.organization_id,
        'code_type', code_record.code_type,
        'created_by_user_id', code_record.created_by_user_id
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_access_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER access_codes_updated_at
    BEFORE UPDATE ON access_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_access_codes_updated_at();

-- View for access code statistics
CREATE OR REPLACE VIEW access_code_stats AS
SELECT 
    ac.organization_id,
    o.name as organization_name,
    ac.code_type,
    COUNT(*) as total_codes,
    COUNT(*) FILTER (WHERE ac.is_active = true AND ac.expires_at > NOW()) as active_codes,
    COUNT(*) FILTER (WHERE ac.expires_at <= NOW()) as expired_codes,
    COUNT(*) FILTER (WHERE ac.current_uses >= ac.max_uses) as used_up_codes,
    SUM(ac.current_uses) as total_redemptions,
    AVG(ac.current_uses::FLOAT / ac.max_uses::FLOAT) as usage_rate
FROM access_codes ac
JOIN organizations o ON ac.organization_id = o.id
GROUP BY ac.organization_id, o.name, ac.code_type;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON access_codes TO authenticated;
GRANT SELECT, INSERT ON access_code_redemptions TO authenticated;
GRANT SELECT ON access_code_stats TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE access_codes IS 'Access codes for secure bot authentication, inspired by BullX system';
COMMENT ON TABLE access_code_redemptions IS 'Audit trail of access code redemptions';
COMMENT ON FUNCTION is_access_code_valid IS 'Check if an access code is valid and can be redeemed';
COMMENT ON FUNCTION redeem_access_code IS 'Atomically redeem an access code and log the redemption';
COMMENT ON VIEW access_code_stats IS 'Statistics view for access code usage by organization'; 
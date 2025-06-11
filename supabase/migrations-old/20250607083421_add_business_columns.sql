-- Add missing columns to existing businesses table for business manager functionality
-- The businesses table already exists from the projects migration, we just need to add our columns

-- Add missing columns to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_id TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended', 'inactive'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS verification TEXT DEFAULT 'pending' CHECK (verification IN ('verified', 'not_verified', 'pending'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS landing_page TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- Make business_id unique if it's not already
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_business_id_unique ON businesses(business_id) WHERE business_id IS NOT NULL;

-- Create ad_accounts table
CREATE TABLE IF NOT EXISTS ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_id TEXT UNIQUE NOT NULL, -- Platform-specific account ID (e.g., act_123456789)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'paused', 'error')),
  balance DECIMAL(10,2) DEFAULT 0,
  spent DECIMAL(10,2) DEFAULT 0,
  spend_limit DECIMAL(10,2) DEFAULT 5000,
  platform TEXT NOT NULL DEFAULT 'Meta' CHECK (platform = 'Meta'),
  last_activity TEXT DEFAULT 'Just created',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_verification ON businesses(verification);
CREATE INDEX IF NOT EXISTS idx_ad_accounts_business_id ON ad_accounts(business_id);
CREATE INDEX IF NOT EXISTS idx_ad_accounts_user_id ON ad_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_accounts_status ON ad_accounts(status);
CREATE INDEX IF NOT EXISTS idx_ad_accounts_platform ON ad_accounts(platform);

-- Add updated_at trigger for ad_accounts
CREATE OR REPLACE FUNCTION update_ad_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ad_accounts_updated_at
  BEFORE UPDATE ON ad_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_ad_accounts_updated_at();

-- Enable RLS for ad_accounts
ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ad_accounts
CREATE POLICY "Users can view their own ad accounts" ON ad_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ad accounts" ON ad_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ad accounts" ON ad_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ad accounts" ON ad_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Function to seed demo data for a user
CREATE OR REPLACE FUNCTION seed_demo_data_for_current_user()
RETURNS VOID AS $$
DECLARE
  current_user_id UUID;
  current_org_id UUID;
  business_1_id UUID;
  business_2_id UUID;
  business_3_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user found';
  END IF;

  -- Get user's organization
  SELECT id INTO current_org_id 
  FROM organizations 
  WHERE created_by = current_user_id 
  ORDER BY created_at DESC 
  LIMIT 1;

  IF current_org_id IS NULL THEN
    RAISE EXCEPTION 'No organization found for user';
  END IF;

  -- Clear existing demo data first
  DELETE FROM ad_accounts WHERE user_id = current_user_id;
  DELETE FROM businesses WHERE user_id = current_user_id AND business_id IS NOT NULL;

  -- Insert demo businesses
  INSERT INTO businesses (
    user_id, organization_id, name, business_id, status, verification,
    landing_page, website, business_type, description, country, timezone, created_at
  ) VALUES 
  (
    current_user_id, current_org_id,
    'My E-Commerce Store', '118010225380663', 'active', 'verified',
    'https://store.example.com', 'https://store.example.com', 'ecommerce',
    'Online retail store specializing in consumer electronics and accessories',
    'US', 'America/New_York', NOW() - INTERVAL '15 days'
  ),
  (
    current_user_id, current_org_id,
    'Blog Network', '117291547115266', 'pending', 'pending',
    'https://blog.example.com', 'https://blog.example.com', 'other',
    'Content marketing and blog network',
    'US', 'America/New_York', NOW() - INTERVAL '3 days'
  ),
  (
    current_user_id, current_org_id,
    'Affiliate Marketing Hub', '847810749229077', 'active', 'verified',
    'https://affiliate.example.com', 'https://affiliate.example.com', 'agency',
    'Performance marketing and affiliate management',
    'US', 'America/Los_Angeles', NOW() - INTERVAL '7 days'
  );

  -- Get the business IDs
  SELECT id INTO business_1_id FROM businesses WHERE business_id = '118010225380663' AND user_id = current_user_id;
  SELECT id INTO business_3_id FROM businesses WHERE business_id = '847810749229077' AND user_id = current_user_id;

  -- Insert demo ad accounts for business 1
  INSERT INTO ad_accounts (
    business_id, user_id, name, account_id, status, balance, spent, spend_limit,
    platform, last_activity, created_at
  ) VALUES 
  (
    business_1_id, current_user_id, 'Primary Marketing', 'act_123456789', 'active',
    1250.00, 8450.00, 10000.00, 'Meta', '2 hours ago', NOW() - INTERVAL '13 days'
  ),
  (
    business_1_id, current_user_id, 'Holiday Campaign', 'act_987654321', 'pending',
    0.00, 0.00, 2000.00, 'Meta', '1 day ago', NOW() - INTERVAL '5 days'
  ),
  (
    business_1_id, current_user_id, 'Retargeting Setup', 'act_456789123', 'active',
    850.00, 3200.00, 5000.00, 'Meta', '30 minutes ago', NOW() - INTERVAL '10 days'
  );

  -- Insert demo ad accounts for business 3
  INSERT INTO ad_accounts (
    business_id, user_id, name, account_id, status, balance, spent, spend_limit,
    platform, last_activity, created_at
  ) VALUES 
  (
    business_3_id, current_user_id, 'Main Affiliate Ads', 'act_789123456', 'active',
    3200.00, 15600.00, 20000.00, 'Meta', '1 hour ago', NOW() - INTERVAL '6 days'
  ),
  (
    business_3_id, current_user_id, 'Testing Account', 'act_321654987', 'paused',
    150.00, 850.00, 1000.00, 'Meta', '3 days ago', NOW() - INTERVAL '4 days'
  );

  RAISE NOTICE 'Demo data seeded successfully for user %', current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the seeding function
GRANT EXECUTE ON FUNCTION seed_demo_data_for_current_user() TO authenticated;

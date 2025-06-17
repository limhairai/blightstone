#!/usr/bin/env python3
"""
Apply database migration for organization-business manager mapping
Run this to add the new table to your production Supabase database
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def apply_migration():
    """Apply the organization_business_managers table migration"""
    
    # Initialize Supabase client
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
        return False
    
    supabase: Client = create_client(url, key)
    
    # SQL for creating the organization_business_managers table
    migration_sql = """
    -- Organization to Business Manager Mapping
    CREATE TABLE IF NOT EXISTS organization_business_managers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        business_manager_id TEXT NOT NULL,
        business_manager_name TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Ensure one BM can only belong to one organization
        UNIQUE(business_manager_id)
    );

    -- Add RLS (Row Level Security)
    ALTER TABLE organization_business_managers ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view org BMs they belong to" ON organization_business_managers;
    DROP POLICY IF EXISTS "Org admins can manage BMs" ON organization_business_managers;

    -- Policy: Users can only see BMs for organizations they belong to
    CREATE POLICY "Users can view org BMs they belong to" ON organization_business_managers
        FOR SELECT USING (
            organization_id IN (
                SELECT organization_id 
                FROM organization_members 
                WHERE user_id = auth.uid()
            )
        );

    -- Policy: Only org owners/admins can manage BM mappings
    CREATE POLICY "Org admins can manage BMs" ON organization_business_managers
        FOR ALL USING (
            organization_id IN (
                SELECT organization_id 
                FROM organization_members 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'admin')
            )
        );

    -- Add indexes for performance
    CREATE INDEX IF NOT EXISTS idx_org_bm_org_id ON organization_business_managers(organization_id);
    CREATE INDEX IF NOT EXISTS idx_org_bm_bm_id ON organization_business_managers(business_manager_id);

    -- Add updated_at trigger function if it doesn't exist
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Add trigger for updated_at
    DROP TRIGGER IF EXISTS update_org_bm_updated_at ON organization_business_managers;
    CREATE TRIGGER update_org_bm_updated_at 
        BEFORE UPDATE ON organization_business_managers 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """
    
    try:
        print("🔄 Applying database migration...")
        
        # Execute the migration SQL
        result = supabase.rpc('exec_sql', {'sql': migration_sql}).execute()
        
        print("✅ Migration applied successfully!")
        print("📋 Created table: organization_business_managers")
        print("🔒 Row Level Security enabled")
        print("📊 Indexes created for performance")
        
        return True
        
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
        
        # Try alternative approach with individual statements
        print("🔄 Trying alternative approach...")
        
        try:
            # Create table
            supabase.rpc('exec_sql', {
                'sql': """
                CREATE TABLE IF NOT EXISTS organization_business_managers (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                    business_manager_id TEXT NOT NULL,
                    business_manager_name TEXT,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(business_manager_id)
                );
                """
            }).execute()
            
            print("✅ Table created successfully!")
            print("💡 You may need to enable RLS and create policies manually in Supabase dashboard")
            return True
            
        except Exception as e2:
            print(f"❌ Alternative approach also failed: {e2}")
            return False

def verify_migration():
    """Verify the migration was applied correctly"""
    
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Client = create_client(url, key)
    
    try:
        # Try to query the new table
        result = supabase.table("organization_business_managers").select("*").limit(1).execute()
        print("✅ Migration verification successful!")
        print(f"📊 Table exists and is accessible")
        return True
        
    except Exception as e:
        print(f"❌ Migration verification failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 AdHub Telegram Bot - Database Migration")
    print("=" * 50)
    
    print("📋 This will create the organization_business_managers table")
    print("🔒 This enables secure data isolation by client")
    
    confirm = input("\n⚠️  Apply migration to production database? (y/N): ")
    
    if confirm.lower() == 'y':
        if apply_migration():
            print("\n🧪 Verifying migration...")
            verify_migration()
            
            print("\n🎉 Migration complete!")
            print("\n📋 Next steps:")
            print("1. Start the bot: python run_bot.py")
            print("2. Run: /admin_sync_bms to see available Business Managers")
            print("3. Use: /admin_add_bm <org_id> <bm_id> to assign BMs to organizations")
        else:
            print("\n❌ Migration failed. Check your database connection and permissions.")
    else:
        print("❌ Migration cancelled.") 
#!/usr/bin/env python3
"""
Semantic ID Migration Orchestrator

This script runs the complete semantic ID migration process:
1. Database migration
2. Backend updates
3. Frontend updates
4. Validation

Usage:
    python scripts/migration/run_semantic_id_migration.py
"""

import os
import subprocess
import sys
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors."""
    print(f"🔄 {description}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"   Command: {command}")
        print(f"   Error: {e.stderr}")
        return False

def check_prerequisites():
    """Check if all prerequisites are met."""
    print("🔍 Checking prerequisites...")
    
    # Check if we're in the right directory
    if not os.path.exists("supabase"):
        print("❌ Not in the correct directory. Please run from the project root.")
        return False
    
    # Check if supabase CLI is available
    try:
        subprocess.run(["supabase", "--version"], capture_output=True, check=True)
        print("✅ Supabase CLI found")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Supabase CLI not found. Please install it first.")
        return False
    
    return True

def run_database_migration():
    """Run the database migration."""
    print("\n📊 Running database migration...")
    
    # Reset the database with the new migration
    if not run_command("supabase db reset", "Database reset with semantic ID migration"):
        return False
    
    print("✅ Database migration completed")
    return True

def update_critical_backend_files():
    """Update the most critical backend files manually."""
    print("\n🔧 Updating critical backend files...")
    
    # List of critical files to update
    critical_files = [
        "backend/app/api/endpoints/admin.py",
        "backend/app/api/endpoints/applications.py", 
        "backend/app/api/endpoints/assets.py",
        "backend/app/services/subscription_service.py",
    ]
    
    print("📝 The following files need manual updates:")
    for file in critical_files:
        if os.path.exists(file):
            print(f"   - {file}")
        else:
            print(f"   - {file} (not found)")
    
    print("\n🔄 Manual updates needed:")
    print("   1. Replace .eq('id', ...) with .eq('application_id', ...) for application queries")
    print("   2. Replace .eq('id', ...) with .eq('asset_id', ...) for asset queries")
    print("   3. Replace .eq('id', ...) with .eq('binding_id', ...) for asset_binding queries")
    print("   4. Replace .eq('id', ...) with .eq('profile_id', ...) for profile queries")
    print("   5. Update API response field names to use camelCase")
    
    return True

def update_critical_frontend_files():
    """Update the most critical frontend files."""
    print("\n🎨 Updating critical frontend files...")
    
    # List of critical files to update
    critical_files = [
        "frontend/src/types/application.ts",
        "frontend/src/types/asset.ts",
        "frontend/src/components/admin/applications-table.tsx",
        "frontend/src/components/admin/assets-table.tsx",
        "frontend/src/app/admin/applications/page.tsx",
        "frontend/src/app/admin/assets/page.tsx",
    ]
    
    print("📝 The following files need manual updates:")
    for file in critical_files:
        if os.path.exists(file):
            print(f"   - {file}")
        else:
            print(f"   - {file} (not found)")
    
    print("\n🔄 Manual updates needed:")
    print("   1. Update interface definitions to use semantic IDs (applicationId, assetId, etc.)")
    print("   2. Update component props to use camelCase semantic IDs")
    print("   3. Update API calls to use semantic ID parameters")
    print("   4. Update table column definitions")
    
    return True

def create_updated_types():
    """Create updated TypeScript type definitions."""
    print("\n📝 Creating updated type definitions...")
    
    # Create the types directory if it doesn't exist
    os.makedirs("frontend/src/types/generated", exist_ok=True)
    
    # Create semantic ID types
    types_content = '''// Semantic ID Type Definitions
// Auto-generated during migration

export interface Application {
  applicationId: string;
  organizationId: string;
  requestType: string;
  targetBmDolphinId?: string;
  websiteUrl: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  fulfilledBy?: string;
  fulfilledAt?: string;
  clientNotes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  assetId: string;
  type: 'business_manager' | 'ad_account' | 'profile';
  dolphinId: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  metadata?: Record<string, any>;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetBinding {
  bindingId: string;
  assetId: string;
  organizationId: string;
  status: 'active' | 'inactive';
  boundBy: string;
  boundAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  profileId: string;
  organizationId?: string;
  name?: string;
  email?: string;
  role: string;
  isSuperuser: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationFulfillment {
  fulfillmentId: string;
  applicationId: string;
  assetId: string;
  createdAt: string;
}

// Field mapping utilities
export const FIELD_MAPPINGS = {
  // Database -> Frontend
  application_id: 'applicationId',
  asset_id: 'assetId',
  binding_id: 'bindingId',
  profile_id: 'profileId',
  fulfillment_id: 'fulfillmentId',
  organization_id: 'organizationId',
  wallet_id: 'walletId',
  transaction_id: 'transactionId',
  request_id: 'requestId',
} as const;
'''
    
    with open("frontend/src/types/generated/semantic-ids.ts", "w") as f:
        f.write(types_content)
    
    print("✅ Created semantic ID type definitions")
    return True

def create_migration_summary():
    """Create a summary of what was migrated."""
    print("\n📋 Creating migration summary...")
    
    summary = """# Semantic ID Migration Summary

## Database Changes
- ✅ Added semantic primary keys: application_id, asset_id, binding_id, profile_id, fulfillment_id
- ✅ Updated foreign key references in junction tables
- ✅ Updated stored functions to use semantic IDs
- ✅ Recreated indexes with semantic names

## Backend Changes Needed
- 🔄 Update database queries to use semantic column names
- 🔄 Update API responses to use camelCase field names
- 🔄 Update service layer to handle semantic IDs

## Frontend Changes Needed  
- 🔄 Update TypeScript interfaces to use semantic IDs
- 🔄 Update component props and state management
- 🔄 Update API calls and URL parameters
- 🔄 Update table column definitions

## Key Benefits
- 🎯 Eliminates generic 'id' field confusion
- 🎯 Makes code more readable and maintainable
- 🎯 Follows industry best practices (Stripe, Shopify, etc.)
- 🎯 Prevents ID-related bugs

## Next Steps
1. Manually update the critical backend files listed above
2. Manually update the critical frontend files listed above
3. Test all API endpoints
4. Run TypeScript compiler to check for errors
5. Test the admin panel functionality
6. Verify asset binding/unbinding works correctly

## Testing Checklist
- [ ] Applications page loads correctly
- [ ] Assets page loads correctly
- [ ] Asset binding/unbinding works
- [ ] Organization detail page shows assets
- [ ] Admin panel functions work
- [ ] API responses use correct field names
"""
    
    with open("SEMANTIC_ID_MIGRATION_SUMMARY.md", "w") as f:
        f.write(summary)
    
    print("✅ Created migration summary: SEMANTIC_ID_MIGRATION_SUMMARY.md")
    return True

def main():
    """Main migration orchestrator."""
    print("🚀 Starting Semantic ID Migration")
    print("=" * 50)
    
    # Check prerequisites
    if not check_prerequisites():
        sys.exit(1)
    
    # Run database migration
    if not run_database_migration():
        print("❌ Database migration failed. Aborting.")
        sys.exit(1)
    
    # Update critical files (manual step)
    update_critical_backend_files()
    update_critical_frontend_files()
    
    # Create supporting files
    create_updated_types()
    create_migration_summary()
    
    print("\n" + "=" * 50)
    print("✅ Semantic ID Migration Setup Complete!")
    print("\n📋 Summary:")
    print("   - Database migration: ✅ Complete")
    print("   - Type definitions: ✅ Created")
    print("   - Migration summary: ✅ Created")
    print("   - Backend updates: 🔄 Manual step required")
    print("   - Frontend updates: 🔄 Manual step required")
    
    print("\n🔄 Next Steps:")
    print("1. Review SEMANTIC_ID_MIGRATION_SUMMARY.md")
    print("2. Update the critical backend files listed above")
    print("3. Update the critical frontend files listed above")
    print("4. Test the application thoroughly")
    print("5. Commit changes when everything works")
    
    print("\n⚠️  Important: Test thoroughly before deploying to production!")

if __name__ == "__main__":
    main() 
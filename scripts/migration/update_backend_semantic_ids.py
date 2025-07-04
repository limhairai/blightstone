#!/usr/bin/env python3
"""
Backend Semantic ID Migration Script

This script updates all backend Python files to use semantic IDs instead of generic 'id' fields.
It handles database queries, API responses, and service layer code.

Usage:
    python scripts/migration/update_backend_semantic_ids.py
"""

import os
import re
import glob
from pathlib import Path

# Define the mapping of old generic IDs to semantic IDs
ID_MAPPINGS = {
    # Table name -> (old_column, new_column)
    'application': ('id', 'application_id'),
    'asset': ('id', 'asset_id'), 
    'asset_binding': ('id', 'binding_id'),
    'profiles': ('id', 'profile_id'),
    'application_fulfillment': ('id', 'fulfillment_id'),
}

# Define foreign key mappings for junction tables
FOREIGN_KEY_MAPPINGS = {
    'application_fulfillment': {
        'application_id': 'application_id',  # references application.application_id
        'asset_id': 'asset_id'              # references asset.asset_id
    },
    'asset_binding': {
        'asset_id': 'asset_id'              # references asset.asset_id
    }
}

def find_python_files(directory):
    """Find all Python files in the backend directory."""
    python_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                python_files.append(os.path.join(root, file))
    return python_files

def update_database_queries(content):
    """Update database queries to use semantic IDs."""
    
    # Update .eq("id", ...) patterns for specific tables
    patterns = [
        # Supabase .eq() patterns
        (r'\.eq\("id",\s*([^)]+)\)', r'.eq("application_id", \1)', 'application'),
        (r'\.eq\("id",\s*([^)]+)\)', r'.eq("asset_id", \1)', 'asset'),
        (r'\.eq\("id",\s*([^)]+)\)', r'.eq("binding_id", \1)', 'asset_binding'),
        (r'\.eq\("id",\s*([^)]+)\)', r'.eq("profile_id", \1)', 'profiles'),
        
        # SQL query patterns
        (r'WHERE\s+id\s*=\s*([^;\s]+)', r'WHERE application_id = \1', 'application'),
        (r'WHERE\s+id\s*=\s*([^;\s]+)', r'WHERE asset_id = \1', 'asset'),
        (r'WHERE\s+id\s*=\s*([^;\s]+)', r'WHERE binding_id = \1', 'asset_binding'),
        (r'WHERE\s+id\s*=\s*([^;\s]+)', r'WHERE profile_id = \1', 'profiles'),
        
        # SELECT patterns
        (r'SELECT\s+id\s*FROM\s+application', r'SELECT application_id FROM application'),
        (r'SELECT\s+id\s*FROM\s+asset', r'SELECT asset_id FROM asset'),
        (r'SELECT\s+id\s*FROM\s+asset_binding', r'SELECT binding_id FROM asset_binding'),
        (r'SELECT\s+id\s*FROM\s+profiles', r'SELECT profile_id FROM profiles'),
        
        # INSERT patterns
        (r'INSERT\s+INTO\s+application\s*\([^)]*\bid\b[^)]*\)', 
         lambda m: m.group(0).replace('id', 'application_id')),
        (r'INSERT\s+INTO\s+asset\s*\([^)]*\bid\b[^)]*\)', 
         lambda m: m.group(0).replace('id', 'asset_id')),
        (r'INSERT\s+INTO\s+asset_binding\s*\([^)]*\bid\b[^)]*\)', 
         lambda m: m.group(0).replace('id', 'binding_id')),
        (r'INSERT\s+INTO\s+profiles\s*\([^)]*\bid\b[^)]*\)', 
         lambda m: m.group(0).replace('id', 'profile_id')),
    ]
    
    for pattern, replacement, table in patterns:
        if isinstance(replacement, str):
            # Check if this query is for the specific table
            if table in content.lower():
                content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
        else:
            content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
    
    return content

def update_api_responses(content):
    """Update API response field names to use camelCase semantic IDs."""
    
    # Update response field mappings
    response_mappings = {
        # Database snake_case -> API camelCase
        'application_id': 'applicationId',
        'asset_id': 'assetId', 
        'binding_id': 'bindingId',
        'profile_id': 'profileId',
        'fulfillment_id': 'fulfillmentId',
    }
    
    for db_field, api_field in response_mappings.items():
        # Update dictionary key patterns
        content = re.sub(
            rf'["\']id["\']\s*:\s*([^,}}]+)',
            rf'"{api_field}": \1',
            content
        )
        
        # Update field access patterns
        content = re.sub(
            rf'\.{db_field}\b',
            f'.{api_field}',
            content
        )
    
    return content

def update_service_layer_code(content):
    """Update service layer code to use semantic IDs."""
    
    # Update method parameter names
    content = re.sub(
        r'def\s+([^(]+)\([^)]*\bid\s*:\s*([^,)]+)',
        lambda m: m.group(0).replace('id:', 'entity_id:'),
        content
    )
    
    # Update variable assignments
    content = re.sub(
        r'(\w+)\.id\b',
        lambda m: f'{m.group(1)}.{get_semantic_id_for_entity(m.group(1))}',
        content
    )
    
    return content

def get_semantic_id_for_entity(entity_name):
    """Get the semantic ID field name for an entity."""
    entity_mappings = {
        'application': 'applicationId',
        'asset': 'assetId',
        'binding': 'bindingId', 
        'profile': 'profileId',
        'fulfillment': 'fulfillmentId',
    }
    
    for key, value in entity_mappings.items():
        if key in entity_name.lower():
            return value
    
    return 'id'  # fallback

def update_file_content(file_path):
    """Update a single file's content."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply all transformations
        content = update_database_queries(content)
        content = update_api_responses(content)
        content = update_service_layer_code(content)
        
        # Only write if content changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Updated: {file_path}")
            return True
        else:
            print(f"⚪ No changes: {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error updating {file_path}: {e}")
        return False

def create_type_definitions():
    """Create TypeScript type definitions for the new semantic IDs."""
    
    type_definitions = '''// Updated type definitions with semantic IDs
// Generated by semantic ID migration script

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

// Legacy type mappings for backward compatibility
export type LegacyApplication = Omit<Application, 'applicationId'> & { id: string };
export type LegacyAsset = Omit<Asset, 'assetId'> & { id: string };
export type LegacyAssetBinding = Omit<AssetBinding, 'bindingId'> & { id: string };
export type LegacyProfile = Omit<Profile, 'profileId'> & { id: string };
'''

    os.makedirs('frontend/src/types/generated', exist_ok=True)
    with open('frontend/src/types/generated/semantic-ids.ts', 'w') as f:
        f.write(type_definitions)
    
    print("✅ Created TypeScript type definitions: frontend/src/types/generated/semantic-ids.ts")

def create_migration_utility():
    """Create a utility file for handling ID transformations."""
    
    utility_code = '''/**
 * Semantic ID Migration Utilities
 * 
 * Helper functions for transforming between legacy generic IDs and semantic IDs
 * during the migration period.
 */

// Database field mapping (snake_case to camelCase)
export const ID_FIELD_MAPPING = {
  // Legacy -> Semantic
  id: {
    application: 'applicationId',
    asset: 'assetId',
    asset_binding: 'bindingId',
    profiles: 'profileId',
    application_fulfillment: 'fulfillmentId',
  },
  
  // Semantic -> Legacy (for backward compatibility)
  reverse: {
    applicationId: 'id',
    assetId: 'id', 
    bindingId: 'id',
    profileId: 'id',
    fulfillmentId: 'id',
  }
} as const;

/**
 * Transform API response from database snake_case to frontend camelCase
 */
export function transformApiResponse<T extends Record<string, any>>(
  data: T,
  entityType: keyof typeof ID_FIELD_MAPPING.id
): T {
  if (!data) return data;
  
  const semanticIdField = ID_FIELD_MAPPING.id[entityType];
  if (!semanticIdField) return data;
  
  // Create new object with semantic ID field
  const transformed = { ...data };
  
  // Map database fields to API fields
  if ('application_id' in data) {
    transformed.applicationId = data.application_id;
    delete transformed.application_id;
  }
  
  if ('asset_id' in data) {
    transformed.assetId = data.asset_id;
    delete transformed.asset_id;
  }
  
  if ('binding_id' in data) {
    transformed.bindingId = data.binding_id;
    delete transformed.binding_id;
  }
  
  if ('profile_id' in data) {
    transformed.profileId = data.profile_id;
    delete transformed.profile_id;
  }
  
  if ('fulfillment_id' in data) {
    transformed.fulfillmentId = data.fulfillment_id;
    delete transformed.fulfillment_id;
  }
  
  return transformed;
}

/**
 * Transform frontend request to database format
 */
export function transformToDatabase<T extends Record<string, any>>(
  data: T,
  entityType: keyof typeof ID_FIELD_MAPPING.id
): T {
  if (!data) return data;
  
  const transformed = { ...data };
  
  // Map API fields to database fields
  if ('applicationId' in data) {
    transformed.application_id = data.applicationId;
    delete transformed.applicationId;
  }
  
  if ('assetId' in data) {
    transformed.asset_id = data.assetId;
    delete transformed.assetId;
  }
  
  if ('bindingId' in data) {
    transformed.binding_id = data.bindingId;
    delete transformed.bindingId;
  }
  
  if ('profileId' in data) {
    transformed.profile_id = data.profileId;
    delete transformed.profileId;
  }
  
  if ('fulfillmentId' in data) {
    transformed.fulfillment_id = data.fulfillmentId;
    delete transformed.fulfillmentId;
  }
  
  return transformed;
}

/**
 * Validate that an entity has the correct semantic ID field
 */
export function validateSemanticId(
  data: any,
  entityType: keyof typeof ID_FIELD_MAPPING.id
): boolean {
  if (!data) return false;
  
  const expectedField = ID_FIELD_MAPPING.id[entityType];
  return expectedField in data;
}
'''

    os.makedirs('frontend/src/lib/migration', exist_ok=True)
    with open('frontend/src/lib/migration/semantic-id-utils.ts', 'w') as f:
        f.write(utility_code)
    
    print("✅ Created migration utility: frontend/src/lib/migration/semantic-id-utils.ts")

def main():
    """Main migration function."""
    print("🚀 Starting Backend Semantic ID Migration")
    print("=" * 50)
    
    # Find all Python files in backend
    backend_dir = "backend"
    if not os.path.exists(backend_dir):
        print(f"❌ Backend directory not found: {backend_dir}")
        return
    
    python_files = find_python_files(backend_dir)
    print(f"📁 Found {len(python_files)} Python files to update")
    
    # Update each file
    updated_count = 0
    for file_path in python_files:
        if update_file_content(file_path):
            updated_count += 1
    
    # Create supporting files
    create_type_definitions()
    create_migration_utility()
    
    print("\n" + "=" * 50)
    print(f"✅ Migration Complete!")
    print(f"📊 Updated {updated_count} out of {len(python_files)} files")
    print(f"📝 Created TypeScript definitions and utilities")
    print("\n🔄 Next Steps:")
    print("1. Run the database migration: supabase db reset")
    print("2. Update frontend components to use semantic IDs")
    print("3. Test all API endpoints")
    print("4. Update any remaining hardcoded 'id' references")

if __name__ == "__main__":
    main() 
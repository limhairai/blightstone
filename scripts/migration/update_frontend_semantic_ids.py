#!/usr/bin/env python3
"""
Frontend Semantic ID Migration Script

This script updates all frontend TypeScript/React files to use semantic IDs with camelCase naming.
It handles component props, API calls, type definitions, and state management.

Usage:
    python scripts/migration/update_frontend_semantic_ids.py
"""

import os
import re
import glob
from pathlib import Path

# Define the mapping of database fields to frontend camelCase
FIELD_MAPPINGS = {
    # Database snake_case -> Frontend camelCase
    'application_id': 'applicationId',
    'asset_id': 'assetId',
    'binding_id': 'bindingId', 
    'profile_id': 'profileId',
    'fulfillment_id': 'fulfillmentId',
    
    # Keep existing semantic fields
    'organization_id': 'organizationId',
    'wallet_id': 'walletId',
    'transaction_id': 'transactionId',
    'request_id': 'requestId',
}

# Generic 'id' field patterns to replace based on context
CONTEXT_ID_MAPPINGS = {
    'application': 'applicationId',
    'asset': 'assetId',
    'binding': 'bindingId',
    'profile': 'profileId', 
    'fulfillment': 'fulfillmentId',
    'business': 'businessId',  # If we have business entities
}

def find_frontend_files(directory):
    """Find all TypeScript and React files in the frontend directory."""
    extensions = ['.ts', '.tsx', '.js', '.jsx']
    frontend_files = []
    
    for root, dirs, files in os.walk(directory):
        # Skip node_modules and build directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', 'dist', 'build', '.next']]
        
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                frontend_files.append(os.path.join(root, file))
    
    return frontend_files

def update_type_definitions(content):
    """Update TypeScript interface and type definitions."""
    
    # Update interface property definitions
    for db_field, frontend_field in FIELD_MAPPINGS.items():
        # Property definitions in interfaces
        content = re.sub(
            rf'\b{db_field}(\??):\s*([^;,\n]+)',
            rf'{frontend_field}\1: \2',
            content
        )
    
    # Update generic 'id' fields based on interface name context
    for context, semantic_id in CONTEXT_ID_MAPPINGS.items():
        # Match interface definitions and update id fields within them
        pattern = r'(interface\s+' + context.title() + r'[^{]*\{[^}]*?)(\bid\s*\??\s*:\s*[^;,\n]+)'
        replacement = r'\1' + semantic_id + r': \2'
        content = re.sub(pattern, replacement, content, flags=re.IGNORECASE | re.DOTALL)
    
    return content

def update_api_calls(content):
    """Update API calls and fetch operations."""
    
    # Update URL parameters in API calls
    for context, semantic_id in CONTEXT_ID_MAPPINGS.items():
        # API routes with generic id parameter
        content = re.sub(
            rf'/api/({context}[^/]*)/\$\{{([^}}]+)\.id\}}',
            r'/api/\1/${\2.' + semantic_id + r'}',
            content
        )
        
        # Query parameters
        content = re.sub(
            rf'[?&]id=\$\{{([^}}]*{context}[^}}]*)\.id\}}',
            r'?id=${\1.' + semantic_id + r'}',
            content
        )
    
    # Update request body transformations
    content = re.sub(
        r'(\w+)_id:\s*([^,\n}]+)',
        lambda m: f'{FIELD_MAPPINGS.get(m.group(1) + "_id", m.group(1) + "_id")}: {m.group(2)}',
        content
    )
    
    return content

def update_component_props(content):
    """Update React component props and state."""
    
    # Update prop destructuring
    for db_field, frontend_field in FIELD_MAPPINGS.items():
        # Destructuring patterns
        content = re.sub(
            r'\{\s*([^}]*?)\b' + db_field + r'\b([^}]*?)\}',
            lambda m: m.group(0).replace(db_field, frontend_field),
            content
        )
    
    # Update object property access
    for db_field, frontend_field in FIELD_MAPPINGS.items():
        content = re.sub(
            rf'\.{db_field}\b',
            f'.{frontend_field}',
            content
        )
    
    # Update generic id access based on variable context
    for context, semantic_id in CONTEXT_ID_MAPPINGS.items():
        # Variable.id patterns where variable name suggests context
        content = re.sub(
            rf'\b({context}[A-Za-z]*)\.id\b',
            r'\1.' + semantic_id,
            content,
            flags=re.IGNORECASE
        )
    
    return content

def update_state_management(content):
    """Update state management (useState, useEffect, etc.)."""
    
    # Update useState initial values
    for db_field, frontend_field in FIELD_MAPPINGS.items():
        content = re.sub(
            rf'(\w+):\s*["\']?{db_field}["\']?',
            rf'\1: "{frontend_field}"',
            content
        )
    
    # Update object spread operations
    content = re.sub(
        r'\.\.\.(\w+),\s*id:\s*([^,}]+)',
        lambda m: f'...{m.group(1)}, {get_semantic_id_for_variable(m.group(1))}: {m.group(2)}',
        content
    )
    
    return content

def update_form_handling(content):
    """Update form field names and validation."""
    
    # Update form field names
    for db_field, frontend_field in FIELD_MAPPINGS.items():
        # Input name attributes
        content = re.sub(
            rf'name=["\']?{db_field}["\']?',
            f'name="{frontend_field}"',
            content
        )
        
        # Form data keys
        content = re.sub(
            r'["\']?' + db_field + r'["\']?\s*:\s*([^,\n}]+)',
            f'"{frontend_field}": \\1',
            content
        )
    
    return content

def update_table_columns(content):
    """Update table column definitions and data access."""
    
    # Update column key definitions
    for db_field, frontend_field in FIELD_MAPPINGS.items():
        # Table column keys
        content = re.sub(
            rf'key:\s*["\']?{db_field}["\']?',
            f'key: "{frontend_field}"',
            content
        )
        
        # DataIndex in table columns
        content = re.sub(
            rf'dataIndex:\s*["\']?{db_field}["\']?',
            f'dataIndex: "{frontend_field}"',
            content
        )
    
    return content

def get_semantic_id_for_variable(variable_name):
    """Get the appropriate semantic ID field for a variable name."""
    variable_lower = variable_name.lower()
    
    for context, semantic_id in CONTEXT_ID_MAPPINGS.items():
        if context in variable_lower:
            return semantic_id
    
    return 'id'  # fallback

def update_file_content(file_path):
    """Update a single file's content."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply all transformations
        content = update_type_definitions(content)
        content = update_api_calls(content)
        content = update_component_props(content)
        content = update_state_management(content)
        content = update_form_handling(content)
        content = update_table_columns(content)
        
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

def create_api_utils_update():
    """Update the API utilities to handle semantic IDs."""
    
    api_utils_content = '''/**
 * Enhanced API utilities with semantic ID support
 * Updated to handle camelCase semantic IDs throughout the application
 */

export const ENV_CONFIG = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
} as const;

/**
 * Build API URL without double slashes
 */
export function buildApiUrl(path: string): string {
  const baseUrl = ENV_CONFIG.API_URL.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Create standardized auth headers
 */
export function createAuthHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Transform API response to use semantic IDs
 */
export function transformApiResponse<T extends Record<string, any>>(
  data: T,
  entityType?: string
): T {
  if (!data || typeof data !== 'object') return data;
  
  const transformed = { ...data };
  
  // Transform database snake_case to frontend camelCase
  const fieldMappings: Record<string, string> = {
    application_id: 'applicationId',
    asset_id: 'assetId',
    binding_id: 'bindingId',
    profile_id: 'profileId',
    fulfillment_id: 'fulfillmentId',
    organization_id: 'organizationId',
    wallet_id: 'walletId',
    transaction_id: 'transactionId',
    request_id: 'requestId',
  };
  
  Object.keys(fieldMappings).forEach(dbField => {
    if (dbField in transformed) {
      const frontendField = fieldMappings[dbField];
      transformed[frontendField] = transformed[dbField];
      delete transformed[dbField];
    }
  });
  
  // Handle nested objects and arrays
  Object.keys(transformed).forEach(key => {
    if (Array.isArray(transformed[key])) {
      transformed[key] = transformed[key].map((item: any) => 
        transformApiResponse(item, entityType)
      );
    } else if (transformed[key] && typeof transformed[key] === 'object') {
      transformed[key] = transformApiResponse(transformed[key], entityType);
    }
  });
  
  return transformed;
}

/**
 * Transform frontend request to database format
 */
export function transformToDatabase<T extends Record<string, any>>(data: T): T {
  if (!data || typeof data !== 'object') return data;
  
  const transformed = { ...data };
  
  // Transform frontend camelCase to database snake_case
  const fieldMappings: Record<string, string> = {
    applicationId: 'application_id',
    assetId: 'asset_id',
    bindingId: 'binding_id',
    profileId: 'profile_id',
    fulfillmentId: 'fulfillment_id',
    organizationId: 'organization_id',
    walletId: 'wallet_id',
    transactionId: 'transaction_id',
    requestId: 'request_id',
  };
  
  Object.keys(fieldMappings).forEach(frontendField => {
    if (frontendField in transformed) {
      const dbField = fieldMappings[frontendField];
      transformed[dbField] = transformed[frontendField];
      delete transformed[frontendField];
    }
  });
  
  return transformed;
}

/**
 * Enhanced fetch wrapper with semantic ID transformation
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit & { transform?: boolean } = {}
): Promise<T> {
  const { transform = true, ...fetchOptions } = options;
  
  const url = buildApiUrl(endpoint);
  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...createAuthHeaders(),
      ...fetchOptions.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  return transform ? transformApiResponse(data) : data;
}

/**
 * GET request with semantic ID transformation
 */
export function apiGet<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request with semantic ID transformation
 */
export function apiPost<T = any>(
  endpoint: string, 
  body?: any, 
  options?: RequestInit
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(transformToDatabase(body)) : undefined,
  });
}

/**
 * PUT request with semantic ID transformation
 */
export function apiPut<T = any>(
  endpoint: string, 
  body?: any, 
  options?: RequestInit
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(transformToDatabase(body)) : undefined,
  });
}

/**
 * DELETE request
 */
export function apiDelete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}
'''

    # Write the updated API utils
    os.makedirs('frontend/src/lib', exist_ok=True)
    with open('frontend/src/lib/api-utils.ts', 'w') as f:
        f.write(api_utils_content)
    
    print("✅ Updated API utilities: frontend/src/lib/api-utils.ts")

def create_hook_updates():
    """Create updated hooks for semantic ID handling."""
    
    hooks_content = '''/**
 * Updated hooks with semantic ID support
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-utils';

// Application hooks
export function useApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: () => apiGet('/admin/applications'),
  });
}

export function useApplication(applicationId: string) {
  return useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => apiGet(`/admin/applications/${applicationId}`),
    enabled: !!applicationId,
  });
}

// Asset hooks  
export function useAssets() {
  return useQuery({
    queryKey: ['assets'],
    queryFn: () => apiGet('/admin/assets'),
  });
}

export function useAsset(assetId: string) {
  return useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => apiGet(`/admin/assets/${assetId}`),
    enabled: !!assetId,
  });
}

// Asset binding hooks
export function useAssetBindings(organizationId?: string) {
  return useQuery({
    queryKey: ['asset-bindings', organizationId],
    queryFn: () => apiGet(`/admin/asset-bindings${organizationId ? `?organizationId=${organizationId}` : ''}`),
  });
}

// Mutation hooks with semantic IDs
export function useCreateApplication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiPost('/applications', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ applicationId, ...data }: any) => 
      apiPut(`/admin/applications/${applicationId}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application', variables.applicationId] });
    },
  });
}

export function useBindAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { assetId: string; organizationId: string }) => 
      apiPost('/admin/assets/bind', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-bindings'] });
    },
  });
}

export function useUnbindAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (bindingId: string) => 
      apiDelete(`/admin/asset-bindings/${bindingId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-bindings'] });
    },
  });
}
'''

    os.makedirs('frontend/src/hooks', exist_ok=True)
    with open('frontend/src/hooks/semantic-id-hooks.ts', 'w') as f:
        f.write(hooks_content)
    
    print("✅ Created semantic ID hooks: frontend/src/hooks/semantic-id-hooks.ts")

def main():
    """Main migration function."""
    print("🚀 Starting Frontend Semantic ID Migration")
    print("=" * 50)
    
    # Find all frontend files
    frontend_dir = "frontend/src"
    if not os.path.exists(frontend_dir):
        print(f"❌ Frontend directory not found: {frontend_dir}")
        return
    
    frontend_files = find_frontend_files(frontend_dir)
    print(f"📁 Found {len(frontend_files)} frontend files to update")
    
    # Update each file
    updated_count = 0
    for file_path in frontend_files:
        if update_file_content(file_path):
            updated_count += 1
    
    # Create supporting files
    create_api_utils_update()
    create_hook_updates()
    
    print("\n" + "=" * 50)
    print(f"✅ Frontend Migration Complete!")
    print(f"📊 Updated {updated_count} out of {len(frontend_files)} files")
    print(f"📝 Created updated API utilities and hooks")
    print("\n🔄 Next Steps:")
    print("1. Update remaining type definitions manually")
    print("2. Test all components and pages") 
    print("3. Update any hardcoded field references")
    print("4. Run TypeScript compiler to check for errors")

if __name__ == "__main__":
    main() 
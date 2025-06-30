import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // SECURE: Always require authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.organization_id) {
        return NextResponse.json({ error: 'User organization not found.' }, { status: 404 });
    }
    
    const organizationId = profile.organization_id;
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const bmId = searchParams.get('bm_id');

    // Use the NEW schema (asset + asset_binding) via RPC function
    console.log('🔍 Using NEW schema RPC for ad accounts, organization:', organizationId);

    const { data: assets, error } = await supabase.rpc('get_organization_assets', {
      p_organization_id: organizationId,
      p_asset_type: 'ad_account'
    });

    if (error) {
      console.error('Error fetching ad accounts from NEW schema:', error);
      return NextResponse.json({ error: 'Failed to fetch ad accounts' }, { status: 500 });
    }

    console.log('🔍 NEW schema returned:', assets?.length || 0, 'ad accounts');

    // Transform to match expected frontend format
    const enrichedData = (assets || []).map((asset: any) => {
      const metadata = asset.metadata || {};
      
      console.log('🔍 Processing asset:', {
        name: asset.name,
        dolphin_id: asset.dolphin_id,
        metadata: metadata
      });
      
      return {
        id: asset.id,
        name: asset.name || `Account ${asset.id?.substring(0, 8) || 'Unknown'}`,
        ad_account_id: metadata.ad_account_id || asset.dolphin_id || 'unknown',
        dolphin_account_id: asset.dolphin_id || 'unknown',
        business_manager_name: metadata.business_manager || metadata.business_manager_name || 'N/A',
        business_manager_id: metadata.business_manager_id || 'unknown',
        status: asset.status || 'unknown',
        balance_cents: Math.round(((metadata.spend_cap || 0) - (metadata.amount_spent || 0)) * 100),
        spend_cents: Math.round((metadata.amount_spent || 0) * 100),
        binding_status: 'active',
        last_sync_at: asset.last_synced_at,
        
        // Additional useful metrics
        timezone: metadata.timezone_id || 'UTC',
        bound_at: asset.bound_at,
        binding_id: asset.binding_id
      };
    });

    // Filter by business manager if specified (additional client-side filtering)
    let filteredData = enrichedData;
    if (bmId) {
      console.log('🔍 Filtering by BM ID:', bmId);
      filteredData = enrichedData.filter((account: any) => 
        account.business_manager_id === bmId
      );
      console.log('🔍 Filtered to:', filteredData.length, 'accounts');
    }

    return NextResponse.json({ accounts: filteredData });

  } catch (error) {
    console.error('Error in ad-accounts API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// TODO: PATCH and DELETE handlers need to be implemented for Dolphin assets
// The current implementation was trying to modify the legacy 'ad_accounts' table
// which causes runtime errors since GET returns Dolphin assets with different IDs.
// 
// These operations should either:
      // 1. Update the binding status in 'asset_binding' table to 'inactive', or  
      // 2. Make API calls to Dolphin Cloud to modify the actual Facebook accounts
//
// For now, these endpoints are removed to prevent data corruption.
// Implement proper Dolphin asset management in a future update.

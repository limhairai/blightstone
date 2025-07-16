import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

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
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile || !profile.organization_id) {
        console.error('User profile missing organization_id:', { profileError, profile });
        return NextResponse.json({ 
          accounts: [], 
          message: 'No organization assigned to user. Please contact support.' 
        });
    }
    
    const organizationId = profile.organization_id;
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const bmId = searchParams.get('bm_id');

    // Use the NEW schema (asset + asset_binding) via RPC function
    // console.log('🔍 Using NEW schema RPC for ad accounts, organization:', organizationId);

    const { data: assets, error } = await supabase.rpc('get_organization_assets', {
      p_organization_id: organizationId,
      p_asset_type: 'ad_account'
    });

    if (error) {
      console.error('Error fetching ad accounts from NEW schema:', error);
      return NextResponse.json({ error: 'Failed to fetch ad accounts' }, { status: 500 });
    }

    // Get all business managers for this organization to create a lookup map
    const { data: businessManagers, error: bmError } = await supabase.rpc('get_organization_assets', {
      p_organization_id: organizationId,
      p_asset_type: 'business_manager'
    });

    if (bmError) {
      console.error('Error fetching business managers:', bmError);
    }

    // Create a lookup map for business manager info: dolphin_id -> {name, id}
    const bmLookup = new Map();
    if (businessManagers) {
      businessManagers.forEach((bm: any) => {
        bmLookup.set(bm.dolphin_id, {
          name: bm.name,
          id: bm.dolphin_id
        });
      });
    }

    // Transform to match expected frontend format
    const enrichedData = (assets || []).map((asset: any) => {
      const metadata = asset.metadata || {};
      
      // Try to get business manager info from metadata first, then from lookup
      let businessManagerName = metadata.business_manager || metadata.business_manager_name;
      let businessManagerId = metadata.business_manager_id;
      
      // If metadata doesn't have BM info, try to find it from the lookup
      if ((!businessManagerName || businessManagerName === 'N/A') && businessManagerId) {
        const bmInfo = bmLookup.get(businessManagerId);
        if (bmInfo) {
          businessManagerName = bmInfo.name;
        }
      }
      
      // If still no BM info and we have any BM in the organization, use the first one as fallback
      if (!businessManagerName || businessManagerName === 'N/A') {
        const firstBM = businessManagers?.[0];
        if (firstBM) {
          businessManagerName = firstBM.name;
          businessManagerId = firstBM.dolphin_id;
        }
      }
      
      return {
        id: asset.asset_id || asset.id,
        asset_id: asset.asset_id || asset.id,
        name: asset.name || `Account ${(asset.asset_id || asset.id)?.substring(0, 8) || 'Unknown'}`,
        ad_account_id: metadata.ad_account_id || asset.dolphin_id || 'unknown',
        dolphin_account_id: asset.dolphin_id || 'unknown',
        business_manager_name: businessManagerName || 'N/A',
        business_manager_id: businessManagerId || 'unknown',
        status: asset.status || 'unknown',
        is_active: asset.is_active !== undefined ? asset.is_active : true, // Client-controlled activation
        // Use Dolphin's balance field directly instead of calculated balance
        balance_cents: Math.round((metadata.balance || 0) * 100),
        spend_cents: Math.round((metadata.amount_spent || 0) * 100),
        // spend_cap from Facebook/Dolphin - handle missing metadata gracefully
        spend_cap_cents: metadata.spend_cap || 0,
        binding_status: 'active',
        last_sync_at: asset.last_synced_at,
        
        // Additional useful metrics
        timezone: metadata.timezone_id || 'UTC',
        bound_at: asset.bound_at,
        binding_id: asset.binding_id,
        metadata: metadata // Include full metadata for pixel_id and other data
      };
    });

    // Filter by business manager if specified (additional client-side filtering)
    let filteredData = enrichedData;
    if (bmId) {
      filteredData = enrichedData.filter((account: any) => 
        account.business_manager_id === bmId
      );
    }

    const response = NextResponse.json({ accounts: filteredData });
    
    // PERFORMANCE: Optimized cache headers with stale-while-revalidate
    response.headers.set('Cache-Control', 'private, max-age=90, s-maxage=90, stale-while-revalidate=180');
    response.headers.set('Vary', 'Authorization');
    
    return response;

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

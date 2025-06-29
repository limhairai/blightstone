import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const bmId = searchParams.get('bm_id');

    // Query ad accounts bound to this organization
    const { data: boundAssets, error: assetsError } = await supabase
      .from('asset_binding')
      .select(`
        id,
        asset_id,
        bound_at,
        asset:asset_id (
          id,
          name,
          type,
          dolphin_id,
          status,
          metadata,
          last_synced_at
        )
      `)
      .eq('organization_id', profile.organization_id)
      .eq('status', 'active')
      .eq('asset.type', 'ad_account');

    if (assetsError) {
      console.error('Error fetching ad accounts:', assetsError);
      return NextResponse.json({ error: assetsError.message }, { status: 500 });
    }

    // Filter by business manager if specified
    let filteredAssets = boundAssets || [];
    if (bmId) {
      console.log('Filtering by BM ID:', bmId);
      console.log('Available assets:', boundAssets?.map(b => ({
        id: b.asset?.id,
        name: b.asset?.name,
        bm_id_in_metadata: b.asset?.metadata?.business_manager_id,
        dolphin_id: b.asset?.dolphin_id
      })));
      
      filteredAssets = filteredAssets.filter((binding: any) => 
        binding.asset?.metadata?.business_manager_id === bmId
      );
      
      console.log('Filtered assets:', filteredAssets.length);
    }

    // Filter out bindings with null/undefined assets
    const validAssets = filteredAssets.filter((binding: any) => binding.asset && binding.asset.id);

    // Transform the data to match the expected format for backward compatibility
    const enrichedData = validAssets.map((binding: any) => {
      const asset = binding.asset;
      const metadata = asset?.metadata || {};
      
      // Debug: Log asset processing
      if (process.env.NODE_ENV === 'development') {
        console.log('Processing asset:', {
          id: asset?.id,
          name: asset?.name,
          metadata: metadata,
          business_manager_name: metadata.business_manager_name
        });
      }
      
      return {
        id: asset?.id,
        name: asset?.name,
        ad_account_id: metadata.ad_account_id || asset?.dolphin_id,
        dolphin_account_id: asset?.dolphin_id,
        business_manager_name: metadata.business_manager || metadata.business_manager_name || 'N/A',
        business_manager_id: metadata.business_manager_id,
        status: asset?.status,
        balance_cents: Math.round(((metadata.spend_cap || 0) - (metadata.amount_spent || 0)) * 100),
        spend_cents: Math.round((metadata.amount_spent || 0) * 100), // Total lifetime spend
        binding_status: 'active', // Since we only get active bindings
        last_sync_at: asset?.last_synced_at,
        
        // Additional useful metrics
        timezone: metadata.timezone_id || 'UTC',
        bound_at: binding.bound_at,
        binding_id: binding.id
      };
    });

    return NextResponse.json({ accounts: enrichedData });

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
// 1. Update the binding status in 'client_asset_bindings' table, or  
// 2. Make API calls to Dolphin Cloud to modify the actual Facebook accounts
//
// For now, these endpoints are removed to prevent data corruption.
// Implement proper Dolphin asset management in a future update.

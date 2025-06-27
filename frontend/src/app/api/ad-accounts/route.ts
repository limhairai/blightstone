import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthenticatedUser(request: NextRequest) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );
    return await supabase.auth.getUser();
}

// GET handler for fetching accounts - now uses Dolphin assets
export async function GET(request: NextRequest) {
  const { data: { user } } = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organization_id');
  if (!organizationId) return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const status = searchParams.get('status');
  const businessId = searchParams.get('business_id');
  const searchQuery = searchParams.get('search');
  
  try {
    // Get bound Dolphin ad accounts for this organization
    let query = supabaseAdmin
      .from('dolphin_assets')
      .select(`
        *,
        client_asset_bindings!inner(
          id,
          organization_id,
          business_id,
          spend_limit_cents,
          fee_percentage,
          status,
          bound_at,
          businesses(name)
        )
      `, { count: 'exact' })
      .eq('asset_type', 'ad_account')
      .eq('client_asset_bindings.organization_id', organizationId)
      .eq('client_asset_bindings.status', 'active');

    // Apply filters
    if (status && status !== 'all') query = query.eq('status', status);
    if (businessId && businessId !== 'all') query = query.eq('client_asset_bindings.business_id', businessId);
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,asset_id.ilike.%${searchQuery}%`);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order('discovered_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;
    
    // Transform the data to match the expected format
    const accounts = data?.map(asset => {
      const binding = asset.client_asset_bindings[0]; // Should only be one active binding
      const metadata = asset.asset_metadata || {};
      
      return {
        id: asset.id,
        name: asset.name,
        ad_account_id: metadata.ad_account_id || asset.asset_id,
        status: asset.status,
        health_status: asset.health_status,
        // Use Dolphin data directly
        balance_cents: Math.round((metadata.balance || 0) * 100), // Convert to cents
        spend_cents: Math.round((metadata.amount_spent || 0) * 100), // Convert to cents
        currency: metadata.currency || 'USD',
        // Binding info
        organization_id: binding.organization_id,
        business_id: binding.business_id,
        spend_limit_cents: binding.spend_limit_cents,
        fee_percentage: binding.fee_percentage,
        bound_at: binding.bound_at,
        businesses: binding.businesses,
        // Dolphin metadata
        managing_profile: metadata.managing_profile,
        business_manager: metadata.business_manager,
        pixel_id: metadata.pixel_id,
        ads_count: metadata.ads_count || 0,
        last_sync_at: asset.last_sync_at,
        // Raw Dolphin data for debugging
        dolphin_status: metadata.status,
        full_dolphin_data: metadata.full_cab_data
      };
    }) || [];
    
    return NextResponse.json({
      accounts,
      totalCount: count,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching ad accounts:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Failed to fetch ad accounts', details: errorMessage }, { status: 500 });
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

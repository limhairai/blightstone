import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/business-managers
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

    // Get query parameters for organization selection
    const { searchParams } = new URL(request.url);
    const requestedOrgId = searchParams.get('organization_id');

    let organizationId: string;

    if (requestedOrgId) {
      // If organization_id is provided, verify the user has access to it
      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('organization_id', requestedOrgId)
        .single();

      const { data: ownership, error: ownershipError } = await supabase
        .from('organizations')
        .select('organization_id')
        .eq('owner_id', user.id)
        .eq('organization_id', requestedOrgId)
        .single();

      if ((membershipError && ownershipError) || (!membership && !ownership)) {
        return NextResponse.json({ 
          error: 'Access denied to requested organization' 
        }, { status: 403 });
      }

      organizationId = requestedOrgId;
    } else {
      // Fallback to user's profile organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('profile_id', user.id)
        .single();

      if (profileError || !profile || !profile.organization_id) {
        console.log('🔍 User profile missing organization_id:', { profileError, profile });
        return NextResponse.json([]);  // Return empty array instead of error
      }
      
      organizationId = profile.organization_id;
    }

    // Query business managers bound to this organization
    const { data: boundAssets, error: assetsError } = await supabase
      .from('asset_binding')
      .select(`
        binding_id,
        asset_id,
        bound_at,
        is_active,
        asset:asset_id (
          asset_id,
          name,
          type,
          dolphin_id,
          status,
          metadata
        )
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .eq('asset.type', 'business_manager');

    if (assetsError) {
      console.error('Error fetching business managers:', assetsError);
      return NextResponse.json({ error: assetsError.message }, { status: 500 });
    }

    // Get pending/processing/rejected applications for that org (only new BM requests)
    // Exclude cancelled applications from the results
    const { data: pendingApps, error: appsError } = await supabase
      .from('application')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('request_type', 'new_business_manager')
      .in('status', ['pending', 'processing', 'rejected']);

    if (appsError) {
      console.error('Error fetching pending applications:', appsError);
      return NextResponse.json({ error: appsError.message }, { status: 500 });
    }

    // Filter out bindings with null/undefined assets
    const validBoundAssets = (boundAssets || []).filter((binding: any) => 
      binding.asset && binding.asset.asset_id && binding.asset.name
    );

    // PERFORMANCE OPTIMIZATION: Fetch all data in 2 queries instead of N+1
    // Get all ad accounts for this organization in one query
    const { data: allAdAccounts, error: adAccountError } = await supabase
      .from('asset_binding')
      .select(`
        asset:asset_id (
          type,
          metadata
        )
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .eq('is_active', true)
      .eq('asset.type', 'ad_account');

    // Get all domains for all BMs in one query
    const bmAssetIds = validBoundAssets.map((binding: any) => binding.asset?.asset_id).filter(Boolean);
    const { data: allDomains, error: domainError } = await supabase
      .from('bm_domains')
      .select('bm_asset_id, domain_url')
      .in('bm_asset_id', bmAssetIds)
      .eq('is_active', true)
      .order('domain_url');

    // Create lookup maps for efficient processing
    const adAccountsByBM = new Map<string, number>();
    const domainsByBM = new Map<string, string[]>();

    // Process ad accounts
    if (!adAccountError && allAdAccounts) {
      allAdAccounts.forEach((adBinding: any) => {
        const adAccountMetadata = adBinding.asset?.metadata;
        const bmDolphinId = adAccountMetadata?.business_manager_id;
        if (bmDolphinId) {
          adAccountsByBM.set(bmDolphinId, (adAccountsByBM.get(bmDolphinId) || 0) + 1);
        }
      });
    }

    // Process domains
    if (!domainError && allDomains) {
      allDomains.forEach((domain: any) => {
        const bmAssetId = domain.bm_asset_id;
        if (!domainsByBM.has(bmAssetId)) {
          domainsByBM.set(bmAssetId, []);
        }
        domainsByBM.get(bmAssetId)!.push(domain.domain_url);
      });
    }

    // Build business managers with counts (no more async operations!)
    const businessManagersWithCounts = validBoundAssets.map((binding: any) => {
      const bmDolphinId = binding.asset?.dolphin_id;
      const bmAssetId = binding.asset?.asset_id;
      
      const adAccountCount = bmDolphinId ? (adAccountsByBM.get(bmDolphinId) || 0) : 0;
      const domains = bmAssetId ? (domainsByBM.get(bmAssetId) || []) : [];
      const domainCount = domains.length;

      return {
        id: binding.asset?.dolphin_id, // Use dolphin_id for consistency with ad account filtering
        name: binding.asset?.name,
        status: binding.asset?.status,
        is_active: binding.is_active, // Client-controlled activation status
        created_at: binding.bound_at,
        ad_account_count: adAccountCount, // Use calculated count instead of metadata
        domain_count: domainCount, // Add domain count
        domains: domains, // Add actual domains array
        dolphin_business_manager_id: binding.asset?.dolphin_id,
        binding_id: binding.binding_id,
        asset_id: binding.asset?.asset_id // Keep the actual asset ID for reference
      };
    });

    // Format pending/processing/rejected applications as business managers
    const formattedPendingApps = (pendingApps || []).map((app: any) => ({
      id: `app-${app.application_id || app.id || 'unknown'}`,
      name: app.name || `Application ${(app.application_id || app.id || 'unknown').toString().substring(0, 8)}...`,
      status: app.status === 'pending' ? 'pending' : app.status === 'processing' ? 'processing' : app.status === 'rejected' ? 'rejected' : 'pending',
      created_at: app.created_at,
      ad_account_count: 0,
      domain_count: 0, // Applications don't have domains yet
      dolphin_business_manager_id: null,
      is_application: true,
      application_id: app.application_id || app.id,
      organization_id: app.organization_id
    }));

    const response = NextResponse.json([...businessManagersWithCounts, ...formattedPendingApps]);
    
    // PERFORMANCE: Add optimized cache headers for better performance
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error) {
    console.error('Error in business managers API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/business-managers?id=<uuid>
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const businessManagerId = searchParams.get('id');

    if (!businessManagerId) {
        return NextResponse.json({ error: 'Business Manager ID is required' }, { status: 400 });
    }

    try {
        // For our new schema, we need to unbind the asset
        const { error } = await supabase
            .from('asset_binding')
            .update({ status: 'inactive' })
            .eq('asset_id', businessManagerId)
            .eq('status', 'active');
        
        if (error) {
            console.error('Error unbinding business manager:', error);
            throw new Error(error.message);
        }

        return NextResponse.json({ message: 'Business Manager unbound successfully.' });

    } catch (error) {
        console.error('Failed to unbind business manager:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
} 
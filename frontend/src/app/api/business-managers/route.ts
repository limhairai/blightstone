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

    // Get organization from authenticated user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
              .eq('profile_id', user.id)
      .single();

    if (profileError || !profile || !profile.organization_id) {
      console.log('🔍 User profile missing organization_id:', { profileError, profile });
      return NextResponse.json([]);  // Return empty array instead of error
    }
    
    const organizationId = profile.organization_id;

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

    // Calculate ad account count for each business manager by counting actual ad accounts
    const businessManagersWithCounts = await Promise.all(
      validBoundAssets.map(async (binding: any) => {
        const bmDolphinId = binding.asset?.dolphin_id;
        
        // Count ad accounts bound to this business manager
        let adAccountCount = 0;
        if (bmDolphinId) {
          const { data: adAccountBindings, error: adAccountError } = await supabase
            .from('asset_binding')
            .select(`
              asset:asset_id (
                type,
                metadata
              )
            `)
            .eq('organization_id', organizationId)
            .eq('status', 'active')
            .eq('is_active', true) // Only count active assets
            .eq('asset.type', 'ad_account');

          if (!adAccountError && adAccountBindings) {
            // Filter ad accounts that belong to this business manager
            adAccountCount = adAccountBindings.filter((adBinding: any) => {
              const adAccountMetadata = adBinding.asset?.metadata;
              return adAccountMetadata?.business_manager_id === bmDolphinId;
            }).length;
          }
        }

        return {
          id: binding.asset?.dolphin_id, // Use dolphin_id for consistency with ad account filtering
          name: binding.asset?.name,
          status: binding.asset?.status,
          is_active: binding.is_active, // Client-controlled activation status
          created_at: binding.bound_at,
          ad_account_count: adAccountCount, // Use calculated count instead of metadata
          dolphin_business_manager_id: binding.asset?.dolphin_id,
          binding_id: binding.binding_id,
          asset_id: binding.asset?.asset_id // Keep the actual asset ID for reference
        };
      })
    );

    // Format pending/processing/rejected applications as business managers
    const formattedPendingApps = (pendingApps || []).map((app: any) => ({
      id: `app-${app.application_id || app.id || 'unknown'}`,
      name: app.name || `Application ${(app.application_id || app.id || 'unknown').toString().substring(0, 8)}...`,
      status: app.status === 'pending' ? 'pending' : app.status === 'processing' ? 'processing' : app.status === 'rejected' ? 'rejected' : 'pending',
      created_at: app.created_at,
      ad_account_count: 0,
      dolphin_business_manager_id: null,
      is_application: true,
      application_id: app.application_id || app.id,
      organization_id: app.organization_id
    }));

    return NextResponse.json([...businessManagersWithCounts, ...formattedPendingApps], {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Vary': 'Authorization'
      }
    });

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
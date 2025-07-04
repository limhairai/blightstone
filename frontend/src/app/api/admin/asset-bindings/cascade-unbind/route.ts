import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/admin/asset-bindings/cascade-unbind
export async function POST(request: NextRequest) {
  try {
    const { asset_id, admin_user_id } = await request.json();

    if (!asset_id || !admin_user_id) {
      return NextResponse.json(
        { message: "Missing required fields: asset_id, admin_user_id" },
        { status: 400 }
      );
    }

    // Get the asset to check if it's a business manager
    const { data: asset, error: assetError } = await supabase
      .from('asset')
      .select('*')
      .eq('asset_id', asset_id)
      .single();

    if (assetError || !asset) {
      return NextResponse.json(
        { message: "Asset not found", error: assetError?.message },
        { status: 404 }
      );
    }

    let unboundCount = 0;
    const unboundAssets: string[] = [];

    // If it's a business manager, find and unbind all associated ad accounts
    if (asset.type === 'business_manager') {
      // Find all ad accounts that belong to this business manager
      const { data: associatedAdAccounts, error: adAccountsError } = await supabase
        .from('asset_binding')
        .select(`
          *,
          asset!inner(*)
        `)
        .eq('asset.type', 'ad_account')
        .eq('asset.metadata->>business_manager_id', asset.dolphin_id)
        .eq('status', 'active');

      if (adAccountsError) {
        console.error("Error fetching associated ad accounts:", adAccountsError);
        return NextResponse.json(
          { message: "Failed to fetch associated ad accounts", error: adAccountsError.message },
          { status: 500 }
        );
      }

      // Unbind all associated ad accounts
      if (associatedAdAccounts && associatedAdAccounts.length > 0) {
        const adAccountBindingIds = associatedAdAccounts.map(binding => binding.binding_id);
        
        const { error: unbindError } = await supabase
          .from('asset_binding')
          .update({ 
            status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .in('id', adAccountBindingIds);

        if (unbindError) {
          console.error("Error unbinding associated ad accounts:", unbindError);
          return NextResponse.json(
            { message: "Failed to unbind associated ad accounts", error: unbindError.message },
            { status: 500 }
          );
        }

        unboundCount += associatedAdAccounts.length;
        unboundAssets.push(...associatedAdAccounts.map(binding => binding.asset.name));
      }
    }

    // Unbind the main asset (business manager or standalone ad account)
    const { error: mainUnbindError } = await supabase
      .from('asset_binding')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('asset_id', asset_id)
      .eq('status', 'active');

    if (mainUnbindError) {
      console.error("Error unbinding main asset:", mainUnbindError);
      return NextResponse.json(
        { message: "Failed to unbind main asset", error: mainUnbindError.message },
        { status: 500 }
      );
    }

    unboundCount += 1;
    unboundAssets.push(asset.name);

    return NextResponse.json({
      message: "Assets unbound successfully",
      unbound_count: unboundCount,
      unbound_assets: unboundAssets
    });

  } catch (error: any) {
    console.error("Failed to cascade unbind assets:", error);
    return NextResponse.json(
      { message: "Failed to cascade unbind assets", error: error.message },
      { status: 500 }
    );
  }
} 
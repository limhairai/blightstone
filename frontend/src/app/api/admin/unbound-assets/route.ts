import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/unbound-assets?type=<type>&business_manager_id=<bm_id>
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // The dialog is for fulfilling BM applications, so we fetch 'business_manager' assets.
  const assetType = searchParams.get('type') || 'business_manager'; 
  const businessManagerId = searchParams.get('business_manager_id');

  try {
    // First, get all assets of the requested type
    let assetsQuery = supabase
      .from('asset')
      .select('*')
      .eq('type', assetType);

    // If business_manager_id is provided, filter ad accounts by that BM
    if (businessManagerId && assetType === 'ad_account') {
      assetsQuery = assetsQuery.or(`metadata->>business_manager_id.eq.${businessManagerId},metadata->>business_manager_dolphin_id.eq.${businessManagerId},metadata->>bm_id.eq.${businessManagerId}`);
    }

    const { data: assets, error: assetsError } = await assetsQuery;

    if (assetsError) {
      console.error("Error fetching assets:", assetsError);
      return NextResponse.json({ message: "Failed to fetch assets", error: assetsError.message }, { status: 500 });
    }

    // Get all active bindings
    const { data: activeBindings, error: bindingsError } = await supabase
      .from('asset_binding')
      .select('asset_id')
      .eq('status', 'active');

    if (bindingsError) {
      console.error("Error fetching bindings:", bindingsError);
      return NextResponse.json({ message: "Failed to fetch bindings", error: bindingsError.message }, { status: 500 });
    }

    // Filter out assets that have active bindings
    const boundAssetIds = new Set(activeBindings?.map(b => b.asset_id) || []);
    const unboundAssets = assets?.filter(asset => !boundAssetIds.has(asset.asset_id)) || [];

    return NextResponse.json(unboundAssets);
  } catch (error: any) {
    console.error("Failed to fetch unbound assets:", error);
    return NextResponse.json({ message: "Failed to fetch unbound assets", error: error.message }, { status: 500 });
  }
}

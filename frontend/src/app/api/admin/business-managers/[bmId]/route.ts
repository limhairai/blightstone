import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/admin/business-managers/[bmId] - Get business manager details with associated ad accounts
export async function GET(
  request: NextRequest,
  { params }: { params: { bmId: string } }
) {
  try {
    const bmId = params.bmId;

    if (!bmId) {
      return NextResponse.json({ message: "Business Manager ID is required" }, { status: 400 });
    }

    // Get business manager asset
    const { data: bmAsset, error: bmError } = await supabase
      .from('asset')
      .select('*')
      .eq('asset_id', bmId)
      .eq('type', 'business_manager')
      .single();

    if (bmError || !bmAsset) {
      return NextResponse.json(
        { message: "Business Manager not found", error: bmError?.message },
        { status: 404 }
      );
    }

    // Get all ad accounts associated with this business manager
    const { data: adAccountBindings, error: adAccountsError } = await supabase
      .from('asset_binding')
      .select(`
        *,
        asset!inner(
          asset_id,
          type,
          dolphin_id,
          name,
          status,
          metadata
        ),
        organizations(name)
      `)
      .eq('asset.type', 'ad_account')
      .eq('asset.metadata->>business_manager_id', bmAsset.dolphin_id)
      .eq('status', 'active');

    if (adAccountsError) {
      console.error("Error fetching associated ad accounts:", adAccountsError);
      return NextResponse.json(
        { message: "Failed to fetch associated ad accounts", error: adAccountsError.message },
        { status: 500 }
      );
    }

    // Transform the data
    const adAccounts = adAccountBindings?.map(binding => {
      const asset = binding.asset;
      return {
        id: asset.asset_id,
        type: asset.type,
        dolphin_id: asset.dolphin_id,
        name: asset.name,
        status: asset.status,
        metadata: asset.metadata,
        binding_id: binding.binding_id,
        bound_at: binding.bound_at,
        organization_name: binding.organizations?.name
      };
    }) || [];

    return NextResponse.json({
      business_manager: {
        id: bmAsset.asset_id,
        type: bmAsset.type,
        dolphin_id: bmAsset.dolphin_id,
        name: bmAsset.name,
        status: bmAsset.status,
        metadata: bmAsset.metadata
      },
      ad_accounts: adAccounts,
      ad_account_count: adAccounts.length
    });

  } catch (error: any) {
    console.error("Failed to fetch business manager details:", error);
    return NextResponse.json(
      { message: "Failed to fetch business manager details", error: error.message },
      { status: 500 }
    );
  }
} 
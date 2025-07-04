import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const businessId = params.businessId;

    if (!businessId) {
      return NextResponse.json({ message: "Business ID is required" }, { status: 400 });
    }

    // Get business details
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('business_id', businessId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { message: "Business not found", error: businessError?.message },
        { status: 404 }
      );
    }

    // Get bound assets for this business
    const { data: bindings, error: bindingsError } = await supabase
      .from('asset_binding')
      .select(`
        *,
        asset!inner(
          id,
          type,
          dolphin_id,
          name,
          status,
          metadata
        )
      `)
      .eq('organization_id', business.organization_id)
      .eq('status', 'active')
      .eq('asset.type', 'ad_account');

    if (bindingsError) {
      console.error("Error fetching business assets:", bindingsError);
      return NextResponse.json(
        { message: "Failed to fetch business assets", error: bindingsError.message },
        { status: 500 }
      );
    }

    // Transform the data
    const assets = bindings?.map(binding => {
      const asset = binding.asset;
      return {
        id: asset.asset_id,
        type: asset.type,
        dolphin_id: asset.dolphin_id,
        name: asset.name,
        status: asset.status,
        metadata: asset.metadata,
        binding_id: binding.binding_id,
        bound_at: binding.bound_at
      };
    }) || [];

    return NextResponse.json({
      business,
      assets,
      asset_count: assets.length
    });

  } catch (error: any) {
    console.error("Failed to fetch business details:", error);
    return NextResponse.json(
      { message: "Failed to fetch business details", error: error.message },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/get-associated-ad-accounts?bm_dolphin_id=<id>
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bmDolphinId = searchParams.get('bm_dolphin_id');

  if (!bmDolphinId) {
    return NextResponse.json({ error: 'Business Manager Dolphin ID is required' }, { status: 400 });
  }

  try {
    // We need to find all ad_account assets that are:
    // 1. Associated with the given Business Manager's dolphin ID.
    // 2. Not already bound to any organization.
    const { data, error } = await supabase
      .from('dolphin_assets')
      .select('*, client_asset_bindings!left(asset_id)')
      .eq('asset_type', 'ad_account')
      .eq('asset_metadata->>business_manager_id', bmDolphinId)
      .is('client_asset_bindings.asset_id', null);

    if (error) {
      console.error("Error fetching associated ad accounts:", error);
      return NextResponse.json({ message: "Failed to fetch associated ad accounts", error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Failed to fetch associated ad accounts:", error);
    return NextResponse.json({ message: "Failed to fetch associated ad accounts", error: error.message }, { status: 500 });
  }
} 
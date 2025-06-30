import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/get-associated-ad-accounts?bm_dolphin_id=<dolphin_id>
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bmDolphinId = searchParams.get('bm_dolphin_id');

  if (!bmDolphinId) {
    return NextResponse.json({ message: "Missing bm_dolphin_id parameter" }, { status: 400 });
  }

  try {
    // Get ad accounts that belong to the specified business manager
    // and are not yet bound to any organization
    const { data, error } = await supabase
      .from('asset')
      .select('*, asset_binding!left(asset_id)')
      .eq('type', 'ad_account')
      .eq('metadata->>business_manager_id', bmDolphinId)
      .is('asset_binding.asset_id', null);

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
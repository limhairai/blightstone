import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/unbound-assets?type=<type>
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // The dialog is for fulfilling BM applications, so we fetch 'business_manager' assets.
  const assetType = searchParams.get('type') || 'business_manager'; 

  try {
    // This query performs a LEFT JOIN from asset to asset_binding
    // and returns only the rows from asset where there is no corresponding
    // binding, effectively giving us all unbound assets.
    const { data, error } = await supabase
      .from('asset')
      .select('*, asset_binding!left(id)')
      .eq('type', assetType)
      .is('asset_binding.id', null);

    if (error) {
      console.error("Error fetching unbound assets:", error);
      return NextResponse.json({ message: "Failed to fetch unbound assets", error: error.message }, { status: 500 });
    }

    // The query returns the nested binding as `asset_binding: null`, 
    // but the main objects are the correct unbound assets.
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Failed to fetch unbound assets:", error);
    return NextResponse.json({ message: "Failed to fetch unbound assets", error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
    }

    // Verify user has access to this organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.organization_id !== organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get business managers (now stored as assets) for this organization
    const { data: assets, error: assetsError } = await supabase.rpc('get_organization_assets', {
      p_organization_id: organizationId,
      p_asset_type: 'business_manager'
    });

    if (assetsError) {
      console.error('Error fetching business managers:', assetsError);
      return NextResponse.json({ error: assetsError.message }, { status: 500 });
    }

    // Transform assets to look like the old business manager format for backward compatibility
    const businesses = (assets || []).map((asset: any) => ({
      id: asset.id,
      name: asset.name,
      business_id: asset.dolphin_id, // Dolphin ID
      status: asset.status,
      created_at: asset.bound_at,
      organization_id: organizationId,
      // Additional fields that might be expected
      dolphin_business_manager_id: asset.dolphin_id,
      binding_id: asset.binding_id,
      metadata: asset.metadata
    }));

    return NextResponse.json({ businesses });

  } catch (error) {
    console.error('Error in businesses API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 
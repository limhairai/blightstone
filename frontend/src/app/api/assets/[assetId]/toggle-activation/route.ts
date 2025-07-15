import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuth } from '@/lib/auth-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    console.log('🔄 Asset toggle activation API called for asset:', params.assetId);
    
    const { user, error: authError } = await getAuth(request);
    if (!user || authError) {
      console.log('❌ Authentication failed:', authError);
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { is_active } = await request.json();
    const assetId = params.assetId;

    console.log('📝 Request data:', { assetId, is_active, userId: user.id });

    if (typeof is_active !== 'boolean') {
      console.log('❌ Invalid is_active value:', is_active);
      return NextResponse.json(
        { error: 'is_active must be a boolean' },
        { status: 400 }
      );
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { error: 'User organization not found' },
        { status: 404 }
      );
    }

    // Use the database function to toggle activation with cascading support
    console.log('🔄 Calling toggle_asset_activation_cascade with:', { 
      p_asset_id: assetId, 
      p_organization_id: profile.organization_id, 
      p_is_active: is_active 
    });
    
    const { data, error: dbError } = await supabase
      .rpc('toggle_asset_activation_cascade', {
        p_asset_id: assetId,
        p_organization_id: profile.organization_id,
        p_is_active: is_active
      });

    if (dbError) {
      console.error('❌ Error toggling asset activation:', dbError);
      return NextResponse.json(
        { error: 'Failed to toggle asset activation' },
        { status: 500 }
      );
    }
    
    console.log('✅ Database function result:', data);

    if (!data) {
      return NextResponse.json(
        { error: 'Asset not found or not owned by organization' },
        { status: 404 }
      );
    }

    // Get updated asset information
    const { data: assetBinding, error: bindingError } = await supabase
      .from('asset_binding')
      .select(`
        *,
        asset!inner(
          asset_id,
          type,
          name,
          dolphin_id,
          status
        )
      `)
      .eq('asset_id', assetId)
      .eq('organization_id', profile.organization_id)
      .eq('status', 'active')
      .single();

    if (bindingError) {
      console.error('Error fetching updated asset:', bindingError);
      return NextResponse.json(
        { error: 'Failed to fetch updated asset information' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Asset ${is_active ? 'activated' : 'deactivated'} successfully`,
      asset: {
        id: assetBinding.asset.asset_id,
        name: assetBinding.asset.name,
        type: assetBinding.asset.type,
        is_active: assetBinding.is_active,
        status: assetBinding.asset.status
      }
    });

  } catch (error) {
    console.error('Error in asset activation toggle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
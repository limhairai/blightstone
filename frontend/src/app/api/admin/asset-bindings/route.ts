import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BindAssetsRequest {
  asset_ids: string[];
  organization_id: string;
  business_id?: string;
  business_manager_id?: string;
  admin_user_id: string;
  application_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BindAssetsRequest = await request.json();
    const {
      asset_ids,
      organization_id,
      business_id,
      business_manager_id,
      admin_user_id,
      application_id,
    } = body;

    // 1. Application-driven: `application_id` is present.
    // 2. Manual binding: `application_id` is absent, `business_id` and `business_manager_id` must be present.

    let bm_id: string | null = null;
    if (application_id) {
      // Application-driven binding
      if (application_id.startsWith('biz-app-')) {
        bm_id = application_id.replace('biz-app-', '');
      }
    } else {
      // Manual binding
      if (!business_id || !business_manager_id) {
        return NextResponse.json(
          { message: "Missing required fields: business_id and business_manager_id are required for manual binding" },
          { status: 400 }
        );
      }
      bm_id = business_manager_id;
    }

    if (!asset_ids || !Array.isArray(asset_ids) || asset_ids.length === 0) {
      return NextResponse.json(
        { message: "Missing or invalid asset_ids array" },
        { status: 400 }
      );
    }

    if (!organization_id || !admin_user_id) {
      return NextResponse.json(
        { message: "Missing required fields: organization_id, admin_user_id" },
        { status: 400 }
      );
    }

    // Validate that all assets exist and are unbound
    const { data: assets, error: assetsError } = await supabase
      .from('asset')
      .select('*')
      .in('id', asset_ids);

    if (assetsError) {
      console.error("Error validating assets:", assetsError);
      return NextResponse.json(
        { message: "Failed to validate assets", error: assetsError.message },
        { status: 500 }
      );
    }

    if (!assets || assets.length !== asset_ids.length) {
      return NextResponse.json(
        { message: "Some assets not found or invalid" },
        { status: 400 }
      );
    }

    // Check if any assets are already bound
    const { data: existingBindings, error: bindingsError } = await supabase
      .from('asset_binding')
      .select('asset_id')
      .in('asset_id', asset_ids)
      .eq('status', 'active');

    if (bindingsError) {
      console.error("Error checking existing bindings:", bindingsError);
      return NextResponse.json(
        { message: "Failed to check existing bindings", error: bindingsError.message },
        { status: 500 }
      );
    }

    if (existingBindings && existingBindings.length > 0) {
      const boundAssetIds = existingBindings.map(b => b.asset_id);
      return NextResponse.json(
        { message: `Some assets are already bound: ${boundAssetIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Create bindings for all assets
    const bindings = asset_ids.map(asset_id => ({
      asset_id,
      organization_id,
      bound_by: admin_user_id,
      status: 'active'
    }));

    const { data: newBindings, error: insertError } = await supabase
      .from('asset_binding')
      .insert(bindings)
      .select();

    if (insertError) {
      console.error("Error creating asset bindings:", insertError);
      return NextResponse.json(
        { message: "Failed to create asset bindings", error: insertError.message },
        { status: 500 }
      );
    }

    // If this is application-driven binding, update the application status
    if (application_id) {
      if (application_id.startsWith('biz-app-')) {
        // Handle business manager application
        const actualApplicationId = application_id.replace('biz-app-', '');
        const { error: updateError } = await supabase
          .from('application')
          .update({
            status: 'fulfilled',
            fulfilled_by: admin_user_id,
            fulfilled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', application_id);

        if (updateError) {
          console.error("Error updating application status:", updateError);
          // Don't fail the whole operation for this
        }
      }
    }

    return NextResponse.json({
      message: "Assets bound successfully",
      bindings: newBindings,
      count: newBindings?.length || 0
    });

  } catch (error: any) {
    console.error("Failed to bind assets:", error);
    return NextResponse.json(
      { message: "Failed to bind assets", error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/admin/asset-bindings - Get all asset bindings
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('asset_binding')
      .select(`
        *,
        asset(*),
        organizations(name)
      `)
      .eq('status', 'active')
      .order('bound_at', { ascending: false });

    if (error) {
      console.error("Error fetching asset bindings:", error);
      return NextResponse.json(
        { message: "Failed to fetch asset bindings", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Failed to fetch asset bindings:", error);
    return NextResponse.json(
      { message: "Failed to fetch asset bindings", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
    const { asset_id } = await request.json();

    if (!asset_id) {
        return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    try {
        // Use NEW schema (asset_binding table)
        const { error: deleteError } = await supabase
            .from('asset_binding')
            .update({ status: 'inactive' })  // Soft delete
            .eq('asset_id', asset_id)
            .eq('status', 'active');

        if (deleteError) {
            throw new Error(`Failed to unbind asset: ${deleteError.message}`);
        }

        return NextResponse.json({ message: 'Asset unbound successfully.' });
    } catch (error) {
        console.error('Server error during unbinding:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 
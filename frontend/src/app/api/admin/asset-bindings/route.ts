import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BindAssetsRequest {
  assetIds: string[];
  organizationId: string;
  businessId?: string;
  businessManagerId?: string;
  adminUserId: string;
  applicationId?: string;
}

// Field mapping utility for transforming between database and frontend formats
const transformBindingToFrontend = (binding: any) => ({
  bindingId: binding.binding_id,
  assetId: binding.asset_id, // Fixed: Use asset_id not asset_ref_id
  organizationId: binding.organization_id,
  boundBy: binding.bound_by,
  status: binding.status,
  boundAt: binding.bound_at,
  createdAt: binding.created_at,
  updatedAt: binding.updated_at,
  asset: binding.asset ? {
    assetId: binding.asset.asset_id,
    name: binding.asset.name,
    type: binding.asset.type,
    dolphinId: binding.asset.dolphin_id,
    status: binding.asset.status,
    metadata: binding.asset.metadata
  } : null,
  organization: binding.organizations ? {
    name: binding.organizations.name
  } : null
})

export async function POST(request: NextRequest) {
  try {
    const body: BindAssetsRequest = await request.json();
    const {
      assetIds,
      organizationId,
      businessId,
      businessManagerId,
      adminUserId,
      applicationId,
    } = body;

    // 1. Application-driven: `applicationId` is present.
    // 2. Manual binding: `applicationId` is absent, `businessId` and `businessManagerId` must be present.

    let bm_id: string | null = null;
    if (applicationId) {
      // Application-driven binding
      if (applicationId.startsWith('biz-app-')) {
        bm_id = applicationId.replace('biz-app-', '');
      }
    } else {
      // Manual binding
      if (!businessId || !businessManagerId) {
        return NextResponse.json(
          { message: "Missing required fields: businessId and businessManagerId are required for manual binding" },
          { status: 400 }
        );
      }
      bm_id = businessManagerId;
    }

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        { message: "Missing or invalid assetIds array" },
        { status: 400 }
      );
    }

    if (!organizationId || !adminUserId) {
      return NextResponse.json(
        { message: "Missing required fields: organizationId, adminUserId" },
        { status: 400 }
      );
    }

    // Validate that all assets exist and are unbound using semantic IDs
    const { data: assets, error: assetsError } = await supabase
      .from('asset')
      .select('*')
      .in('asset_id', assetIds);

    if (assetsError) {
      console.error("Error validating assets:", assetsError);
      return NextResponse.json(
        { message: "Failed to validate assets", error: assetsError.message },
        { status: 500 }
      );
    }

    if (!assets || assets.length !== assetIds.length) {
      return NextResponse.json(
        { message: "Some assets not found or invalid" },
        { status: 400 }
      );
    }

    // Check if any assets are already bound using semantic IDs
    const { data: existingBindings, error: bindingsError } = await supabase
      .from('asset_binding')
      .select('asset_id')
      .in('asset_id', assetIds)
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

    // Create bindings for all assets using semantic IDs
    const bindings = assetIds.map(assetId => ({
      asset_id: assetId,
      organization_id: organizationId,
      bound_by: adminUserId,
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
    if (applicationId) {
      if (applicationId.startsWith('biz-app-')) {
        // Handle business manager application
        const actualApplicationId = applicationId.replace('biz-app-', '');
        const { error: updateError } = await supabase
          .from('application')
          .update({
            status: 'fulfilled',
            fulfilled_by: adminUserId,
            fulfilled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('application_id', applicationId);

        if (updateError) {
          console.error("Error updating application status:", updateError);
          // Don't fail the whole operation for this
        }
      }
    }

    // Transform response to frontend format
    const transformedBindings = newBindings?.map(transformBindingToFrontend) || [];

    // Trigger cache invalidation for immediate UI updates
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}`
      await fetch(`${baseUrl}/api/cache/invalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CACHE_INVALIDATION_SECRET || 'internal-cache-invalidation'}`
        },
        body: JSON.stringify({
          organizationId: organizationId,
          type: 'business-manager'
        })
      })
      console.log(`✅ Business manager cache invalidated for org: ${organizationId}`)
    } catch (cacheError) {
      console.error('Failed to invalidate business manager cache:', cacheError)
      // Don't fail the binding if cache invalidation fails
    }

    return NextResponse.json({
      message: "Assets bound successfully",
      bindings: transformedBindings,
      count: transformedBindings.length
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

    // Transform response to frontend format
    const transformedBindings = data?.map(transformBindingToFrontend) || [];

    return NextResponse.json(transformedBindings);
  } catch (error: any) {
    console.error("Failed to fetch asset bindings:", error);
    return NextResponse.json(
      { message: "Failed to fetch asset bindings", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
    const { assetId, organizationId } = await request.json();

    if (!assetId) {
        return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    try {
        // Get organization ID if not provided
        let orgId = organizationId;
        if (!orgId) {
            const { data: binding } = await supabase
                .from('asset_binding')
                .select('organization_id')
                .eq('asset_id', assetId)
                .eq('status', 'active')
                .single();
            orgId = binding?.organization_id;
        }

        // Use NEW schema (asset_binding table) with semantic IDs
        const { error: deleteError } = await supabase
            .from('asset_binding')
            .update({ status: 'inactive' })  // Soft delete
            .eq('asset_id', assetId)
            .eq('status', 'active');

        if (deleteError) {
            throw new Error(`Failed to unbind asset: ${deleteError.message}`);
        }

        // Trigger cache invalidation for immediate UI updates
        if (orgId) {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}`
                await fetch(`${baseUrl}/api/cache/invalidate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.CACHE_INVALIDATION_SECRET || 'internal-cache-invalidation'}`
                    },
                    body: JSON.stringify({
                        organizationId: orgId,
                        type: 'business-manager'
                    })
                })
                console.log(`✅ Business manager cache invalidated for org: ${orgId}`)
            } catch (cacheError) {
                console.error('Failed to invalidate business manager cache:', cacheError)
                // Don't fail the unbinding if cache invalidation fails
            }
        }

        return NextResponse.json({ message: 'Asset unbound successfully.' });
    } catch (error) {
        console.error('Server error during unbinding:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 
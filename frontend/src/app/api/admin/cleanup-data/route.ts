import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let cleanupResults = {
      orphaned_bindings_removed: 0,
      duplicate_applications_removed: 0,
      invalid_assets_removed: 0
    };

    // 1. Remove asset bindings that point to non-existent assets
    const { data: orphanedBindings } = await supabase
      .from('asset_binding')
      .select(`
        binding_id,
        asset_id,
        asset:asset_id (asset_id)
      `)
      .eq('status', 'active')
      .is('asset.asset_id', null);

    if (orphanedBindings && orphanedBindings.length > 0) {
      const orphanedIds = orphanedBindings.map(b => b.binding_id);
      const { error: deleteError } = await supabase
        .from('asset_binding')
        .delete()
        .in('binding_id', orphanedIds);

      if (!deleteError) {
        cleanupResults.orphaned_bindings_removed = orphanedIds.length;
      }
    }

    // 2. Remove duplicate applications (keep only the latest one per org+request_type)
    const { data: applications } = await supabase
      .from('application')
      .select('*')
      .order('created_at', { ascending: false });

    if (applications) {
      const seen = new Set();
      const duplicateIds = [];
      
      for (const app of applications) {
        const key = `${app.organization_id}-${app.request_type}`;
        if (seen.has(key)) {
          duplicateIds.push(app.application_id);
        } else {
          seen.add(key);
        }
      }

      if (duplicateIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('application')
          .delete()
          .in('application_id', duplicateIds);

        if (!deleteError) {
          cleanupResults.duplicate_applications_removed = duplicateIds.length;
        }
      }
    }

    // 3. Remove assets with null/empty names or IDs
    const { data: invalidAssets } = await supabase
      .from('asset')
      .select('asset_id')
      .or('name.is.null,dolphin_id.is.null,name.eq.,dolphin_id.eq.');

    if (invalidAssets && invalidAssets.length > 0) {
      const invalidIds = invalidAssets.map(a => a.asset_id);
      const { error: deleteError } = await supabase
        .from('asset')
        .delete()
        .in('asset_id', invalidIds);

      if (!deleteError) {
        cleanupResults.invalid_assets_removed = invalidIds.length;
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Database cleanup completed',
      results: cleanupResults
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 
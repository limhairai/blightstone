import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
    const { asset_id, organization_id } = await request.json();

    if (!asset_id || !organization_id) {
        return NextResponse.json({ 
            error: 'Asset ID and Organization ID are required' 
        }, { status: 400 });
    }

    try {
        // Delete the specific asset binding
        const { error: deleteError } = await supabase
            .from('client_asset_bindings')
            .delete()
            .eq('asset_id', asset_id);

        if (deleteError) {
            throw new Error(`Failed to delete asset binding: ${deleteError.message}`);
        }

        return NextResponse.json({ 
            message: 'Ad account unbound successfully.'
        });

    } catch (error) {
        console.error('Server error during single asset unbinding:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Internal server error' 
        }, { status: 500 });
    }
} 
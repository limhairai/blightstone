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
        // Unbind the specific asset (soft delete)
        const { error: deleteError } = await supabase
            .from('asset_binding')
            .update({ status: 'inactive' })
            .eq('asset_id', asset_id)
            .eq('status', 'active');

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

export async function POST(request: NextRequest) {
  try {
    const { asset_id, admin_user_id } = await request.json();

    if (!asset_id || !admin_user_id) {
      return NextResponse.json(
        { message: "Missing required fields: asset_id, admin_user_id" },
        { status: 400 }
      );
    }

    // Unbind the specific asset
    const { error: unbindError } = await supabase
      .from('asset_binding')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('asset_id', asset_id)
      .eq('status', 'active');

    if (unbindError) {
      console.error("Error unbinding asset:", unbindError);
      return NextResponse.json(
        { message: "Failed to unbind asset", error: unbindError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Asset unbound successfully"
    });

  } catch (error: any) {
    console.error("Failed to unbind asset:", error);
    return NextResponse.json(
      { message: "Failed to unbind asset", error: error.message },
      { status: 500 }
    );
  }
} 
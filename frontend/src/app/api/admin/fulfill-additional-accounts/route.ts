import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/admin/fulfill-additional-accounts
export async function POST(request: NextRequest) {
    try {
        // Step 1: Get the admin user's ID from their token
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const admin_user_id = user.id;

        // Step 2: Get the parameters from the request body
        const body = await request.json();
        const { application_id, organization_id, target_bm_id, selected_ad_accounts } = body;

        if (!application_id || !organization_id || !target_bm_id || !selected_ad_accounts || !Array.isArray(selected_ad_accounts)) {
            return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
        }

        if (selected_ad_accounts.length === 0) {
            return NextResponse.json({ error: 'At least one ad account must be selected.' }, { status: 400 });
        }
        
        // Step 3: Update application status to fulfilled
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
            console.error('Error updating application status:', updateError);
            return NextResponse.json({ error: 'Failed to update application status' }, { status: 500 });
        }

        // Step 4: Create asset bindings for the selected ad accounts
        const adAccountBindings = selected_ad_accounts.map(asset_id => ({
            asset_id: asset_id,
            organization_id: organization_id,
            status: 'active',
            bound_at: new Date().toISOString(),
            bound_by: admin_user_id
        }));

        const { error: bindingError } = await supabase
            .from('asset_binding')
            .insert(adAccountBindings);

        if (bindingError) {
            console.error('Error creating asset bindings:', bindingError);
            return NextResponse.json({ error: 'Failed to bind ad accounts to organization' }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            accounts_bound: selected_ad_accounts.length,
            message: `Successfully assigned ${selected_ad_accounts.length} additional ad accounts`
        });

    } catch (error) {
        console.error('Error fulfilling additional accounts request:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
} 
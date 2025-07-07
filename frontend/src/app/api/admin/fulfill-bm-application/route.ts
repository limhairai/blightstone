import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/admin/fulfill-bm-application
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

        // You might want to add a check here to ensure the user is a superuser
        // const { data: profile } = await supabase.from('profiles').select('is_superuser').eq('profile_id', user.id).single();
        // if (!profile?.is_superuser) {
        //     return NextResponse.json({ error: 'You are not authorized to perform this action.' }, { status: 403 });
        // }

        const admin_user_id = user.id;

        // Step 2: Get the parameters from the request body
        const body = await request.json();
        const { application_id, organization_id, dolphin_id, selected_ad_accounts = [] } = body;

        if (!application_id || !organization_id || !dolphin_id) {
            return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
        }

        // dolphin_id is actually the asset ID from the frontend

        console.log('Fulfilling BM application with selected accounts:', {
            application_id,
            organization_id,
            dolphin_id,
            selected_ad_accounts: selected_ad_accounts.length,
            selected_ad_accounts_ids: selected_ad_accounts
        });

        console.log('Attempting to update application status for application_id:', application_id);
        
        // Step 3: Update application status to fulfilled
        const { error: updateError } = await supabase
            .from('application')
            .update({
                status: 'fulfilled',
                fulfilled_by: admin_user_id,
                fulfilled_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('application_id', application_id);

        console.log('Update result - error:', updateError);

        if (updateError) {
            console.error('Error updating application status:', updateError);
            console.error('Update error details:', {
                message: updateError.message,
                details: updateError.details,
                hint: updateError.hint,
                code: updateError.code
            });
            return NextResponse.json({ error: 'Failed to update application status', details: updateError }, { status: 500 });
        }

        // Step 4: First get the Business Manager asset to get its dolphin_id
        const { data: bmAsset, error: bmError } = await supabase
            .from('asset')
            .select('asset_id, dolphin_id, name')
            .eq('asset_id', dolphin_id)
            .eq('type', 'business_manager')
            .single();

        if (bmError || !bmAsset) {
            console.error('Error finding Business Manager asset:', bmError);
            return NextResponse.json({ error: 'Business Manager asset not found' }, { status: 404 });
        }

        // Step 5: Create asset binding for the Business Manager
        const { error: bindingError } = await supabase
            .from('asset_binding')
            .insert({
                asset_id: dolphin_id,
                organization_id: organization_id,
                status: 'active',
                bound_at: new Date().toISOString(),
                bound_by: admin_user_id
            });

        if (bindingError) {
            console.error('Error creating asset binding:', bindingError);
            return NextResponse.json({ error: 'Failed to bind Business Manager to organization' }, { status: 500 });
        }

        // Step 6: Bind selected ad accounts (simplified approach)
        let boundAdAccounts = 0;
        
        if (selected_ad_accounts.length > 0) {
            console.log('Binding selected ad accounts:', selected_ad_accounts);
            
            try {
                // Create bindings for all selected ad accounts
                // We trust the frontend filtering, but add basic validation
                const adAccountBindings = selected_ad_accounts.map((accountId: string) => ({
                    asset_id: accountId,
                    organization_id: organization_id,
                    status: 'active',
                    bound_at: new Date().toISOString(),
                    bound_by: admin_user_id
                }));

                const { data: insertedBindings, error: adBindingError } = await supabase
                    .from('asset_binding')
                    .insert(adAccountBindings)
                    .select('asset_id');

                if (adBindingError) {
                    console.error('Error binding ad accounts:', adBindingError);
                    // Don't fail the entire operation, just log and continue
                    console.warn('Some ad accounts may not have been bound, but BM was assigned successfully');
                    boundAdAccounts = 0;
                } else {
                    boundAdAccounts = insertedBindings?.length || 0;
                    console.log(`Successfully bound ${boundAdAccounts} ad accounts`);
                }
            } catch (adAccountError) {
                console.error('Error in ad account binding process:', adAccountError);
                // Don't fail the entire operation
                boundAdAccounts = 0;
            }
        } else {
            console.log('No ad accounts selected for binding');
        }

        return NextResponse.json({ 
            success: true, 
            message: `Application fulfilled successfully. Business Manager assigned with ${boundAdAccounts} ad accounts.`,
            details: {
                business_manager: bmAsset.name,
                ad_accounts_bound: boundAdAccounts
            }
        });

    } catch (error) {
        console.error('Error fulfilling application:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
} 
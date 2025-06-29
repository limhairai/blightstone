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
        // const { data: profile } = await supabase.from('profiles').select('is_superuser').eq('id', user.id).single();
        // if (!profile?.is_superuser) {
        //     return NextResponse.json({ error: 'You are not authorized to perform this action.' }, { status: 403 });
        // }

        const admin_user_id = user.id;

        // Step 2: Get the parameters from the request body
        const body = await request.json();
        const { application_id, organization_id, dolphin_asset_id } = body;

        if (!application_id || !organization_id || !dolphin_asset_id) {
            return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
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

        // Step 4: First get the Business Manager asset to get its dolphin_id
        const { data: bmAsset, error: bmError } = await supabase
            .from('asset')
            .select('id, dolphin_id, name')
            .eq('id', dolphin_asset_id)
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
                asset_id: dolphin_asset_id,
                organization_id: organization_id,
                status: 'active',
                bound_at: new Date().toISOString(),
                bound_by: admin_user_id
            });

        if (bindingError) {
            console.error('Error creating asset binding:', bindingError);
            return NextResponse.json({ error: 'Failed to bind Business Manager to organization' }, { status: 500 });
        }

        // Step 6: Auto-bind related ad accounts (optional)
        let boundAdAccounts = 0;
        try {
            // Find ad accounts that belong to this Business Manager using the BM's dolphin_id
            const { data: adAssets, error: assetsError } = await supabase
                .from('asset')
                .select('id, name, dolphin_id, metadata')
                .eq('type', 'ad_account');

            if (!assetsError && adAssets) {
                const relatedAdAccounts = adAssets.filter(asset => 
                    asset.metadata?.business_manager_id === bmAsset.dolphin_id
                );

          

                // Bind related ad accounts (up to 7 total as per provider limit)
                const adAccountsToBinding = relatedAdAccounts.slice(0, 7);
                
                if (adAccountsToBinding.length > 0) {
                    const adAccountBindings = adAccountsToBinding.map(account => ({
                        asset_id: account.id,
                        organization_id: organization_id,
                        status: 'active',
                        bound_at: new Date().toISOString(),
                        bound_by: admin_user_id
                    }));
                    


                    const { error: adBindingError } = await supabase
                        .from('asset_binding')
                        .insert(adAccountBindings);

                    if (adBindingError) {
                        console.error('Error binding ad accounts:', adBindingError);
                    } else {
                        boundAdAccounts = adAccountsToBinding.length;

                    }
                }
            }
        } catch (adAccountError) {
            console.warn('Warning: Failed to auto-bind ad accounts:', adAccountError);
            // Don't fail the main operation if ad account binding fails
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
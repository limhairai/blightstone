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
        const { application_id, organization_id, dolphin_asset_id, selected_ad_accounts = [] } = body;

        if (!application_id || !organization_id || !dolphin_asset_id) {
            return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
        }

        console.log('Fulfilling BM application with selected accounts:', {
            application_id,
            organization_id,
            dolphin_asset_id,
            selected_ad_accounts: selected_ad_accounts.length
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
            .eq('id', application_id);

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

        // Step 6: Bind selected ad accounts
        let boundAdAccounts = 0;
        try {
            if (selected_ad_accounts.length > 0) {
                console.log('Binding selected ad accounts:', selected_ad_accounts);
                
                // Verify that the selected accounts exist and belong to this BM
                const { data: adAssets, error: assetsError } = await supabase
                    .from('asset')
                    .select('id, name, dolphin_id, metadata')
                    .eq('type', 'ad_account')
                    .in('id', selected_ad_accounts);

                if (assetsError) {
                    console.error('Error fetching selected ad accounts:', assetsError);
                    throw new Error('Failed to fetch selected ad accounts');
                }

                if (!adAssets || adAssets.length === 0) {
                    console.warn('No valid ad accounts found for selection');
                } else {
                    // Filter to only accounts that belong to this BM (security check)
                    const validAdAccounts = adAssets.filter(asset => 
                        asset.metadata?.business_manager_id === bmAsset.dolphin_id
                    );

                    console.log(`Found ${validAdAccounts.length} valid accounts out of ${adAssets.length} selected`);

                    if (validAdAccounts.length > 0) {
                        const adAccountBindings = validAdAccounts.map(account => ({
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
                            throw new Error('Failed to bind selected ad accounts');
                        } else {
                            boundAdAccounts = validAdAccounts.length;
                            console.log(`Successfully bound ${boundAdAccounts} ad accounts`);
                        }
                    }
                }
            } else {
                console.log('No ad accounts selected for binding');
            }
        } catch (adAccountError) {
            console.error('Error binding selected ad accounts:', adAccountError);
            // For new BM requests, we should fail if ad account binding fails
            return NextResponse.json({ 
                error: `Business Manager assigned but failed to bind ad accounts: ${adAccountError instanceof Error ? adAccountError.message : 'Unknown error'}` 
            }, { status: 500 });
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
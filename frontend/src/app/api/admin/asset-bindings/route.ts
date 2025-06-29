import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PostBody {
    application_id?: string;
    bm_id?: string;  // Changed from business_id to bm_id
    business_manager_id?: string;
    ad_account_ids?: string[];
}

export async function POST(request: NextRequest) {
    const body: PostBody = await request.json();
    const { 
        application_id,
        business_manager_id,
        ad_account_ids
    } = body;
    let { bm_id } = body;  // Changed from business_id to bm_id

    // This endpoint now handles two flows:
    // 1. Application-driven: `application_id` is present.
    // 2. Manual binding: `application_id` is absent, `business_id` and `business_manager_id` must be present.

    try {
        if (application_id) {
            // ----- APPLICATION-DRIVEN FLOW -----
            if (!bm_id) {
                if (application_id.startsWith('biz-app-')) {
                    bm_id = application_id.replace('biz-app-', '');
                } else {
                    throw new Error('BM ID is missing for this application type.');
                }
            }
        } else {
            // ----- MANUAL BINDING FLOW -----
            if (!bm_id || !business_manager_id) {
                return NextResponse.json({ error: 'For manual binding, BM ID and Business Manager ID are required.' }, { status: 400 });
            }
            // The bm_id is provided directly, so no derivation is needed.
        }

        if (!bm_id) {
            throw new Error('Could not determine a BM ID to proceed.');
        }

        // Fetch the full asset to get its real FB asset_id
        let dolphinAssetId: string | undefined = undefined;
        if (business_manager_id) {
            const { data: bmAsset, error: bmAssetError } = await supabase
                .from('dolphin_assets')
                .select('asset_id')
                .eq('asset_id', business_manager_id)
                .single();
            
            if (bmAssetError || !bmAsset) {
                // Not a fatal error, but log it. The binding will proceed without updating the business record's external ID.
                console.error("Warning: Could not fetch the selected Business Manager asset to store its external ID.");
            } else {
                dolphinAssetId = bmAsset.asset_id;
            }
        }

        // Step 2: Create asset bindings for the selected assets.
        const bindingsToCreate = (ad_account_ids || []).map(ad_acc_id => ({
            asset_id: ad_acc_id,
            bm_id: bm_id,  // Changed from business_id to bm_id
            bound_at: new Date().toISOString(),
        }));

        if (business_manager_id) {
            bindingsToCreate.push({
                asset_id: business_manager_id,
                bm_id: bm_id,  // Changed from business_id to bm_id
                bound_at: new Date().toISOString(),
            });
        }

        if (bindingsToCreate.length > 0) {
            const { error: bindingError } = await supabase
                .from('client_asset_bindings')
                .insert(bindingsToCreate);

            if (bindingError) {
                throw new Error(`Binding creation failed: ${bindingError.message}`);
            }
        }
        
        // Step 3: Update the business manager status to 'active' and link the BM.
        if (business_manager_id) {
            const { error: bmUpdateError } = await supabase
                .from('business_managers')
                .update({ 
                    status: 'active',
                    dolphin_business_manager_id: dolphinAssetId 
                })
                .eq('bm_id', business_manager_id);

            if (bmUpdateError) {
                throw new Error(`Business Manager update failed: ${bmUpdateError.message}`);
            }
        }

        // Step 4: Update the status of the original application record (only in application flow)
        if (application_id) {
            if (application_id.startsWith('biz-app-')) {
                // For new business apps, the "application" is the business record itself.
            } else {
                const { error: appUpdateError } = await supabase
                    .from('ad_account_applications')
                    .update({ status: 'Fulfilled' })
                    .eq('id', application_id);

                if (appUpdateError) {
                    console.error(`Warning: Failed to update ad_account_application status: ${appUpdateError.message}`);
                }
            }
        }

        return NextResponse.json({ message: 'Assets bound successfully.' });

    } catch (error) {
        console.error('Fulfillment or binding error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { asset_id, bm_id } = await request.json();  // Changed from business_id to bm_id

    if (!asset_id || !bm_id) {
        return NextResponse.json({ error: 'Asset ID and BM ID are required' }, { status: 400 });
    }

    try {
        const { error: deleteError } = await supabase
            .from('client_asset_bindings')
            .delete()
            .match({ asset_id: asset_id, bm_id: bm_id });  // Changed from business_id to bm_id

        if (deleteError) {
            throw new Error(`Failed to delete asset binding: ${deleteError.message}`);
        }

        const { error: updateError } = await supabase
            .from('business_managers')
            .update({ status: 'pending', dolphin_business_manager_id: null })
            .eq('bm_id', bm_id);  // Changed from business_id to bm_id

        if (updateError) {
            // Note: This could leave the data in an inconsistent state.
            // A transaction would be better, but for now, we'll just log the error.
            console.error(`Failed to update business after unbinding: ${updateError.message}`);
            // We can choose to throw or return a partial success message
            throw new Error(`Binding deleted, but failed to update business status: ${updateError.message}`);
        }

        return NextResponse.json({ message: 'Asset unbound successfully and business status updated.' });
    } catch (error) {
        console.error('Server error during unbinding:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 
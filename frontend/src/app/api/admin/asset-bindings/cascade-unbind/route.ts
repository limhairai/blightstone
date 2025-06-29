import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
    const { business_manager_asset_id, organization_id } = await request.json();

    if (!business_manager_asset_id || !organization_id) {
        return NextResponse.json({ 
            error: 'Business Manager Asset ID and Organization ID are required' 
        }, { status: 400 });
    }

    try {
        // Step 1: Find all ad accounts that belong to this business manager
        const { data: adAccounts, error: adAccountsError } = await supabase
            .from('dolphin_assets')
            .select('asset_id')
            .eq('asset_type', 'ad_account')
            .eq('asset_metadata->>business_manager_id', business_manager_asset_id);

        if (adAccountsError) {
            console.error('Error finding ad accounts:', adAccountsError);
            throw new Error(`Failed to find associated ad accounts: ${adAccountsError.message}`);
        }

        // Step 2: Get all asset IDs to unbind (BM + all its ad accounts)
        const assetIdsToUnbind = [
            business_manager_asset_id,
            ...(adAccounts || []).map(acc => acc.asset_id)
        ];

    

        // Step 3: Delete all bindings for these assets
        const { error: deleteError } = await supabase
            .from('client_asset_bindings')
            .delete()
            .in('asset_id', assetIdsToUnbind);

        if (deleteError) {
            throw new Error(`Failed to delete asset bindings: ${deleteError.message}`);
        }

        // Step 4: Update business manager status in business_managers table if it exists
        // Note: This is optional since not all BMs may have entries in business_managers table
        const { error: updateError } = await supabase
            .from('business_managers')
            .update({ 
                status: 'pending', 
                dolphin_business_manager_id: null 
            })
            .eq('dolphin_business_manager_id', business_manager_asset_id);

        // Don't throw error for this - it's expected that some BMs won't have entries
        if (updateError) {
            // Note: Could not update business_managers table - this is non-critical
        }

        return NextResponse.json({ 
            message: `Business manager and ${assetIdsToUnbind.length - 1} associated ad accounts unbound successfully.`,
            unbound_assets: assetIdsToUnbind.length
        });

    } catch (error) {
        console.error('Server error during cascade unbinding:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Internal server error' 
        }, { status: 500 });
    }
} 
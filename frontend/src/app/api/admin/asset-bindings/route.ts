import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PostBody {
    asset_id?: string;
    business_id: string;
    application_id?: string;
    business_manager_id?: string;
    ad_account_ids?: string[];
}

export async function POST(request: NextRequest) {
    const body: PostBody = await request.json();
    const { 
        asset_id, 
        business_id, 
        application_id,
        business_manager_id,
        ad_account_ids
    } = body;

    // Simple Asset Binding (from Assets page)
    if (asset_id && business_id && !application_id) {
        const { data, error } = await supabase
            .from('asset_bindings')
            .insert({
                asset_id: asset_id,
                business_id: business_id,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating simple asset binding:', error);
            return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
        }
        
        return NextResponse.json(data);
    }
    
    // Application Fulfillment Binding
    if (application_id && business_id) {
        try {
            const bindingsToCreate = (ad_account_ids || []).map(ad_acc_id => ({
                asset_id: ad_acc_id,
                business_id: business_id,
                linked_at: new Date().toISOString(),
            }));

            if (business_manager_id) {
                bindingsToCreate.push({
                    asset_id: business_manager_id,
                    business_id: business_id,
                    linked_at: new Date().toISOString(),
                });
            }

            if (bindingsToCreate.length > 0) {
                const { data: bindingData, error: bindingError } = await supabase
                    .from('asset_bindings')
                    .insert(bindingsToCreate)
                    .select();

                if (bindingError) {
                    console.error('Supabase binding error object:', JSON.stringify(bindingError, null, 2));
                    throw new Error(`Binding creation failed: ${bindingError.message || JSON.stringify(bindingError)}`);
                }
            }
            
            const updatePayload: { status: string; facebook_business_manager_id?: string } = { status: 'active' };
            if (business_manager_id) {
                updatePayload.facebook_business_manager_id = business_manager_id;
            }

            const { error: bizUpdateError } = await supabase
                .from('businesses')
                .update(updatePayload)
                .eq('id', business_id);

            if (bizUpdateError) throw new Error(`Business update failed: ${bizUpdateError.message}`);

            const { error: appUpdateError } = await supabase
                .from('applications')
                .update({ status: 'Fulfilled' })
                .eq('id', application_id);

            if (appUpdateError) throw new Error(`Application update failed: ${appUpdateError.message}`);

            return NextResponse.json({ message: 'Application fulfilled and assets bound successfully.' });
        } catch (error) {
            console.error('Fulfillment error:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }
    }
    
    return NextResponse.json({ error: 'Invalid request body. Provide either (asset_id, business_id) for simple binding or (application_id, business_id) for fulfillment.' }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
    const { asset_id, business_id } = await request.json();

    if (!asset_id || !business_id) {
        return NextResponse.json({ error: 'Asset ID and Business ID are required' }, { status: 400 });
    }

    try {
        const { error } = await supabase
            .from('asset_bindings')
            .delete()
            .match({ asset_id: asset_id, business_id: business_id });

        if (error) {
            console.error('Error unbinding asset:', error);
            return NextResponse.json({ error: 'Failed to unbind asset' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Asset unbound successfully' });
    } catch (error) {
        console.error('Server error during unbinding:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 
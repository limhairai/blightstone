import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthenticatedUser(request: NextRequest) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );
    return await supabase.auth.getUser();
}

export async function POST(request: NextRequest) {
    const { data: { user } } = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { accountId, amount, organizationId, accountName } = await request.json();

    if (!accountId || !amount || !organizationId) {
        return NextResponse.json({ error: 'Missing required fields: accountId, amount, and organizationId' }, { status: 400 });
    }

    try {
        // Instead of calling the non-existent topup_ad_account function,
        // we create a funding request which will handle the reserved balance system
        const topupNotes = `Top-up request for ad account: ${accountName || 'Unknown Account'} (${accountId})\nAmount: $${amount}\nImmediate processing requested`;

        const { data: fundingRequest, error: insertError } = await supabaseAdmin
            .from('funding_requests')
            .insert({
                organization_id: organizationId,
                user_id: user.id,
                requested_amount_cents: amount * 100,
                notes: topupNotes,
                status: 'pending' // This will trigger the reserved balance system
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating funding request:', insertError);
            
            // Check if the error is due to insufficient balance
            if (insertError.message?.includes('Insufficient available balance')) {
                return NextResponse.json({ 
                    error: 'Insufficient available balance for this topup request. Please check your wallet balance and any pending requests.' 
                }, { status: 400 });
            }
            
            throw insertError;
        }

        // For immediate processing, we can approve the request right away
        // This simulates the old direct topup behavior
        const { error: approveError } = await supabaseAdmin
            .from('funding_requests')
            .update({ 
                status: 'approved',
                admin_notes: 'Auto-approved for immediate ad account topup'
            })
            .eq('request_id', fundingRequest.request_id);

        if (approveError) {
            console.error('Error approving funding request:', approveError);
            // Don't throw here - the request was created successfully
        }

        // Create a transaction record for the ad account topup
        const { error: transactionError } = await supabaseAdmin
            .from('transactions')
            .insert({
                organization_id: organizationId,
                wallet_id: (await supabaseAdmin
                    .from('wallets')
                    .select('wallet_id')
                    .eq('organization_id', organizationId)
                    .single()).data?.wallet_id,
                type: 'topup',
                amount_cents: -amount * 100, // Negative because it's leaving the wallet
                status: 'completed',
                description: `Ad Account Top-up - ${accountName || 'Unknown Account'}`,
                metadata: {
                    ad_account_id: accountId,
                    ad_account_name: accountName,
                    funding_request_id: fundingRequest.request_id
                }
            });

        if (transactionError) {
            console.error('Error creating transaction record:', transactionError);
            // Don't throw here - the main operation succeeded
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Account topped up successfully.',
            request_id: fundingRequest.request_id
        });
    } catch (error) {
        console.error('Error in ad account topup:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ error: 'Failed to top up account', details: errorMessage }, { status: 500 });
    }
} 
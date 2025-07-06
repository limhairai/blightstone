import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { buildApiUrl } from '../../../../lib/api-utils';

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
        // Calculate fee using subscription service
        let calculatedFeeData = {
            fee_amount_cents: 0,
            total_deducted_cents: amount * 100,
            plan_fee_percentage: 0
        };

        try {
            const feeResponse = await fetch(buildApiUrl('/subscriptions/calculate-fee'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${request.headers.get('Authorization')?.replace('Bearer ', '') || ''}`
                },
                body: JSON.stringify({
                    organization_id: organizationId,
                    amount: amount
                })
            });

            if (feeResponse.ok) {
                const feeData = await feeResponse.json();
                calculatedFeeData = {
                    fee_amount_cents: Math.round(feeData.fee_amount * 100),
                    total_deducted_cents: Math.round(feeData.total_amount * 100),
                    plan_fee_percentage: feeData.fee_percentage
                };
            } else {
                console.error('Fee calculation failed:', feeResponse.status);
                // Use default fee calculation (3% like the old system)
                const defaultFeePercentage = 3.0;
                const defaultFeeAmount = Math.round(amount * 100 * (defaultFeePercentage / 100));
                calculatedFeeData = {
                    fee_amount_cents: defaultFeeAmount,
                    total_deducted_cents: amount * 100 + defaultFeeAmount,
                    plan_fee_percentage: defaultFeePercentage
                };
            }
        } catch (error) {
            console.error('Error calculating fee:', error);
            // Use default fee calculation (3% like the old system)
            const defaultFeePercentage = 3.0;
            const defaultFeeAmount = Math.round(amount * 100 * (defaultFeePercentage / 100));
            calculatedFeeData = {
                fee_amount_cents: defaultFeeAmount,
                total_deducted_cents: amount * 100 + defaultFeeAmount,
                plan_fee_percentage: defaultFeePercentage
            };
        }

        // Create topup request with fee tracking
        const { data: topupRequest, error: insertError } = await supabaseAdmin
            .from('topup_requests')
            .insert({
                organization_id: organizationId,
                requested_by: user.id,
                ad_account_id: accountId,
                ad_account_name: accountName || 'Unknown Account',
                amount_cents: amount * 100,
                currency: 'USD',
                status: 'pending',
                priority: 'high', // High priority for immediate processing
                notes: `Immediate topup request for ad account: ${accountName || 'Unknown Account'} (${accountId})`,
                fee_amount_cents: calculatedFeeData.fee_amount_cents,
                total_deducted_cents: calculatedFeeData.total_deducted_cents,
                plan_fee_percentage: calculatedFeeData.plan_fee_percentage,
                metadata: {
                    immediate_processing: true,
                    requested_via: 'ad_account_topup_api'
                }
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating topup request:', insertError);
            
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
            .from('topup_requests')
            .update({ 
                status: 'completed',
        
                processed_by: user.id,
                processed_at: new Date().toISOString()
            })
            .eq('request_id', topupRequest.request_id);

        if (approveError) {
            console.error('Error approving topup request:', approveError);
            // Don't throw here - the request was created successfully
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Account topped up successfully.',
            request_id: topupRequest.request_id,
            amount_deducted: calculatedFeeData.total_deducted_cents / 100,
            fee_applied: calculatedFeeData.fee_amount_cents / 100
        });
    } catch (error) {
        console.error('Error in ad account topup:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ error: 'Failed to top up account', details: errorMessage }, { status: 500 });
    }
} 
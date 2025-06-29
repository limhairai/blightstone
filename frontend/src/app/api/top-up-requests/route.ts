import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MINIMUM_TOP_UP_AMOUNT = 500;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.organization_id) {
        return NextResponse.json({ error: 'User organization not found.' }, { status: 404 });
    }

    const body = await request.json();
    const { ad_account_id, amount, notes } = body;

    if (!ad_account_id || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Ad account ID and valid amount are required' }, { status: 400 });
    }

    if (amount < MINIMUM_TOP_UP_AMOUNT) {
      return NextResponse.json({ 
        error: `Minimum top up amount is $${MINIMUM_TOP_UP_AMOUNT}` 
      }, { status: 400 });
    }

    // Verify the ad account belongs to the user's organization
    const { data: adAccount, error: adAccountError } = await supabase
      .from('asset_binding')
      .select(`
        id,
        asset:asset_id (
          id,
          dolphin_id,
          metadata
        )
      `)
      .eq('organization_id', profile.organization_id)
      .eq('status', 'active')
      .eq('asset.type', 'ad_account')
      .or(`asset.dolphin_id.eq.${ad_account_id},asset.metadata->>ad_account_id.eq.${ad_account_id}`)
      .single();

    if (adAccountError || !adAccount) {
      return NextResponse.json({ error: 'Ad account not found or not accessible' }, { status: 404 });
    }

    // Create the top up request
    const { data: topUpRequest, error: insertError } = await supabase
      .from('application')
      .insert({
        organization_id: profile.organization_id,
        request_type: 'top_up',
        status: 'pending',
        metadata: {
          ad_account_id,
          amount,
          notes: notes || null,
          asset_binding_id: adAccount.id,
          requested_by: user.id,
          requested_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating top up request:', insertError);
      return NextResponse.json({ error: 'Failed to create top up request' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Top up request created successfully',
      request_id: topUpRequest.id 
    });

  } catch (error) {
    console.error('Error in top-up-requests API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.organization_id) {
        return NextResponse.json({ error: 'User organization not found.' }, { status: 404 });
    }

    // Get top up requests for this organization
    const { data: requests, error: requestsError } = await supabase
      .from('application')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .eq('request_type', 'top_up')
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching top up requests:', requestsError);
      return NextResponse.json({ error: 'Failed to fetch top up requests' }, { status: 500 });
    }

    return NextResponse.json({ requests: requests || [] });

  } catch (error) {
    console.error('Error in top-up-requests GET API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 
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
    const { ad_account_id, ad_account_name, amount, notes } = body;

    console.log('Top-up request received:', {
      ad_account_id,
      ad_account_name,
      amount,
      organization_id: profile.organization_id,
      user_id: user.id
    });

    if (!ad_account_id || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Ad account ID and valid amount are required' }, { status: 400 });
    }

    if (amount < MINIMUM_TOP_UP_AMOUNT) {
      return NextResponse.json({ 
        error: `Minimum top up amount is $${MINIMUM_TOP_UP_AMOUNT}` 
      }, { status: 400 });
    }

    // Verify the ad account belongs to the user's organization
    // Search by dolphin_id (which is what the frontend sends as ad_account_id)
    const { data: adAccountBindings, error: adAccountError } = await supabase
      .from('asset_binding')
      .select(`
        id,
        asset:asset_id (
          id,
          dolphin_id,
          name,
          metadata
        )
      `)
      .eq('organization_id', profile.organization_id)
      .eq('status', 'active')
      .eq('asset.type', 'ad_account')
      .eq('asset.dolphin_id', ad_account_id);

    // Take the first valid binding (in case there are duplicates)
    const adAccount = adAccountBindings && adAccountBindings.length > 0 ? adAccountBindings[0] : null;

    if (adAccountError || !adAccount) {
      // Debug: Let's see what accounts actually exist for this organization
      const { data: allAssets } = await supabase
        .from('asset_binding')
        .select(`
          id,
          asset:asset_id (
            id,
            dolphin_id,
            metadata,
            name,
            type
          )
        `)
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active')
        .eq('asset.type', 'ad_account');

              console.error('Ad account lookup failed:', {
          ad_account_id,
          organization_id: profile.organization_id,
          error: adAccountError,
          available_accounts: allAssets?.map(binding => ({
            asset_id: binding.asset?.id,
            dolphin_id: binding.asset?.dolphin_id,
            name: binding.asset?.name,
            ad_account_id_in_metadata: binding.asset?.metadata?.ad_account_id
          }))
        });
      return NextResponse.json({ error: 'Ad account not found or not accessible' }, { status: 404 });
    }

    // Create the top up request using funding_requests table instead
    const { data: topUpRequest, error: insertError } = await supabase
      .from('funding_requests')
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        requested_amount_cents: amount * 100, // Convert to cents
        notes: `Top-up request for ad account: ${ad_account_name || adAccount.asset?.name || 'Unknown Account'} (${ad_account_id})\nAmount: $${amount}\n${notes ? `Notes: ${notes}` : ''}`,
        status: 'pending'
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

    // Get top up requests for this organization from funding_requests
    const { data: requests, error: requestsError } = await supabase
      .from('funding_requests')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .ilike('notes', '%Top-up request for ad account:%')
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching top up requests:', requestsError);
      return NextResponse.json({ error: 'Failed to fetch top up requests' }, { status: 500 });
    }

    // Transform the data to match TopupRequest interface
    const transformedRequests = (requests || []).map(request => {
      // Parse ad account info from notes
      let adAccountName = 'Account Name Not Available';
      let adAccountId = 'Account ID Not Available';

      if (request.notes) {
        const accountNameMatch = request.notes.match(/Top-up request for ad account:\s*([^(]+)/);
        const accountIdMatch = request.notes.match(/\(([^)]+)\)/);
        
        if (accountNameMatch) {
          adAccountName = accountNameMatch[1].trim();
        }
        if (accountIdMatch) {
          adAccountId = accountIdMatch[1].trim();
        }
      }

      return {
        id: request.request_id,
        organization_id: request.organization_id,
        requested_by: request.user_id,
        ad_account_id: adAccountId,
        ad_account_name: adAccountName,
        amount_cents: request.requested_amount_cents || 0,
        currency: 'USD',
        status: request.status,
        priority: 'normal', // Default priority since not stored in funding_requests
        notes: request.notes,
        admin_notes: request.admin_notes,
        processed_by: null, // Not tracked in funding_requests
        processed_at: null, // Not tracked in funding_requests
        created_at: request.created_at,
        updated_at: request.updated_at
      };
    });

    return NextResponse.json({ requests: transformedRequests });

  } catch (error) {
    console.error('Error in top-up-requests GET API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 
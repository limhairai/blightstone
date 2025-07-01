import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // Check if user is admin/superuser for admin view
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_superuser')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.is_superuser === true;
    
    // Set up auth context for RLS
    await supabase.auth.setSession({ access_token: token, refresh_token: '' });

    let query = supabase
      .from('topup_requests')
      .select(`
        *,
        organization:organizations(name)
      `)
      .order('created_at', { ascending: false });

    // If not admin, filter by user's organizations (RLS will also apply)
    if (!isAdmin) {
      // Get organizations where user is owner
      const { data: ownedOrgs, error: ownedError } = await supabase
        .from('organizations')
        .select('organization_id')
        .eq('owner_id', user.id);

      // Get organizations where user is a member
      const { data: memberOrgs, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id);

      if (ownedError || memberError) {
        console.error('Error fetching user organizations:', ownedError || memberError);
        return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
      }

      const ownedOrgIds = ownedOrgs?.map(org => org.organization_id) || [];
      const memberOrgIds = memberOrgs?.map(org => org.organization_id) || [];
      const allOrgIds = [...new Set([...ownedOrgIds, ...memberOrgIds])];

      if (allOrgIds.length === 0) {
        return NextResponse.json([]);
      }

      query = query.in('organization_id', allOrgIds);
    }

    const { data: requests, error: requestsError } = await query;

    if (requestsError) {
      console.error('Error fetching topup requests:', requestsError);
      return NextResponse.json({ error: 'Failed to fetch topup requests' }, { status: 500 });
    }

    // Get user details for each request
    const requestsWithUserData = await Promise.all(
      (requests || []).map(async (request) => {
        // Get user profile data
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', request.requested_by)
          .single();

        return {
          ...request,
          requested_by_user: userProfile ? {
            email: userProfile.email,
            full_name: userProfile.full_name
          } : null
        };
      })
    );

    return NextResponse.json(requestsWithUserData);

  } catch (error) {
    console.error('Error in topup-requests GET API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    // Check if user is admin/superuser
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_superuser')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_superuser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { status, approved_amount, admin_notes } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const url = new URL(request.url);
    const requestId = url.pathname.split('/').pop();

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Update the funding request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('funding_requests')
      .update({
        status,
        approved_amount_cents: status === 'approved' && approved_amount ? approved_amount * 100 : null,
        admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq('request_id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating topup request:', updateError);
      return NextResponse.json({ error: 'Failed to update topup request' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Topup request updated successfully',
      request: updatedRequest 
    });

  } catch (error) {
    console.error('Error in topup-requests PATCH API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

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

    const body = await request.json();
    const { 
      organization_id, 
      ad_account_id, 
      ad_account_name, 
      amount_cents, 
      priority, 
      notes,
      fee_amount_cents,
      total_deducted_cents,
      plan_fee_percentage
    } = body;

    if (!organization_id || !ad_account_id || !ad_account_name || !amount_cents) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate minimum amount
    if (amount_cents < 50000) { // $500 minimum
      return NextResponse.json({ error: 'Minimum top-up amount is $500' }, { status: 400 });
    }

    // Get organization's current plan for fee calculation if not provided
    let calculatedFeeData = {
      fee_amount_cents: fee_amount_cents || 0,
      total_deducted_cents: total_deducted_cents || amount_cents,
      plan_fee_percentage: plan_fee_percentage || 0
    };

    if (!fee_amount_cents || !plan_fee_percentage) {
      // Calculate fee using subscription service
      try {
        const feeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/subscriptions/calculate-fee`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            organization_id,
            amount: amount_cents / 100
          })
        });

        if (feeResponse.ok) {
          const feeData = await feeResponse.json();
          calculatedFeeData = {
            fee_amount_cents: Math.round(feeData.fee_amount * 100),
            total_deducted_cents: Math.round(feeData.total_amount * 100),
            plan_fee_percentage: feeData.fee_percentage
          };
        }
      } catch (error) {
        console.error('Error calculating fee:', error);
        // Continue with provided values or defaults
      }
    }

    // Create topup request with fee tracking
    const { data: topupRequest, error: insertError } = await supabase
      .from('topup_requests')
      .insert({
        organization_id,
        requested_by: user.id,
        ad_account_id,
        ad_account_name,
        amount_cents,
        currency: 'USD',
        status: 'pending',
        priority: priority || 'normal',
        notes,
        fee_amount_cents: calculatedFeeData.fee_amount_cents,
        total_deducted_cents: calculatedFeeData.total_deducted_cents,
        plan_fee_percentage: calculatedFeeData.plan_fee_percentage
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
      
      return NextResponse.json({ error: 'Failed to create topup request' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Topup request created successfully',
      request: topupRequest 
    });

  } catch (error) {
    console.error('Error in topup-requests POST API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    // Only admins can view all funding requests
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all funding requests with user and organization info
    const { data: requests, error: requestsError } = await supabase
      .from('funding_requests')
      .select(`
        *,
        user:user_id (
          id,
          email
        ),
        organization:organization_id (
          organization_id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching funding requests:', requestsError);
      return NextResponse.json({ error: 'Failed to fetch funding requests' }, { status: 500 });
    }

    // Transform the data to include user names from profiles
    const enrichedRequests = await Promise.all(
      (requests || []).map(async (request) => {
        // Get user profile info
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('profile_id', request.user_id)
          .single();

        return {
          ...request,
          user_name: userProfile?.name || userProfile?.email || request.user?.email || 'Unknown User',
          user_email: userProfile?.email || request.user?.email || 'Unknown Email',
          organization_name: request.organization?.name || 'Unknown Organization',
          amount_dollars: (request.requested_amount_cents || 0) / 100,
          approved_amount_dollars: request.approved_amount_cents ? request.approved_amount_cents / 100 : null,
          // Determine if this is a top-up request
          is_topup_request: request.notes?.includes('Top-up request for ad account:') || false
        };
      })
    );

    return NextResponse.json({ 
      requests: enrichedRequests,
      total: enrichedRequests.length 
    });

  } catch (error) {
    console.error('Error in funding-requests API:', error);
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { request_id, status, approved_amount_cents, admin_notes } = body;

    if (!request_id || !status) {
      return NextResponse.json({ error: 'Request ID and status are required' }, { status: 400 });
    }

    // Update the funding request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('funding_requests')
      .update({
        status,
        approved_amount_cents: status === 'approved' ? approved_amount_cents : null,
        admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq('request_id', request_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating funding request:', updateError);
      return NextResponse.json({ error: 'Failed to update funding request' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Funding request updated successfully',
      request: updatedRequest 
    });

  } catch (error) {
    console.error('Error in funding-requests PATCH API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 
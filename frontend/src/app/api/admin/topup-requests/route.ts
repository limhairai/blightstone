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

    // Check if user is admin/superuser
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_superuser')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile?.is_superuser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all topup requests with organization details for admin analytics
    const { data: requests, error: requestsError } = await supabase
      .from('topup_requests')
      .select(`
        request_id,
        organization_id,
        ad_account_name,
        amount_cents,
        fee_amount_cents,
        total_deducted_cents,
        plan_fee_percentage,
        status,
        created_at,
        organization:organizations(
          name,
          plan_id
        )
      `)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching topup requests for admin:', requestsError);
      return NextResponse.json({ error: 'Failed to fetch topup requests' }, { status: 500 });
    }

    // Transform requests to map request_id to id for frontend compatibility
    const transformedRequests = (requests || []).map(request => ({
      ...request,
      id: request.request_id // Map request_id to id for frontend compatibility
    }));

    return NextResponse.json({ 
      requests: transformedRequests,
      total: transformedRequests.length
    });

  } catch (error) {
    console.error('Error in admin topup-requests API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 
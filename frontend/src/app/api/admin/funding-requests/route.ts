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
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_superuser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch funding requests with organization and user details
    const { data: requests, error: requestsError } = await supabase
      .from('funding_requests')
      .select(`
        *,
        profiles!funding_requests_user_id_fkey(
          email,
          full_name
        ),
        organizations!funding_requests_organization_id_fkey(
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching funding requests:', requestsError);
      return NextResponse.json({ error: requestsError.message }, { status: 500 });
    }

    // Transform data to match the expected format
    const transformedRequests = (requests || []).map((request: any) => ({
      id: request.id,
      account_id: request.account_id,
      account_name: request.account_name,
      requested_amount: request.amount,
      status: request.status,
      submitted_at: request.created_at,
      user_email: request.profiles?.email || 'Unknown',
      user_name: request.profiles?.full_name || 'Unknown User',
      organization_id: request.organization_id,
      organization_name: request.organizations?.name || 'Unknown Organization',
      processed_at: request.processed_at
    }));

    return NextResponse.json({ requests: transformedRequests });

  } catch (error) {
    console.error('Error in funding requests API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 
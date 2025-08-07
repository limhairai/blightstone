import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

    // Get query parameters
  const { searchParams } = new URL(request.url);
  const requestedOrgId = searchParams.get('organization_id');
  
  let organizationId: string;

  if (requestedOrgId) {
    // Verify user has access to requested organization (membership/ownership)
    const [ownedOrgResult, memberOrgResult] = await Promise.all([
      // Check if user owns this organization
      supabaseAdmin
        .from('organizations')
        .select('organization_id')
        .eq('organization_id', requestedOrgId)
        .eq('owner_id', user.id)
        .maybeSingle(),
      
      // Check if user is a member of this organization
      supabaseAdmin
        .from('organization_members')
        .select('organization_id')
        .eq('organization_id', requestedOrgId)
        .eq('user_id', user.id)
        .maybeSingle()
    ]);

    const hasOwnership = ownedOrgResult.data;
    const hasMembership = memberOrgResult.data;

    if (!hasOwnership && !hasMembership) {
      return NextResponse.json({ 
        error: 'Access denied to this organization' 
      }, { status: 403 });
    }

    organizationId = requestedOrgId;
  } else {
    // Fallback to user's profile organization
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('organization_id')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile || !profile.organization_id) {
      console.error('User profile missing organization_id:', { profileError, profile });
      return NextResponse.json({ 
        transactions: [], 
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        message: 'No organization assigned to user.' 
      });
    }
    
    organizationId = profile.organization_id;
  }

  // Get additional query parameters for filtering
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const businessId = searchParams.get('business_id');
  const searchQuery = searchParams.get('search');

  try {
    // OPTIMIZATION: Only select needed fields to reduce data transfer
    let query = supabaseAdmin
      .from('transactions')
      .select('transaction_id, organization_id, type, amount_cents, status, description, metadata, created_at, updated_at', { count: 'exact' })
      .eq('organization_id', organizationId);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    if (businessId && businessId !== 'all') {
        if (businessId === 'unallocated') {
            query = query.is('business_id', null);
        } else {
            query = query.eq('business_id', businessId);
        }
    }
    if (searchQuery) {
      query = query.or(`description.ilike.%${searchQuery}%,display_id.ilike.%${searchQuery}%,transaction_id.ilike.%${searchQuery}%`);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
    
    // The count needs to be calculated on the total set, not the paginated one.
    // The { count: 'exact' } should handle this.

    const response = NextResponse.json({ 
      transactions: data,
      totalCount: count,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    });
    
    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Failed to fetch transactions', details: errorMessage }, { status: 500 });
  }
} 
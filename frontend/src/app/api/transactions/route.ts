import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

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

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organization_id');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const businessId = searchParams.get('business_id');
  const searchQuery = searchParams.get('search');

  if (!organizationId) {
    return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
  }

  try {
    let query = supabaseAdmin
      .from('transactions')
      .select('*, businesses(name)', { count: 'exact' })
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
      query = query.ilike('description', `%${searchQuery}%`);
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

    return NextResponse.json({ 
      transactions: data,
      totalCount: count,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Failed to fetch transactions', details: errorMessage }, { status: 500 });
  }
} 
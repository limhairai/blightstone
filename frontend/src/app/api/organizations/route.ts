import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAuth(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();
  return { user, session, supabase };
}

export async function GET(request: NextRequest) {
  const { user, supabase } = await getAuth(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('id');

    let query = supabase
      .from('organizations')
      .select(`
        organization_id,
        name,
        created_at,
        organization_members!inner(user_id),
        wallets(wallet_id, balance_cents)
      `)
      .eq('organization_members.user_id', user.id);

    // If specific organization ID is requested, filter by it
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }

    const { data: orgs, error } = await query;

    if (error) {
      console.error("Error fetching organizations:", error);
      throw error;
    }

    // Get business manager count for each organization using our new asset system
    const mappedOrgs = await Promise.all((orgs || []).map(async (org) => {
      // Count business managers bound to this organization
      let bmCount = 0;
      try {
        const { data: bmAssets, error: bmError } = await supabase.rpc('get_organization_assets', {
          p_organization_id: org.organization_id,
          p_asset_type: 'business_manager'
        });

        if (!bmError) {
          bmCount = bmAssets?.length || 0;
        }
      } catch (error) {
        console.error('Error fetching BM count for org:', org.organization_id, error);
      }

      return {
        ...org,
        id: org.organization_id, // Map organization_id to id for frontend compatibility
        business_count: bmCount, // Keep field name for backward compatibility
        balance_cents: org.wallets?.balance_cents || 0,
        balance: (org.wallets?.balance_cents || 0) / 100 // Convert cents to dollars for backward compatibility
      };
    }));

    return NextResponse.json({ organizations: mappedOrgs });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching organizations:', msg);
    return NextResponse.json({ error: 'Failed to fetch organizations', details: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, supabase } = await getAuth(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await request.json();

  if (!name) {
    return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
  }

  try {
    // Create the organization
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: name, owner_id: user.id })
      .select()
      .single();

    if (orgError) throw orgError;

    // Add the creator as an 'owner' in the members table
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: newOrg.organization_id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) throw memberError;

    return NextResponse.json(newOrg);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating organization:', msg);
    return NextResponse.json({ error: 'Failed to create organization', details: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { user, supabase } = await getAuth(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('id');
    const { name } = await request.json();

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    // Verify user has permission to update this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { data: updatedOrg, error } = await supabase
      .from('organizations')
      .update({ name })
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updatedOrg);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating organization:', msg);
    return NextResponse.json({ error: 'Failed to update organization', details: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { user, supabase } = await getAuth(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('id');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Verify user is the owner of this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only organization owners can delete organizations' }, { status: 403 });
    }

    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('organization_id', orgId);

    if (error) throw error;

    return NextResponse.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting organization:', msg);
    return NextResponse.json({ error: 'Failed to delete organization', details: msg }, { status: 500 });
  }
} 
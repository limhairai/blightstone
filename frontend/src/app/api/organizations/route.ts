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
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('*, organization_members!inner(user_id)')
      .eq('organization_members.user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ organizations: orgs });
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
      .insert({ name: name, primary_owner_id: user.id })
      .select()
      .single();

    if (orgError) throw orgError;

    // Add the creator as an 'owner' in the members table
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: newOrg.id,
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
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('profile_id', user.id)
      .single();

    // Get organization memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', user.id);

    // Get organizations user owns
    const { data: ownedOrgs, error: ownedError } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', user.id);

    // Get organizations user is member of
    const { data: memberOrgs, error: memberError } = await supabase
      .from('organizations')
      .select(`
        *,
        organization_members!inner(user_id, role)
      `)
      .eq('organization_members.user_id', user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profile,
      profileError: profileError?.message,
      memberships: memberships,
      membershipError: membershipError?.message,
      ownedOrgs: ownedOrgs,
      ownedError: ownedError?.message,
      memberOrgs: memberOrgs,
      memberError: memberError?.message,
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 
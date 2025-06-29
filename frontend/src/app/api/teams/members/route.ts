import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
    }

    // First get organization members
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('user_id, role, joined_at')
      .eq('organization_id', organizationId)
      .order('joined_at', { ascending: false });

    if (membersError) {
      console.error('Error fetching organization members:', membersError);
      throw new Error(`Failed to fetch organization members: ${membersError.message}`);
    }

    if (!members || members.length === 0) {
      return NextResponse.json({ members: [] });
    }

    // Then get profiles for those users
    const userIds = members.map(m => m.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    // Combine the data
    const teamMembers = members.map(member => {
      const profile = profiles?.find(p => p.id === member.user_id);
      return {
        id: member.user_id,
        user_id: member.user_id,
        name: profile?.name || 'Unknown',
        email: profile?.email || '',
        avatar_url: profile?.avatar_url,
        role: member.role,
        joined_at: member.joined_at,
        status: 'active' // Assuming active, as we don't have a status field here
      };
    });

    return NextResponse.json({ members: teamMembers });

  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
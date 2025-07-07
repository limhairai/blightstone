import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get all profiles with admin role
    const { data: adminUsers, error } = await supabase
      .from('profiles')
      .select(`
        profile_id,
        email,
        name,
        role,
        created_at
      `)
      .eq('role', 'admin');

    if (error) {
      console.error('Error fetching admin users:', error);
      throw error;
    }

    // Transform to match expected interface
    const transformedUsers = adminUsers?.map(user => ({
      id: user.profile_id,
      email: user.email,
      name: user.name,
      is_superuser: user.role === 'admin',
      created_at: user.created_at
    })) || [];

    return NextResponse.json({ users: transformedUsers });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 
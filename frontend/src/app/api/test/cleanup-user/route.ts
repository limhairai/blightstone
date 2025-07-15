import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
  // Only allow in development/test environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Test endpoints not available in production' }, { status: 403 });
  }

  try {
    const { email } = await request.json();

    // Get user by email
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const user = authUsers.users.find(u => u.email === email);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('profile_id', user.id)
      .single();

    if (profile?.organization_id) {
      // Delete wallet
      await supabase
        .from('wallets')
        .delete()
        .eq('organization_id', profile.organization_id);

      // Delete topup requests
      await supabase
        .from('topup_requests')
        .delete()
        .eq('organization_id', profile.organization_id);

      // Delete transactions
      await supabase
        .from('transactions')
        .delete()
        .eq('organization_id', profile.organization_id);

      // Delete organization
      await supabase
        .from('organizations')
        .delete()
        .eq('organization_id', profile.organization_id);
    }

    // Delete profile
    await supabase
      .from('profiles')
      .delete()
      .eq('profile_id', user.id);

    // Delete auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'User cleaned up successfully' });

  } catch (error) {
    console.error('Error cleaning up test user:', error);
    return NextResponse.json({ error: 'Failed to cleanup test user' }, { status: 500 });
  }
} 
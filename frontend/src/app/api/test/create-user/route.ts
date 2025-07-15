import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // Only allow in development/test environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Test endpoints not available in production' }, { status: 403 });
  }

  try {
    const { email, password, name, emailVerified = false } = await request.json();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: emailVerified,
      user_metadata: {
        name,
        full_name: name
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Create profile record
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        profile_id: authData.user.id,
        email,
        name,
        avatar_url: null,
        role: 'user'
      })
      .select()
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // Create default organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: `${name}'s Organization`,
        owner_id: authData.user.id,
        plan_id: 'free',
        status: 'active'
      })
      .select()
      .single();

    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 400 });
    }

    // Update profile with organization
    await supabase
      .from('profiles')
      .update({ organization_id: orgData.organization_id })
      .eq('profile_id', authData.user.id);

    // Create wallet
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .insert({
        organization_id: orgData.organization_id,
        balance_cents: 0,
        reserved_balance_cents: 0,
        currency: 'USD'
      })
      .select()
      .single();

    if (walletError) {
      return NextResponse.json({ error: walletError.message }, { status: 400 });
    }

    return NextResponse.json({
      id: authData.user.id,
      email: authData.user.email,
      name,
      organization_id: orgData.organization_id,
      wallet_id: walletData.wallet_id,
      emailVerified
    });

  } catch (error) {
    console.error('Error creating test user:', error);
    return NextResponse.json({ error: 'Failed to create test user' }, { status: 500 });
  }
} 
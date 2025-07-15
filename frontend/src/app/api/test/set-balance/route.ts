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
    const { userId, balanceCents } = await request.json();

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('profile_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update wallet balance
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .update({
        balance_cents: balanceCents,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', profile.organization_id)
      .select()
      .single();

    if (walletError) {
      return NextResponse.json({ error: walletError.message }, { status: 400 });
    }

    return NextResponse.json({
      userId,
      organization_id: profile.organization_id,
      balance_cents: balanceCents,
      balance_dollars: balanceCents / 100
    });

  } catch (error) {
    console.error('Error setting user balance:', error);
    return NextResponse.json({ error: 'Failed to set user balance' }, { status: 500 });
  }
} 
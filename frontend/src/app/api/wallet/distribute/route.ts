import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { get: (name: string) => cookieStore.get(name)?.value },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { organization_id, distributions } = await request.json();

  if (!organization_id || !distributions || !Array.isArray(distributions)) {
    return NextResponse.json({ error: 'Missing organization_id or distributions array' }, { status: 400 });
  }

  const totalDistributionAmountCents = distributions.reduce((sum, dist) => sum + dist.amount_cents, 0);

  if (totalDistributionAmountCents <= 0) {
      return NextResponse.json({ error: 'Total distribution amount must be positive.' }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin.rpc('distribute_funds_to_accounts', {
      p_org_id: organization_id,
      p_total_amount_cents: totalDistributionAmountCents,
      p_distributions: distributions
    });

    if (error) {
      console.error('Error distributing funds rpc:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({ success: true, message: 'Funds distributed successfully.' });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('Distribution error:', errorMessage);
    return NextResponse.json({ error: 'Failed to distribute funds', details: errorMessage }, { status: 500 });
  }
} 
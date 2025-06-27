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

  const { organization_id, ad_account_ids } = await request.json();

  if (!organization_id || !ad_account_ids || !Array.isArray(ad_account_ids)) {
    return NextResponse.json({ error: 'Missing organization_id or ad_account_ids array' }, { status: 400 });
  }

  if (ad_account_ids.length === 0) {
    return NextResponse.json({ error: 'No ad accounts selected for consolidation.' }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin.rpc('consolidate_funds_from_accounts', {
      p_org_id: organization_id,
      p_ad_account_ids: ad_account_ids
    });

    if (error) {
      console.error('Error consolidating funds rpc:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({ success: true, message: 'Funds consolidated successfully.' });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('Consolidation error:', errorMessage);
    return NextResponse.json({ error: 'Failed to consolidate funds', details: errorMessage }, { status: 500 });
  }
} 
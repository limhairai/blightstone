import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { from_source, to_destination, amount_cents } = await req.json();

  if (!from_source || !to_destination || !amount_cents) {
    return NextResponse.json({ error: 'Missing required parameters: from_source, to_destination, amount_cents' }, { status: 400 });
  }

  if (amount_cents <= 0) {
    return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
  }

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

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [from_type, from_id] = from_source.split(':');
  const [to_type, to_id] = to_destination.split(':');

  if (from_type !== 'organization' || to_type !== 'ad_account') {
      return NextResponse.json({ error: 'Invalid transfer types. Only organization to ad_account is supported.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase.rpc('transfer_funds_between_org_and_ad_account', {
      p_organization_id: from_id,
      p_ad_account_id: to_id,
      p_amount_cents: amount_cents
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    console.error('An unexpected error occurred:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 
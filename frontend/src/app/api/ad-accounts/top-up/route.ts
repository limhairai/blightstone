import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthenticatedUser(request: NextRequest) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );
    return await supabase.auth.getUser();
}

export async function POST(request: NextRequest) {
    const { data: { user } } = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { accountId, amount, organizationId } = await request.json();

    if (!accountId || !amount || !organizationId) {
        return NextResponse.json({ error: 'Missing required fields: accountId, amount, and organizationId' }, { status: 400 });
    }

    try {
        const { error } = await supabaseAdmin.rpc('topup_ad_account', {
            p_organization_id: organizationId,
            p_ad_account_id: accountId,
            p_amount_cents: amount * 100,
        });

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Account topped up successfully.' });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ error: 'Failed to top up account', details: errorMessage }, { status: 500 });
    }
} 
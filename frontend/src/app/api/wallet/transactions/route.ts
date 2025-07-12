import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabaseRouteClient = createServerClient(
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
  
  const { data: { user } } = await supabaseRouteClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { amount, type, description, organization_id } = await request.json();

    if (!amount || !type || !organization_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Get the current wallet for the organization
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('wallet_id, balance_cents')
      .eq('organization_id', organization_id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found for the organization' }, { status: 404 });
    }

    const amountCents = Math.round(amount * 100);
    let newBalanceCents = wallet.balance_cents;

    if (type === 'topup') {
      newBalanceCents += amountCents;
    } else if (type === 'withdrawal') {
      if (wallet.balance_cents < amountCents) {
        return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
      }
      newBalanceCents -= amountCents;
    } else {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }

    // 2. Update the wallet balance
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance_cents: newBalanceCents })
      .eq('wallet_id', wallet.wallet_id);

    if (updateError) {
      throw new Error(`Failed to update wallet balance: ${updateError.message}`);
    }

    // 3. Create the transaction record
    const transactionData = {
      organization_id,
      wallet_id: wallet.wallet_id,
      type,
      amount_cents: amountCents,
      description,
      status: 'completed',
    };

    const { data: newTransaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (transactionError) {
      // Ideally, we'd roll back the wallet update here.
      // For now, we log the inconsistency.
      console.error(`CRITICAL: Wallet balance updated, but transaction failed for org ${organization_id}.`, transactionError);
      throw new Error(`Failed to record transaction: ${transactionError.message}`);
    }

    return NextResponse.json({ success: true, transaction: newTransaction });

  } catch (error) {
    console.error('Error processing transaction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
} 

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organization_id')

  const cookieStore = cookies()

  const supabaseRouteClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabaseRouteClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  try {
    const { data: transactions, error } = await supabaseRouteClient
      .from('transactions')
      .select(
        `
        *,
        ad_accounts (name, business_id),
        businesses (name, organization_id)
      `
      )
      .eq('organization_id', organizationId)
      .order('transaction_date', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json(transactions)
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 })
  }
}
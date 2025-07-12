import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all transactions including bank transfers
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split('Bearer ')[1]
    
    if (!token) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 })
    }

    // Verify admin user
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('is_superuser')
      .eq('profile_id', user.id)
      .single()

    if (adminError || !adminProfile?.is_superuser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch regular transactions (include all transactions for admin view)
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        transaction_id,
        type,
        amount_cents,
        status,
        description,
        metadata,
        created_at,
        organization_id,
        organizations!inner(name)
      `)
      .order('created_at', { ascending: false })
      .limit(500)
    
    if (transactionsError) {
      console.error('Supabase transactions error:', transactionsError)
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    // Fetch bank transfer requests
    const { data: bankTransfers, error: bankTransfersError } = await supabase
      .from('bank_transfer_requests')
      .select(`
        request_id,
        requested_amount,
        status,
        reference_number,
        created_at,
        processed_at,
        user_id,
        organization_id,
        organizations!inner(name)
      `)
      .order('created_at', { ascending: false })
      .limit(500)

    if (bankTransfersError) {
      console.error('Supabase bank transfers error:', bankTransfersError)
      return NextResponse.json(
        { error: 'Failed to fetch bank transfers' },
        { status: 500 }
      )
    }

    // Fetch user information for bank transfers
    const userIds = (bankTransfers || []).map(bt => bt.user_id).filter(Boolean)
    let users: any[] = []
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('profile_id, name, email')
        .in('profile_id', userIds)
      
      if (usersError) {
        console.error('Supabase users error:', usersError)
        // Don't fail the request, just log the error
      } else {
        users = usersData || []
      }
    }

    // Create a user lookup map
    const userLookup = users.reduce((acc, user) => {
      acc[user.profile_id] = user
      return acc
    }, {} as Record<string, any>)

    // Fetch unmatched transfers
    const { data: unmatchedTransfers, error: unmatchedError } = await supabase
      .from('unmatched_transfers')
      .select(`
        transfer_id,
        amount,
        reference_provided,
        status,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (unmatchedError) {
      console.error('Supabase unmatched transfers error:', unmatchedError)
      return NextResponse.json(
        { error: 'Failed to fetch unmatched transfers' },
        { status: 500 }
      )
    }
    
    // Transform regular transactions
    const transformedTransactions = (transactions || []).map(txn => {
      // Determine payment method and transaction type based on transaction details
      let paymentMethod = 'Credit Card'; // Default for most transactions
      let transactionType = txn.type;
      let description = txn.description || `${txn.type} transaction`;
      
      // Distinguish between wallet deposits and ad account allocations
      if (txn.type === 'topup') {
        if (txn.amount_cents > 0) {
          // Positive topup = money coming INTO wallet from external source
          transactionType = 'wallet_deposit';
          paymentMethod = description.includes('Stripe') ? 'Stripe' : 
                         description.includes('Bank') ? 'Bank Transfer' : 
                         description.includes('Airwallex') ? 'Airwallex' : 
                         'External Payment';
        } else {
          // Negative topup = money going OUT of wallet to ad account
          transactionType = 'ad_account_allocation';
          paymentMethod = 'Wallet Balance';
        }
      } else if (txn.type === 'deposit') {
        // WalletService creates 'deposit' type for wallet top-ups
        transactionType = 'wallet_deposit';
        paymentMethod = txn.metadata?.payment_method === 'stripe' ? 'Stripe' :
                       txn.metadata?.payment_method === 'bank_transfer' ? 'Bank Transfer' :
                       txn.metadata?.payment_method === 'crypto' ? 'Crypto' :
                       'External Payment';
      } else if (txn.type === 'topup_deduction' || txn.type === 'spend' || txn.type === 'fee') {
        paymentMethod = 'Wallet Balance';
      } else if (txn.type === 'bank_transfer') {
        paymentMethod = 'Bank Transfer';
      }
      
      return {
        id: txn.transaction_id,
        display_id: txn.transaction_id ? `TXN-${txn.transaction_id.substring(0, 8).toUpperCase()}` : null,
        type: transactionType,
        amount: txn.amount_cents / 100, // Convert cents to dollars
        currency: "USD",
        status: txn.status,
        organizationName: (txn.organizations as any)?.name || `Org-${txn.organization_id?.substring(0, 8) || 'Unknown'}`,
        description: description,
        createdAt: txn.created_at,
        paymentMethod: paymentMethod,
        referenceNumber: null // Regular transactions don't have reference numbers
      }
    })

    // Transform bank transfer requests
    const transformedBankTransfers = (bankTransfers || []).map(bt => {
      const user = userLookup[bt.user_id]
      return {
        id: bt.request_id,
        display_id: bt.request_id ? `BT-${bt.request_id.substring(0, 8).toUpperCase()}` : null,
        type: 'bank_transfer' as const,
        amount: bt.requested_amount, // Already in dollars, don't divide by 100
        currency: "USD",
        status: bt.status,
        organizationName: (bt.organizations as any)?.name || `Org-${bt.organization_id?.substring(0, 8) || 'Unknown'}`,
        description: 'Bank Transfer',
        createdAt: bt.created_at,
        paymentMethod: 'Bank Transfer',
        referenceNumber: bt.reference_number,
        processedAt: bt.processed_at,
        requestedBy: user?.name || user?.email || 'Unknown User'
      }
    })

    // Transform unmatched transfers
    const transformedUnmatchedTransfers = (unmatchedTransfers || []).map(ut => ({
      id: ut.transfer_id,
      display_id: ut.transfer_id ? `UM-${ut.transfer_id.substring(0, 8).toUpperCase()}` : null,
      type: 'unmatched_transfer' as const,
      amount: ut.amount, // Already in dollars from the schema
      currency: "USD",
      status: ut.status,
      organizationName: 'Unmatched Transfer',
      description: 'Unmatched Transfer',
      createdAt: ut.created_at,
      paymentMethod: 'Bank Transfer (Unmatched)',
      referenceNumber: ut.reference_provided,
      processedAt: null,
      requestedBy: 'Unknown'
    }))

    // Combine and sort all transactions by date
    const allTransactions = [...transformedTransactions, ...transformedBankTransfers, ...transformedUnmatchedTransfers]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 1000) // Limit to last 1000 transactions
    
    return NextResponse.json({
      transactions: allTransactions,
      total: allTransactions.length
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
} 
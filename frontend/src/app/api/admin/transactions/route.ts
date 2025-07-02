import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all transactions
export async function GET(request: NextRequest) {
  try {
    // Fetch real transactions from database
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        organizations(name)
      `)
      .order('created_at', { ascending: false })
      .limit(1000) // Limit to last 1000 transactions
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }
    
    // Transform the data to match the expected format
    const transformedTransactions = (transactions || []).map(txn => ({
      id: txn.id,
      type: txn.type,
      amount: txn.amount_cents / 100, // Convert cents to dollars
      currency: "USD",
      status: txn.status,
      organizationName: txn.organizations?.name || 'Unknown Organization',
      description: txn.description || `${txn.type} transaction`,
      createdAt: txn.created_at
    }))
    
    return NextResponse.json({
      transactions: transformedTransactions,
      total: transformedTransactions.length
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
} 
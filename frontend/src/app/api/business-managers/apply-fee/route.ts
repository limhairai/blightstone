import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getBmApplicationFee } from '@/lib/config/pricing-config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const token = request.headers.get('Authorization')?.split('Bearer ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const { organizationId, existingBmCount = 0 } = await request.json()

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Get organization details and current plan
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('wallet_balance, plan_id')
      .eq('organization_id', organizationId)
      .single()

    if (orgError || !orgData) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Calculate BM application fee
    const bmApplicationFee = getBmApplicationFee(orgData.plan_id as 'starter' | 'growth' | 'scale' | 'plus')
    const isFirstBm = existingBmCount === 0
    const actualFee = isFirstBm ? 0 : bmApplicationFee

    // If no fee required, return success immediately
    if (actualFee === 0) {
      return NextResponse.json({ 
        success: true, 
        fee: 0, 
        message: 'No fee required - first Business Manager is free!' 
      })
    }

    // Check wallet balance
    const currentBalance = orgData.wallet_balance || 0
    if (currentBalance < actualFee) {
      return NextResponse.json({ 
        error: 'Insufficient wallet balance',
        required: actualFee,
        available: currentBalance,
        shortfall: actualFee - currentBalance
      }, { status: 400 })
    }

    // Begin transaction to deduct fee and record transaction
    const newBalance = currentBalance - actualFee

    // Update wallet balance
    const { error: balanceUpdateError } = await supabase
      .from('organizations')
      .update({ wallet_balance: newBalance })
      .eq('organization_id', organizationId)

    if (balanceUpdateError) {
      console.error('Failed to update wallet balance:', balanceUpdateError)
      return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
    }

    // Record transaction for audit trail
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        organization_id: organizationId,
        amount_cents: Math.round(actualFee * 100),
        transaction_type: 'bm_application_fee',
        status: 'completed',
        description: `Business Manager application fee - ${orgData.plan_id} plan`,
        metadata: {
          plan_id: orgData.plan_id,
          existing_bm_count: existingBmCount,
          fee_amount: actualFee,
          previous_balance: currentBalance,
          new_balance: newBalance
        },
        created_by: user.id
      })

    if (transactionError) {
      console.error('Failed to record transaction:', transactionError)
      // Note: We don't revert the balance update here as it's already committed
      // In a production system, you'd want to use database transactions
    }

    return NextResponse.json({
      success: true,
      fee: actualFee,
      previousBalance: currentBalance,
      newBalance: newBalance,
      message: `Successfully charged $${actualFee} BM application fee`
    })

  } catch (error) {
    console.error('BM application fee error:', error)
    return NextResponse.json({ 
      error: 'Failed to process BM application fee' 
    }, { status: 500 })
  }
} 
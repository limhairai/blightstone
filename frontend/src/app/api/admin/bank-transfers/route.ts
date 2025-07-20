import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { WalletService } from '../../../../lib/wallet-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List pending bank transfer requests
export async function GET(request: NextRequest) {
  try {
    const { data: requests, error } = await supabase
      .from('bank_transfer_requests')
      .select(`
        *,
        organizations(name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching bank transfer requests:', error)
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
  }
}

// POST - Admin manually processes a bank transfer
export async function POST(request: NextRequest) {
  try {
    const { 
      requestId, 
      action, // 'approve' | 'reject'
      actualAmount, // Amount actually received (may differ from requested)
      bankReference // Bank transaction reference
    } = await request.json()

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the bank transfer request
    const { data: bankRequest, error: requestError } = await supabase
      .from('bank_transfer_requests')
      .select('*')
      .eq('request_id', requestId)
      .single()

    if (requestError || !bankRequest) {
      return NextResponse.json({ error: 'Bank transfer request not found' }, { status: 404 })
    }

    if (bankRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 })
    }

    if (action === 'approve') {
      const amountToCredit = actualAmount || bankRequest.requested_amount

      // Process wallet topup
      const result = await WalletService.processTopup({
        organizationId: bankRequest.organization_id,
        amount: amountToCredit,
        paymentMethod: 'bank_transfer',
        transactionId: `bank_${requestId}`,
                  metadata: {
            bank_transfer_request_id: requestId,
            bank_reference: bankReference,
            requested_amount: bankRequest.requested_amount,
            actual_amount: amountToCredit
          },
        description: `Bank Transfer - $${amountToCredit.toFixed(2)}`
      })

      if (!result.success) {
        return NextResponse.json({ error: 'Failed to process wallet topup' }, { status: 500 })
      }

      // Update request status
      await supabase
        .from('bank_transfer_requests')
        .update({
          status: 'completed',
          actual_amount: amountToCredit,
          bank_reference: bankReference,
          processed_at: new Date().toISOString()
        })
        .eq('request_id', requestId)

      // Invalidate caches after admin bank transfer approval
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/cache/invalidate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CACHE_INVALIDATION_SECRET || 'internal-cache-invalidation'}`
          },
          body: JSON.stringify({
            tags: ['organization', 'wallet', 'transactions'],
            context: `Admin bank transfer approval for org ${bankRequest.organization_id}`
          })
        })
      } catch (error) {
        console.warn('Failed to invalidate caches after admin bank transfer:', error)
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Bank transfer processed successfully',
        walletBalance: result.newBalance
      })

    } else if (action === 'reject') {
      // Update request status to rejected
      await supabase
        .from('bank_transfer_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString()
        })
        .eq('request_id', requestId)

      return NextResponse.json({ 
        success: true, 
        message: 'Bank transfer request rejected'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error processing bank transfer:', error)
    return NextResponse.json({ error: 'Failed to process bank transfer' }, { status: 500 })
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { WalletService } from '@/lib/wallet-service'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const walletService = new WalletService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-signature') || request.headers.get('x-airwallex-signature')
    
    console.log('🏦 Airwallex webhook received:', {
      hasSignature: !!signature,
      bodyLength: body.length,
      headers: Object.fromEntries(request.headers.entries())
    })

    // Verify webhook signature
    if (!verifyAirwallexSignature(body, signature)) {
      console.error('❌ Invalid Airwallex webhook signature', {
        hasSignature: !!signature,
        nodeEnv: process.env.NODE_ENV,
        webhookSecret: !!process.env.AIRWALLEX_WEBHOOK_SECRET
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    console.log('✅ Airwallex webhook verified:', event.name || event.type)

    // Handle different Airwallex webhook events
    switch (event.name || event.type) {
      // Payment Intent events (for payment links)
      case 'payment_intent.succeeded':
        await handlePaymentIntentSuccess(event.data.object)
        break
      
      case 'payment_intent.failed':
        await handlePaymentIntentFailure(event.data.object)
        break
      
      case 'payment_intent.cancelled':
        await handlePaymentIntentCancellation(event.data.object)
        break

      // Bank transfer events (incoming funds to your account)
      case 'transfer.received':
      case 'transfer.completed':
      case 'incoming_transfer.completed':
        await handleIncomingBankTransfer(event.data.object || event.data)
        break

      case 'transfer.failed':
      case 'incoming_transfer.failed':
        await handleIncomingBankTransferFailed(event.data.object || event.data)
        break

      // Account balance events
      case 'balance.updated':
        console.log('💰 Account balance updated:', event.data)
        break
      
      default:
        console.log(`ℹ️ Unhandled Airwallex event: ${event.name || event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('💥 Airwallex webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle incoming bank transfers (the main feature we need)
async function handleIncomingBankTransfer(transfer: any) {
  try {
    console.log('🏦 Processing incoming bank transfer:', {
      transferId: transfer.id,
      amount: transfer.amount,
      currency: transfer.currency,
      reference: transfer.reference || transfer.description || transfer.memo
    })

    const { 
      id: transferId,
      amount,
      currency,
      reference,
      description,
      memo,
      metadata
    } = transfer

    // Extract reference number from various possible fields
    const referenceText = reference || description || memo || metadata?.reference || ''
    
    // Look for our reference pattern: ADHUB-{ORG_ID_SHORT}-{REQUEST_ID_SHORT}-{CHECKSUM}
    const referenceMatch = referenceText.match(/ADHUB-([A-Z0-9]{8})-([A-Z0-9]{8})-([0-9]{4})/)
    
    if (!referenceMatch) {
      console.error('❌ No valid reference found in transfer:', {
        transferId,
        referenceText,
        possibleFields: { reference, description, memo }
      })
      
      // Create unmatched transfer record for manual processing
      await createUnmatchedTransfer(transfer)
      return
    }

    const [, orgIdShort, requestIdShort, checksum] = referenceMatch
    const fullReference = `ADHUB-${orgIdShort}-${requestIdShort}-${checksum}`

    console.log('🔍 Found reference:', fullReference)

    // Find the bank transfer request
    const { data: bankRequest, error: requestError } = await supabase
      .from('bank_transfer_requests')
      .select('*')
      .eq('reference_number', fullReference)
      .eq('status', 'pending')
      .single()

    if (requestError || !bankRequest) {
      console.error('❌ Bank transfer request not found:', {
        reference: fullReference,
        error: requestError
      })
      
      await createUnmatchedTransfer(transfer, fullReference)
      return
    }

    // Validate amount (allow some tolerance for bank fees)
    const requestedAmount = bankRequest.requested_amount
    const receivedAmount = parseFloat(amount)
    const tolerance = 0.05 // 5% tolerance for bank fees
    
    if (Math.abs(receivedAmount - requestedAmount) > (requestedAmount * tolerance)) {
      console.warn('⚠️ Amount mismatch:', {
        requested: requestedAmount,
        received: receivedAmount,
        difference: receivedAmount - requestedAmount
      })
      
      // Still process but flag for review
    }

    // Process wallet credit
    const result = await WalletService.processTopup({
      organizationId: bankRequest.organization_id,
      amount: receivedAmount,
      paymentMethod: 'bank_transfer',
      transactionId: transferId,
      metadata: {
        airwallex_transfer_id: transferId,
        bank_reference: fullReference,
        original_reference: referenceText,
        requested_amount: requestedAmount,
        received_amount: receivedAmount,
        currency,
        bank_transfer_request_id: bankRequest.request_id
      },
      description: `Bank Transfer - $${receivedAmount.toFixed(2)}`
    })

    if (!result.success) {
      console.error('❌ Failed to process wallet topup:', result.error)
      throw new Error(result.error)
    }

    // Update bank transfer request status
    await supabase
      .from('bank_transfer_requests')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        admin_notes: `Processed via Airwallex transfer ${transferId}. Received: $${receivedAmount}, Requested: $${requestedAmount}`
      })
      .eq('request_id', bankRequest.request_id)

    console.log('✅ Bank transfer processed successfully:', {
      organizationId: bankRequest.organization_id,
      amount: receivedAmount,
      newBalance: result.newBalance,
      reference: fullReference
    })
    
    // Invalidate caches after successful bank transfer
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/cache/invalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CACHE_INVALIDATION_SECRET || 'internal-cache-invalidation'}`
        },
        body: JSON.stringify({
          tags: ['organization', 'wallet', 'transactions'],
          context: `Airwallex bank transfer for org ${bankRequest.organization_id}`
        })
      })
    } catch (error) {
      console.warn('Failed to invalidate caches after bank transfer:', error)
    }



  } catch (error) {
    console.error('💥 Error processing incoming bank transfer:', error)
    throw error
  }
}

// Handle failed incoming transfers
async function handleIncomingBankTransferFailed(transfer: any) {
  try {
    console.log('❌ Incoming bank transfer failed:', transfer.id)
    
    // Try to find matching request and update status
    const referenceText = transfer.reference || transfer.description || transfer.memo || ''
    const referenceMatch = referenceText.match(/ADHUB-([A-Z0-9]{8})-([A-Z0-9]{8})-([0-9]{4})/)
    
    if (referenceMatch) {
      const fullReference = `ADHUB-${referenceMatch[1]}-${referenceMatch[2]}-${referenceMatch[3]}`
      
      await supabase
        .from('bank_transfer_requests')
        .update({
          status: 'failed',
          processed_at: new Date().toISOString(),
          admin_notes: `Transfer failed: ${transfer.failure_reason || 'Unknown reason'}`
        })
        .eq('reference_number', fullReference)
        .eq('status', 'pending')
    }

  } catch (error) {
    console.error('Error handling failed bank transfer:', error)
  }
}

// Create record for unmatched transfers (for manual processing)
async function createUnmatchedTransfer(transfer: any, attemptedReference?: string) {
  try {
    const referenceProvided = transfer.reference || transfer.description || transfer.memo || ''
    
    await supabase
      .from('unmatched_transfers')
      .insert({
        amount: parseFloat(transfer.amount),
        sender_info: {
          airwallex_transfer_id: transfer.id,
          currency: transfer.currency,
          original_data: transfer
        },
        reference_provided: referenceProvided,
        bank_transaction_id: transfer.id,
        status: 'unmatched',
        admin_notes: attemptedReference 
          ? `Failed to match reference: ${attemptedReference}. Raw reference: ${referenceProvided}`
          : `No valid ADHUB reference found. Raw reference: ${referenceProvided}`
      })

    console.log('📝 Created unmatched transfer record:', transfer.id)
  } catch (error) {
    console.error('Error creating unmatched transfer record:', error)
  }
}

// Handle payment intent success (for payment links)
async function handlePaymentIntentSuccess(paymentIntent: any) {
  try {
    const { metadata } = paymentIntent
    const organizationId = metadata.organization_id
    const userId = metadata.user_id
    const walletCredit = parseFloat(metadata.wallet_credit)

    if (!organizationId || !walletCredit) {
      console.error('Missing required metadata in payment intent')
      return
    }

    // Process wallet credit
    const result = await WalletService.processTopup({
      organizationId,
      amount: walletCredit,
      paymentMethod: 'bank_transfer',
      transactionId: paymentIntent.id,
      metadata: {
        payment_method: paymentIntent.latest_payment_attempt?.payment_method?.type,
        currency: paymentIntent.currency,
        airwallex_payment_id: paymentIntent.id
      },
      description: `Airwallex Payment - $${walletCredit.toFixed(2)}`
    })

    if (!result.success) {
      console.error('Failed to process payment intent topup:', result.error)
      throw new Error(result.error)
    }

    console.log(`✅ Payment intent processed: ${organizationId} + $${walletCredit}`)
    
    // Invalidate caches after successful payment intent
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/cache/invalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CACHE_INVALIDATION_SECRET || 'internal-cache-invalidation'}`
        },
        body: JSON.stringify({
          tags: ['organization', 'wallet', 'transactions'],
          context: `Airwallex payment intent for org ${organizationId}`
        })
      })
    } catch (error) {
      console.warn('Failed to invalidate caches after payment intent:', error)
    }

  } catch (error) {
    console.error('Error handling payment intent success:', error)
    throw error
  }
}

// Handle payment intent failure
async function handlePaymentIntentFailure(paymentIntent: any) {
  try {
    console.log(`❌ Payment intent failed: ${paymentIntent.id}`)
    
    // Update any related records
    await supabase
      .from('payment_intents')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed'
      })
      .eq('intent_id', paymentIntent.id)

  } catch (error) {
    console.error('Error handling payment intent failure:', error)
  }
}

// Handle payment intent cancellation
async function handlePaymentIntentCancellation(paymentIntent: any) {
  try {
    console.log(`🚫 Payment intent cancelled: ${paymentIntent.id}`)
    
    await supabase
      .from('payment_intents')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('intent_id', paymentIntent.id)

  } catch (error) {
    console.error('Error handling payment intent cancellation:', error)
  }
}

// Verify Airwallex webhook signature
function verifyAirwallexSignature(body: string, signature: string | null): boolean {
  const webhookSecret = process.env.AIRWALLEX_WEBHOOK_SECRET
  

  
  // Allow unsigned requests in development when no secret is configured
  if (!webhookSecret && process.env.NODE_ENV === 'development') {
    console.warn('⚠️ AIRWALLEX_WEBHOOK_SECRET not configured, allowing webhook in development')
    return true
  }
  
  if (!signature) {
    console.warn('⚠️ No signature provided in Airwallex webhook')
    return false
  }

  try {
    // Airwallex uses HMAC SHA256 for signature verification
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret!)
      .update(body)
      .digest('hex')
    
    // Airwallex signatures are typically prefixed with algorithm
    const receivedSignature = signature.replace(/^sha256=/, '')
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature)
    )
  } catch (error) {
    console.error('Error verifying Airwallex signature:', error)
    return false
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { WalletService } from '@/lib/wallet-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const walletService = new WalletService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-signature')
    
    // Verify webhook signature (implement based on Airwallex docs)
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid Airwallex webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    console.log('Airwallex webhook received:', event.name)

    switch (event.name) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object)
        break
      
      case 'payment_intent.failed':
        await handlePaymentFailure(event.data.object)
        break
      
      case 'payment_intent.cancelled':
        await handlePaymentCancellation(event.data.object)
        break
      
      default:
        console.log(`Unhandled Airwallex event: ${event.name}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Airwallex webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(paymentIntent: any) {
  try {
    const { metadata } = paymentIntent
    const organizationId = metadata.organization_id
    const userId = metadata.user_id
    const walletCredit = parseFloat(metadata.wallet_credit)

    if (!organizationId || !walletCredit) {
      console.error('Missing required metadata in payment intent')
      return
    }

    // Update wallet balance using WalletService
    await walletService.creditWallet(
      organizationId,
      walletCredit,
      'airwallex',
      paymentIntent.id,
      {
        payment_method: paymentIntent.latest_payment_attempt?.payment_method?.type,
        currency: paymentIntent.currency,
        airwallex_payment_id: paymentIntent.id
      }
    )

    // Update transaction status
    await supabase
      .from('wallet_transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: {
          ...paymentIntent.metadata,
          airwallex_payment_intent: paymentIntent
        }
      })
      .eq('provider_transaction_id', paymentIntent.id)

    console.log(`Wallet credited successfully: ${organizationId} + $${walletCredit}`)

  } catch (error) {
    console.error('Error handling payment success:', error)
    throw error
  }
}

async function handlePaymentFailure(paymentIntent: any) {
  try {
    // Update transaction status to failed
    await supabase
      .from('wallet_transactions')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
        metadata: {
          ...paymentIntent.metadata,
          error: paymentIntent.last_payment_error
        }
      })
      .eq('provider_transaction_id', paymentIntent.id)

    console.log(`Payment failed: ${paymentIntent.id}`)

  } catch (error) {
    console.error('Error handling payment failure:', error)
    throw error
  }
}

async function handlePaymentCancellation(paymentIntent: any) {
  try {
    // Update transaction status to cancelled
    await supabase
      .from('wallet_transactions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        metadata: {
          ...paymentIntent.metadata,
          cancelled_reason: 'User cancelled payment'
        }
      })
      .eq('provider_transaction_id', paymentIntent.id)

    console.log(`Payment cancelled: ${paymentIntent.id}`)

  } catch (error) {
    console.error('Error handling payment cancellation:', error)
    throw error
  }
}

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature) return false
  
  // Implement Airwallex signature verification
  // This is a placeholder - implement according to Airwallex documentation
  const webhookSecret = process.env.AIRWALLEX_WEBHOOK_SECRET
  
  if (!webhookSecret) {
    console.warn('AIRWALLEX_WEBHOOK_SECRET not configured')
    return true // Allow in development
  }

  // TODO: Implement actual signature verification
  // const expectedSignature = crypto
  //   .createHmac('sha256', webhookSecret)
  //   .update(body)
  //   .digest('hex')
  
  // return signature === expectedSignature
  
  return true // Placeholder
} 
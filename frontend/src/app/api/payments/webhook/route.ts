import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        await handleSuccessfulPayment(session)
        break

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment succeeded:', paymentIntent.id)
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        console.log('Payment failed:', failedPayment.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  try {
    const {
      organization_id,
      wallet_credit,
      processing_fee
    } = session.metadata || {}

    if (!organization_id || !wallet_credit) {
      console.error('Missing metadata in checkout session:', session.id)
      return
    }

    const walletCreditAmount = parseFloat(wallet_credit)
    const processingFeeAmount = parseFloat(processing_fee || '0')

    console.log(`Processing wallet top-up:`, {
      sessionId: session.id,
      organizationId: organization_id,
      walletCredit: walletCreditAmount,
      processingFee: processingFeeAmount,
      totalPaid: session.amount_total ? session.amount_total / 100 : 0
    })

    // Update the wallet balance in the database
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance_cents')
      .eq('organization_id', organization_id)
      .single()

    if (walletError) {
      console.error('Error fetching wallet:', walletError)
      return
    }

    const newBalanceCents = (wallet.balance_cents || 0) + Math.round(walletCreditAmount * 100)

    // Update wallet balance
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance_cents: newBalanceCents })
      .eq('organization_id', organization_id)

    if (updateError) {
      console.error('Error updating wallet balance:', updateError)
      return
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        organization_id,
        wallet_id: (await supabase
          .from('wallets')
          .select('id')
          .eq('organization_id', organization_id)
          .single()).data?.id,
        type: 'deposit',
        amount_cents: Math.round(walletCreditAmount * 100),
        status: 'completed',
        description: `Wallet top-up via Stripe`,
        metadata: {
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent,
          processing_fee_cents: Math.round(processingFeeAmount * 100)
        }
      })

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError)
    }

    console.log(`✅ Wallet updated successfully:`, {
      organizationId: organization_id,
      newBalanceCents,
      addedAmount: walletCreditAmount
    })

  } catch (error) {
    console.error('Error handling successful payment:', error)
  }
} 
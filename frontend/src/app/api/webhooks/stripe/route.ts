import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`🎣 Received Stripe webhook: ${event.type}`)

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        console.log('🛒 Checkout session completed:', session.id, 'Amount:', session.amount_total)
        
        // Extract organization_id from checkout session metadata
        const sessionOrgId = session.metadata?.organization_id
        if (!sessionOrgId) {
          console.error('❌ No organization_id in checkout session metadata')
          break
        }

        console.log('✅ Found organization_id in session:', sessionOrgId)

        // Update wallet balance using checkout session data
        try {
          const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('balance_cents')
            .eq('organization_id', sessionOrgId)
            .single()

          if (walletError || !wallet) {
            console.error('❌ Wallet not found:', walletError)
            break
          }

          const walletCreditCents = Math.round(parseFloat(session.metadata.wallet_credit || '0') * 100)
          const newBalance = wallet.balance_cents + walletCreditCents
          
          const { error: updateError } = await supabase
            .from('wallets')
            .update({ 
              balance_cents: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('organization_id', sessionOrgId)

          if (updateError) {
            console.error('❌ Failed to update wallet:', updateError)
            break
          }

          // Get the wallet_id for the transaction record
          const { data: walletData, error: walletLookupError } = await supabase
            .from('wallets')
            .select('wallet_id')
            .eq('organization_id', sessionOrgId)
            .single()

          if (walletLookupError || !walletData) {
            console.error('❌ Could not find wallet_id for transaction:', walletLookupError)
          } else {
            // Create transaction record
            const { error: transactionError } = await supabase
              .from('transactions')
              .insert({
                organization_id: sessionOrgId,
                wallet_id: walletData.wallet_id,
                type: 'deposit',
                amount_cents: walletCreditCents,
                status: 'completed',
                description: `Wallet Top-up - $${(walletCreditCents / 100).toFixed(2)}`,
                metadata: {
                  stripe_checkout_session_id: session.id,
                  stripe_payment_intent_id: session.payment_intent,
                  payment_method: 'stripe_checkout'
                }
              })

            if (transactionError) {
              console.error('❌ Failed to create transaction:', transactionError)
            } else {
              console.log('✅ Wallet updated successfully from checkout. New balance:', newBalance / 100, 'USD')
              console.log('💰 Added wallet credit:', walletCreditCents / 100, 'USD')
            }
          }

        } catch (error) {
          console.error('❌ Error processing checkout session:', error)
        }
        break
      
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        console.log('❌ Payment failed:', failedPayment.id)
        // TODO: Handle failed payment (maybe notify user)
        break
      
      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription
        console.log('📋 Subscription created:', subscription.id)
        // TODO: Handle subscription creation
        break
      
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice
        console.log('🧾 Invoice payment succeeded:', invoice.id)
        // TODO: Handle successful invoice payment
        break
      
      default:
        console.log(`🤷 Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('💥 Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
} 
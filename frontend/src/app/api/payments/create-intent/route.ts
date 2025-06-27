import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

interface CreatePaymentIntentRequest {
  organization_id: string
  amount: number
  payment_method_id?: string
  save_payment_method?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentIntentRequest = await request.json()
    const { organization_id, amount, payment_method_id, save_payment_method } = body

    // Validate amount
    if (amount < 10 || amount > 100000) {
      return NextResponse.json(
        { error: 'Amount must be between $10 and $100,000' },
        { status: 400 }
      )
    }

    // Calculate amount in cents
    const amountCents = Math.round(amount * 100)

    // For demo purposes, we'll create a payment intent without a real customer
    // In production, you'd want to:
    // 1. Verify the user is authenticated
    // 2. Get or create a Stripe customer
    // 3. Store the payment intent in your database

    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: amountCents,
      currency: 'usd',
      metadata: {
        organization_id,
        type: 'wallet_topup'
      },
      automatic_payment_methods: {
        enabled: true
      }
    }

    if (payment_method_id) {
      paymentIntentParams.payment_method = payment_method_id
      paymentIntentParams.confirmation_method = 'manual'
      paymentIntentParams.confirm = true
    }

    if (save_payment_method) {
      paymentIntentParams.setup_future_usage = 'off_session'
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)

    return NextResponse.json({
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

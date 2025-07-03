import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

const planPriceIds = {
  'starter': process.env.STRIPE_STARTER_PRICE_ID!,
  'growth': process.env.STRIPE_GROWTH_PRICE_ID!,
  'scale': process.env.STRIPE_SCALE_PRICE_ID!,
  'enterprise': process.env.STRIPE_ENTERPRISE_PRICE_ID!
}

export async function POST(request: NextRequest) {
  try {
    const { planId, organizationId } = await request.json()

    if (!planId || !organizationId) {
      return NextResponse.json({ error: 'Plan ID and Organization ID are required' }, { status: 400 })
    }

    const priceId = planPriceIds[planId as keyof typeof planPriceIds]
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/settings?tab=billing&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/settings?tab=billing&canceled=true`,
      metadata: {
        organization_id: organizationId,
        plan_id: planId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
} 
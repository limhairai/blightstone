import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organization_id
  const planId = session.metadata?.plan_id

  if (!organizationId || !planId) {
    console.error('Missing metadata in checkout session')
    return
  }

  // Update organization with customer ID if not already set
  if (session.customer) {
    await supabase
      .from('organizations')
      .update({
        stripe_customer_id: session.customer as string,
        plan_id: planId,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organization_id
  const planId = subscription.metadata?.plan_id

  if (!organizationId || !planId) {
    console.error('Missing metadata in subscription')
    return
  }

  // Create subscription record
  await supabase.from('subscriptions').insert({
    organization_id: organizationId,
    plan_id: planId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
  })

  // Update organization
  await supabase
    .from('organizations')
    .update({
      plan_id: planId,
      subscription_status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organization_id

  if (!organizationId) {
    console.error('Missing organization_id in subscription metadata')
    return
  }

  // Update subscription record
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  // Update organization
  await supabase
    .from('organizations')
    .update({
      subscription_status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organization_id

  if (!organizationId) {
    console.error('Missing organization_id in subscription metadata')
    return
  }

  // Update subscription record
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  // Update organization - move back to free plan
  await supabase
    .from('organizations')
    .update({
      plan_id: 'free',
      subscription_status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    // Payment succeeded for a subscription
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    const organizationId = subscription.metadata?.organization_id

    if (organizationId) {
      await supabase
        .from('organizations')
        .update({
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId)
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    // Payment failed for a subscription
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    const organizationId = subscription.metadata?.organization_id

    if (organizationId) {
      await supabase
        .from('organizations')
        .update({
          subscription_status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId)
    }
  }
} 
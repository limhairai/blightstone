import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { WalletService } from '../../../../lib/wallet-service'
import { revalidateTag } from 'next/cache'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

/**
 * Invalidate subscription-related caches for immediate UI updates
 */
async function invalidateSubscriptionCache(organizationId: string) {
  try {
    // Method 1: Direct Next.js cache invalidation
    revalidateTag(`subscription-${organizationId}`)
    revalidateTag(`organization-${organizationId}`)
    revalidateTag('subscriptions')
    revalidateTag('organizations')
    
    // Method 2: Call internal cache invalidation endpoint for SWR
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/cache/invalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CACHE_INVALIDATION_SECRET || 'internal-cache-invalidation'}`
        },
        body: JSON.stringify({
          organizationId,
          type: 'subscription'
        })
      })
      
      if (response.ok) {
        console.log(`✅ SWR cache invalidation triggered for org: ${organizationId}`)
      }
    } catch (fetchError) {
      console.warn('Failed to trigger SWR cache invalidation:', fetchError)
    }
    
    console.log(`✅ Cache invalidated for organization: ${organizationId}`)
  } catch (error) {
    console.error('Failed to invalidate cache:', error)
  }
}

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

      case 'payment_intent.succeeded':
        // Payment intent succeeded - this is handled by invoice.payment_succeeded
        console.log('Payment intent succeeded:', event.data.object.id)
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
  // Handle subscription checkout completion
  if (session.metadata?.plan_id) {
    // Update organization plan
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ 
        plan_id: session.metadata.plan_id,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', session.metadata.organization_id)

    if (updateError) {
      console.error('Failed to update organization plan:', updateError)
      return NextResponse.json({ error: 'Failed to update organization plan' }, { status: 500 })
    }
  }
  
  // Handle wallet credit checkout completion
  if (session.metadata?.wallet_credit) {
    const result = await WalletService.processTopup({
      organizationId: session.metadata.organization_id,
      amount: parseFloat(session.metadata.wallet_credit),
      paymentMethod: 'stripe',
      transactionId: session.id,
      metadata: {
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent,
        customer_email: session.customer_details?.email
      },
      description: `Stripe Checkout - $${session.metadata.wallet_credit}`
    })

    if (!result.success) {
      console.error('Wallet topup failed:', result.error)
      return NextResponse.json({ error: 'Failed to process wallet topup' }, { status: 500 })
    }
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Processing subscription.created:', subscription.id)
  console.log('Subscription metadata:', subscription.metadata)
  
  const organizationId = subscription.metadata?.organization_id
  const planId = subscription.metadata?.plan_id

  if (!organizationId || !planId) {
    console.error('Missing metadata in subscription:', {
      organizationId,
      planId,
      metadata: subscription.metadata
    })
    return
  }

  try {
    // Create subscription record
    const { error: insertError } = await supabase.from('subscriptions').insert({
      organization_id: organizationId,
      plan_id: planId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      current_period_start: (subscription as any).current_period_start ? new Date((subscription as any).current_period_start * 1000).toISOString() : new Date().toISOString(),
      current_period_end: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : new Date().toISOString(),
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
    })

    if (insertError) {
      console.error('Error inserting subscription:', insertError)
      throw insertError
    }

    // Update organization
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        plan_id: planId,
        subscription_status: subscription.status,
        current_period_start: (subscription as any).current_period_start ? new Date((subscription as any).current_period_start * 1000).toISOString() : new Date().toISOString(),
        current_period_end: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : new Date().toISOString(),
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)

    if (updateError) {
      console.error('Error updating organization:', updateError)
      throw updateError
    }

    console.log('Successfully processed subscription.created for org:', organizationId)
    
    // CRITICAL: Invalidate cache immediately after subscription changes
    await invalidateSubscriptionCache(organizationId)
    
  } catch (error) {
    console.error('Error in handleSubscriptionCreated:', error)
    throw error
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing subscription.updated:', subscription.id)
  console.log('Subscription metadata:', subscription.metadata)
  
  const organizationId = subscription.metadata?.organization_id

  if (!organizationId) {
    console.error('Missing organization_id in subscription metadata:', {
      metadata: subscription.metadata,
      subscriptionId: subscription.id
    })
    return
  }

  try {
    // Update subscription record
    const { error: updateSubError } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: (subscription as any).current_period_start ? new Date((subscription as any).current_period_start * 1000).toISOString() : new Date().toISOString(),
        current_period_end: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : new Date().toISOString(),
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id)

    if (updateSubError) {
      console.error('Error updating subscription:', updateSubError)
      throw updateSubError
    }

    // Update organization
    const { error: updateOrgError } = await supabase
      .from('organizations')
      .update({
        subscription_status: subscription.status,
        current_period_start: (subscription as any).current_period_start ? new Date((subscription as any).current_period_start * 1000).toISOString() : new Date().toISOString(),
        current_period_end: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : new Date().toISOString(),
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)

    if (updateOrgError) {
      console.error('Error updating organization:', updateOrgError)
      throw updateOrgError
    }

    console.log('Successfully processed subscription.updated for org:', organizationId)
    
    // CRITICAL: Invalidate cache immediately after subscription changes
    await invalidateSubscriptionCache(organizationId)
    
  } catch (error) {
    console.error('Error in handleSubscriptionUpdated:', error)
    throw error
  }
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

  // CRITICAL: Invalidate cache immediately after subscription changes
  await invalidateSubscriptionCache(organizationId)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if ((invoice as any).subscription) {
    // Payment succeeded for a subscription
    const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string)
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
  if ((invoice as any).subscription) {
    // Payment failed for a subscription
    const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string)
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
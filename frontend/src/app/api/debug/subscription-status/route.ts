import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('org')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Get organization data
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (orgError) {
      return NextResponse.json({ 
        error: 'Organization not found', 
        details: orgError,
        organizationId 
      }, { status: 404 })
    }

    // Get plan data
    let planData = null
    if (orgData.plan_id) {
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('plan_id', orgData.plan_id)
        .single()

      if (!planError) {
        planData = plan
      }
    }

    // Get subscription data
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    // Get Stripe subscription data if available
    let stripeSubscriptionData = null
    if (orgData.stripe_subscription_id) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
        stripeSubscriptionData = await stripe.subscriptions.retrieve(orgData.stripe_subscription_id)
      } catch (stripeError) {
        console.error('Failed to fetch Stripe subscription:', stripeError)
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      organizationId,
      organization: orgData,
      plan: planData,
      subscription: subscriptionData || null,
      subscriptionError: subscriptionError || null,
      stripeSubscription: stripeSubscriptionData || null,
      debug: {
        hasPlanId: !!orgData.plan_id,
        hasStripeSubscriptionId: !!orgData.stripe_subscription_id,
        hasSubscriptionRecord: !!subscriptionData,
        planExists: !!planData,
      }
    })
  } catch (error) {
    console.error('Debug subscription status error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 
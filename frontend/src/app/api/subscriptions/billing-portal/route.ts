import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { organization_id, return_url } = await request.json()

    if (!organization_id) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Get auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Verify user is member of organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 })
    }

    // Get organization's Stripe customer ID from subscriptions table first, then fallback to organizations
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', organization_id)
      .eq('status', 'active')
      .single()

    // Fallback to organizations table if no subscription found
    const { data: organization } = await supabase
      .from('organizations')
      .select('stripe_customer_id, name')
      .eq('organization_id', organization_id)
      .single()

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    let stripeCustomerId = subscription?.stripe_customer_id || organization?.stripe_customer_id

    if (!stripeCustomerId) {
      // Create Stripe customer if doesn't exist
      const customer = await stripe.customers.create({
        email: user.email,
        name: organization.name,
        metadata: {
          organization_id: organization_id,
          user_id: user.id
        }
      })
      stripeCustomerId = customer.id
      
      // Save customer ID to organizations table
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('organization_id', organization_id)
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: return_url || `${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Error creating billing portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
} 
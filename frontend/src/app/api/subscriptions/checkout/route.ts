import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { planId, organizationId } = await request.json();

    if (!planId || !organizationId) {
      return NextResponse.json(
        { error: 'Plan ID and Organization ID are required' },
        { status: 400 }
      );
    }

    // Get the plan details from database
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    if (!plan.stripe_price_id) {
      return NextResponse.json(
        { error: 'Plan does not have a Stripe price ID' },
        { status: 400 }
      );
    }

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get user profile for customer info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', organization.owner_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Create or get Stripe customer
    let customerId = organization.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name || profile.email,
        metadata: {
          organization_id: organizationId,
          user_id: organization.owner_id,
        },
      });

      customerId = customer.id;

      // Update organization with customer ID
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('organization_id', organizationId);
    }

    // Get the origin for redirect URLs
    const headersList = headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const origin = `${protocol}://${host}`;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/dashboard/settings?subscription=success`,
      cancel_url: `${origin}/dashboard/settings?subscription=cancelled`,
      metadata: {
        organization_id: organizationId,
        plan_id: planId,
      },
      subscription_data: {
        metadata: {
          organization_id: organizationId,
          plan_id: planId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 
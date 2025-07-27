import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { planId, organizationId } = await request.json();

    console.log('🔄 Starting checkout process:', { planId, organizationId });

    if (!planId || !organizationId) {
      console.error('❌ Missing required parameters:', { planId, organizationId });
      return NextResponse.json(
        { error: 'Plan ID and Organization ID are required' },
        { status: 400 }
      );
    }

    // Get the plan details from database
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('plan_id', planId)
      .single();

    if (planError || !plan) {
      console.error('❌ Plan not found:', { planId, planError });
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    if (!plan.stripe_price_id) {
      console.error('❌ Plan missing Stripe price ID:', { planId, plan });
      return NextResponse.json(
        { error: 'Plan does not have a Stripe price ID' },
        { status: 400 }
      );
    }

    console.log('✅ Plan found:', { planId, stripePriceId: plan.stripe_price_id });

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (orgError || !organization) {
      console.error('❌ Organization not found:', { organizationId, orgError });
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    console.log('✅ Organization found:', { organizationId, ownerId: organization.owner_id });

    // Get user profile for customer info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('profile_id', organization.owner_id)
      .single();

    if (profileError || !profile) {
      console.error('❌ User profile not found:', { ownerId: organization.owner_id, profileError });
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    console.log('✅ User profile found:', { email: profile.email, name: profile.name });

    // Create or get Stripe customer
    let customerId = organization.stripe_customer_id;

    // Check if existing customer ID is valid in Stripe
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
        console.log('✅ Existing Stripe customer found:', { customerId });
      } catch (error) {
        console.log('⚠️ Existing customer ID is invalid, creating new customer:', { 
          invalidCustomerId: customerId, 
          error: error instanceof Error ? error.message : String(error)
        });
        customerId = null; // Reset to create new customer
      }
    }

    if (!customerId) {
      console.log('🔄 Creating new Stripe customer...');
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.name || profile.email,
        metadata: {
          organization_id: organizationId,
          user_id: organization.owner_id,
        },
      });

      customerId = customer.id;
      console.log('✅ New Stripe customer created:', { customerId });

      // Update organization with new customer ID
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

    console.log('🔄 Creating Stripe checkout session...', { customerId, origin });
    
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

    console.log('✅ Checkout session created successfully:', { sessionId: session.id, url: session.url });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('💥 Checkout session creation error:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to create checkout session',
          details: error.message
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Check if Stripe is configured
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not configured - payment methods will return empty array');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil'
    })
  : null;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user has access to this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get organization's Stripe customer ID from subscriptions table first, then fallback to organizations
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();

    // Fallback to organizations table if no subscription found
    const { data: organization } = await supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('organization_id', organizationId)
      .single();

    const stripeCustomerId = subscription?.stripe_customer_id || organization?.stripe_customer_id;

    if (!stripeCustomerId) {
      // No Stripe customer yet - return empty array
      return NextResponse.json({
        paymentMethods: [],
        message: 'No payment methods found'
      });
    }

    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json({
        paymentMethods: [],
        message: 'Payment system not configured'
      });
    }

    try {
      // Get customer to find default payment method
      const customer = await stripe.customers.retrieve(stripeCustomerId);
      const defaultPaymentMethodId = (customer as any).invoice_settings?.default_payment_method;

      // Fetch payment methods from Stripe
      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: 'card'
      });

      return NextResponse.json({
        paymentMethods: paymentMethods.data.map(pm => ({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year
          } : null,
          created: pm.created,
          is_default: pm.id === defaultPaymentMethodId
        }))
      });
    } catch (stripeError) {
      console.error('❌ Stripe API error:', stripeError);
      return NextResponse.json({
        paymentMethods: [],
        message: 'Failed to fetch payment methods from Stripe'
      });
    }

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    
    // If it's a Stripe error, return appropriate message
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ 
        error: 'Failed to fetch payment methods from Stripe',
        paymentMethods: [] // Return empty array on error to prevent UI issues
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch payment methods',
      paymentMethods: [] // Return empty array on error to prevent UI issues
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Check if Stripe is configured
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not configured - billing history will return empty array');
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
    const limit = parseInt(searchParams.get('limit') || '10');
    
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

    // Get organization's Stripe subscription ID from subscriptions table
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();

    // Fallback to organizations table for customer ID if no subscription found
    const { data: organization } = await supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('organization_id', organizationId)
      .single();

    const stripeSubscriptionId = subscription?.stripe_subscription_id;
    const stripeCustomerId = subscription?.stripe_customer_id || organization?.stripe_customer_id;

    if (!stripeSubscriptionId && !stripeCustomerId) {
      // No Stripe subscription or customer yet - return empty array
      return NextResponse.json({
        invoices: [],
        message: 'No billing history found'
      });
    }

    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json({
        invoices: [],
        message: 'Billing system not configured'
      });
    }

    let invoices: Stripe.Invoice[] = [];

    if (stripeSubscriptionId) {
      // Fetch invoices for the specific subscription
      const subscriptionInvoices = await stripe.invoices.list({
        subscription: stripeSubscriptionId,
        limit: limit
      });
      invoices = subscriptionInvoices.data;
    } else if (stripeCustomerId) {
      // Fetch invoices for the customer (fallback)
      const customerInvoices = await stripe.invoices.list({
        customer: stripeCustomerId,
        limit: limit
      });
      invoices = customerInvoices.data;
    }

    // Format invoices for frontend
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      date: new Date(invoice.created * 1000).toISOString().split('T')[0],
      amount: invoice.total / 100, // Convert from cents to dollars
      status: invoice.status,
      description: invoice.description || `Invoice ${invoice.number}`,
      invoiceUrl: invoice.hosted_invoice_url,
      pdfUrl: invoice.invoice_pdf,
      subscriptionId: (invoice as any).subscription,
      lineItems: invoice.lines.data.map(line => ({
        description: line.description,
        quantity: line.quantity,
        unitAmount: (line as any).unit_amount ? (line as any).unit_amount / 100 : null // Convert from cents to dollars
      }))
    }));

    return NextResponse.json({
      invoices: formattedInvoices
    });

  } catch (error) {
    console.error('Error fetching billing history:', error);
    
    // If it's a Stripe error, return appropriate message
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ 
        error: 'Failed to fetch billing history from Stripe',
        invoices: [] // Return empty array on error to prevent UI issues
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch billing history',
      invoices: [] // Return empty array on error to prevent UI issues
    }, { status: 500 });
  }
} 
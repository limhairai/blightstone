import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { planId, organizationId, isDowngrade } = await request.json();

    if (!planId || !organizationId) {
      return NextResponse.json(
        { error: 'Plan ID and Organization ID are required' },
        { status: 400 }
      );
    }

    // Get the new plan details
    const { data: newPlan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('plan_id', planId)
      .single();

    if (planError || !newPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
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

    const stripeSubscriptionId = organization.stripe_subscription_id;
    
    if (!stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    // Get current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId) as any;
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found in Stripe' },
        { status: 404 }
      );
    }

    // For downgrades, schedule the change at the end of the billing cycle
    const updatedSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPlan.stripe_price_id,
      }],
      proration_behavior: 'none', // No immediate charge/credit
      billing_cycle_anchor: 'unchanged', // Keep current billing cycle
      metadata: {
        ...subscription.metadata,
        plan_id: planId,
        scheduled_change: 'downgrade',
        scheduled_change_date: new Date(subscription.current_period_end * 1000).toISOString(),
      },
    });

    // Update the database to reflect the scheduled change
    await supabase
      .from('subscriptions')
      .update({
        // Don't update plan_id yet - it will be updated when the change takes effect
        metadata: {
          scheduled_plan_change: planId,
          scheduled_change_type: 'downgrade',
          scheduled_change_date: new Date(subscription.current_period_end * 1000).toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', stripeSubscriptionId);

    return NextResponse.json({
      success: true,
      message: `Downgrade scheduled for ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`,
      effectiveDate: new Date(subscription.current_period_end * 1000).toISOString(),
      newPlan: newPlan.name,
    });

  } catch (error) {
    console.error('Schedule downgrade error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule downgrade' },
      { status: 500 }
    );
  }
} 
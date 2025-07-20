import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_SECRET_KEY_PREFIX: process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'missing',
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    // Check database plans
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('plan_id, name, stripe_price_id, is_active, monthly_subscription_fee_cents')
      .eq('is_active', true)
      .order('plan_id');

    // Check if Stripe can be initialized
    let stripeStatus = 'not_configured';
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const { default: Stripe } = await import('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2025-05-28.basil',
        });
        // Test Stripe connection
        await stripe.accounts.retrieve();
        stripeStatus = 'connected';
      }
    } catch (error) {
      stripeStatus = `error: ${error instanceof Error ? error.message : 'unknown'}`;
    }

    return NextResponse.json({
      status: 'debug_info',
      environment: {
        ...envCheck,
        stripe_status: stripeStatus,
      },
      database: {
        plans: plans || [],
        plans_error: plansError?.message || null,
        total_plans: plans?.length || 0,
        plans_with_stripe_id: plans?.filter(p => p.stripe_price_id).length || 0,
      },
      endpoints_available: [
        '/api/subscriptions/checkout',
        '/api/subscriptions/create-checkout', 
        '/api/payments/create-checkout-session'
      ],
      recommendations: []
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug check failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 
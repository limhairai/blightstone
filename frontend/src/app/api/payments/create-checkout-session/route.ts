import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

export async function POST(request: NextRequest) {
  try {
    // Diagnostic logging to confirm which Supabase project is being used
    

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const token = request.headers.get('Authorization')?.split('Bearer ')[1]

    
    if (!token) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)


    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 })
    }

    const { 
      amount, 
      wallet_credit, 
      success_url, 
      cancel_url 
    } = await request.json()



    // Fetch the user's current organization
    const { data: org, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()



    if (orgError || !org) {
      console.error('Error fetching organization for user:', user.id, orgError)
      return NextResponse.json({ error: 'Could not determine organization' }, { status: 500 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AdHub Wallet Credit',
              description: `Add $${wallet_credit.toFixed(2)} to your wallet`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url,
      cancel_url,
      customer_email: user.email,
      metadata: {
        organization_id: org.organization_id,
        user_id: user.id,
        wallet_credit: wallet_credit.toString(),
      },
      billing_address_collection: 'required',
    })

    return NextResponse.json({ 
      checkout_url: session.url
    })

  } catch (error) {
    console.error('Checkout session creation error:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe error:', error.message, error.type)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.error('General error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 
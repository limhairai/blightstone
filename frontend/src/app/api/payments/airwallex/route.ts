import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Airwallex API configuration
const AIRWALLEX_API_URL = process.env.AIRWALLEX_API_URL || 'https://api.airwallex.com'
const AIRWALLEX_CLIENT_ID = process.env.AIRWALLEX_CLIENT_ID!
const AIRWALLEX_API_KEY = process.env.AIRWALLEX_API_KEY!

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'USD', description } = await request.json()

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create payment intent with Airwallex
    const airwallexResponse = await fetch('https://api.airwallex.com/api/v1/pa/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRWALLEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency,
        merchant_order_id: `wallet_topup_${user.id}_${Date.now()}`,
        order: {
          type: 'physical_goods',
          products: [
            {
              name: description || 'Wallet Top-up',
              desc: 'Add funds to wallet balance',
              sku: 'wallet_topup',
              type: 'digital',
              unit_price: amount,
              quantity: 1,
            }
          ]
        },
        // Use Hosted Payment Page with redirect URLs
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/wallet/payment/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/wallet/payment/cancel`,
        descriptor: 'AdHub Wallet Topup',
        metadata: {
          user_id: user.id,
          purpose: 'wallet_topup'
        }
      }),
    })

    if (!airwallexResponse.ok) {
      const errorData = await airwallexResponse.text()
      console.error('Airwallex API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to create payment intent' },
        { status: 500 }
      )
    }

    const paymentIntent = await airwallexResponse.json()

    // Store payment intent in our database for tracking
    const { error: dbError } = await supabase
      .from('payment_intents')
      .insert({
        id: paymentIntent.id,
        user_id: user.id,
        amount: amount,
        currency: currency,
        status: 'pending',
        provider: 'airwallex',
        purpose: 'wallet_topup',
        metadata: {
          airwallex_payment_intent_id: paymentIntent.id,
          description: description || 'Wallet Top-up'
        }
      })

    if (dbError) {
      console.error('Database error:', dbError)
      // Continue anyway, as the payment intent was created successfully
    }

    // Return the hosted payment page URL
    return NextResponse.json({
      payment_intent_id: paymentIntent.id,
      // The hosted payment page URL that we'll redirect to
      hosted_payment_url: `https://checkout.airwallex.com/drop-in.html?intent_id=${paymentIntent.id}&client_secret=${paymentIntent.client_secret}`,
      client_secret: paymentIntent.client_secret,
      amount: amount,
      currency: currency
    })

  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle payment method configuration
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json({ error: 'Missing organization_id' }, { status: 400 })
    }

    // Return available payment methods for the region
    return NextResponse.json({
      payment_methods: {
        card: {
          enabled: true,
          currencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'HKD'],
          fees: '2.9% + $0.30'
        },
        bank_transfer: {
          enabled: true,
          currencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD'],
          fees: '0.6% - 2.5%',
          settlement_time: '1-3 business days'
        },
        airwallex_pay: {
          enabled: true,
          currencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'HKD'],
          fees: '0.5% + $0.10',
          settlement_time: 'Instant'
        },
        apple_pay: {
          enabled: true,
          currencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD'],
          fees: '2.9% + $0.30'
        },
        google_pay: {
          enabled: true,
          currencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD'],
          fees: '2.9% + $0.30'
        }
      }
    })

  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
} 
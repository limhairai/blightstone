import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First, get an access token using client credentials
    const authResponse = await fetch(`${AIRWALLEX_API_URL}/api/v1/authentication/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': AIRWALLEX_CLIENT_ID,
        'x-api-key': AIRWALLEX_API_KEY,
      },
    })

    if (!authResponse.ok) {
      const authError = await authResponse.text()
      console.error('Airwallex authentication error:', authError)
      return NextResponse.json(
        { error: 'Failed to authenticate with Airwallex' },
        { status: 500 }
      )
    }

    const authData = await authResponse.json()
    const accessToken = authData.token || authData.access_token

    // Create payment link with Airwallex using the JWT access token
    const airwallexResponse = await fetch(`${AIRWALLEX_API_URL}/api/v1/pa/payment_links/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency,
        title: `Wallet Top-up - $${amount}`,
        description: description || `Add $${amount} to wallet balance`,
        reference: `wallet_topup_${user.id}_${Date.now()}`,
        reusable: false,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        collectable_shopper_info: {
          billing_address: false,
          message: false,
          phone_number: false,
          reference: false,
          shipping_address: false
        },
        metadata: {
          user_id: user.id,
          purpose: 'wallet_topup',
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/wallet/payment/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/wallet/payment/cancel`
        }
      }),
    })

    if (!airwallexResponse.ok) {
      const errorData = await airwallexResponse.text()
      console.error('Airwallex API error:', errorData)
      console.error('Request URL:', `${AIRWALLEX_API_URL}/api/v1/pa/payment_links/create`)
      console.error('Request headers:', {
        'Authorization': `Bearer ${accessToken ? '[REDACTED]' : 'MISSING'}`,
        'Content-Type': 'application/json'
      })
      console.error('Environment variables:', {
        AIRWALLEX_API_URL: AIRWALLEX_API_URL,
        AIRWALLEX_CLIENT_ID: AIRWALLEX_CLIENT_ID ? '[REDACTED]' : 'MISSING',
        AIRWALLEX_API_KEY: AIRWALLEX_API_KEY ? '[REDACTED]' : 'MISSING'
      })
      return NextResponse.json(
        { error: 'Failed to create payment link' },
        { status: 500 }
      )
    }

    const paymentLink = await airwallexResponse.json()

    // Store payment link in our database for tracking
    const { error: dbError } = await supabase
      .from('payment_intents')
      .insert({
        id: paymentLink.id,
        user_id: user.id,
        amount: amount,
        currency: currency,
        status: 'pending',
        provider: 'airwallex',
        purpose: 'wallet_topup',
        metadata: {
          airwallex_payment_link_id: paymentLink.id,
          payment_link_url: paymentLink.url,
          description: description || 'Wallet Top-up'
        }
      })

    if (dbError) {
      console.error('Database error:', dbError)
      // Continue anyway, as the payment link was created successfully
    }

    // Return the hosted payment page URL
    return NextResponse.json({
      payment_link_id: paymentLink.id,
      // The hosted payment page URL that we'll redirect to
      hosted_payment_url: paymentLink.url,
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
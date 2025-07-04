import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { WalletService } from '@/lib/wallet-service'

export async function POST(request: NextRequest) {
  try {
    const { payment_intent_id, client_secret } = await request.json()

    if (!payment_intent_id) {
      return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 })
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
    const AIRWALLEX_API_URL = process.env.AIRWALLEX_API_URL || 'https://api.airwallex.com'
    const authResponse = await fetch(`${AIRWALLEX_API_URL}/api/v1/authentication/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': process.env.AIRWALLEX_CLIENT_ID,
        'x-api-key': process.env.AIRWALLEX_API_KEY,
      },
    })

    if (!authResponse.ok) {
      const authError = await authResponse.text()
      console.error('Airwallex authentication error:', authError)
      return NextResponse.json({ error: 'Failed to authenticate with Airwallex' }, { status: 500 })
    }

    const authData = await authResponse.json()
    const accessToken = authData.token || authData.access_token

    // Retrieve payment intent from Airwallex to verify status
    const airwallexResponse = await fetch(`${AIRWALLEX_API_URL}/api/v1/pa/payment_intents/${payment_intent_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!airwallexResponse.ok) {
      console.error('Failed to fetch payment intent from Airwallex')
      return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
    }

    const paymentIntent = await airwallexResponse.json()

    // Check if payment was successful
    if (paymentIntent.status !== 'SUCCEEDED') {
      return NextResponse.json({ 
        success: false, 
        error: `Payment status: ${paymentIntent.status}` 
      })
    }

    // Check if we already processed this payment
    const { data: existingPayment } = await supabase
      .from('payment_intents')
      .select('status')
      .eq('intent_id', payment_intent_id)
      .single()

    if (existingPayment?.status === 'completed') {
      return NextResponse.json({ 
        success: true, 
        message: 'Payment already processed' 
      })
    }

    // Get user's organization for wallet update
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!orgMember) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Update wallet balance using WalletService
    const walletService = new WalletService()
    await walletService.addFunds(
      orgMember.organization_id,
      paymentIntent.amount,
      paymentIntent.currency,
      'airwallex',
      payment_intent_id,
      'Wallet top-up via Airwallex'
    )

    // Update payment intent status in our database
    await supabase
      .from('payment_intents')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('intent_id', payment_intent_id)

    return NextResponse.json({ 
      success: true,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    })

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
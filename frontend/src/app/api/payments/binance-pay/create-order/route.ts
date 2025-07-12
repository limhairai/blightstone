import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash, createHmac } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Binance Pay API configuration
const BINANCE_PAY_API_URL = process.env.BINANCE_PAY_API_URL || 'https://bpay.binanceapi.com'
const BINANCE_PAY_API_KEY = process.env.BINANCE_PAY_API_KEY!
const BINANCE_PAY_SECRET_KEY = process.env.BINANCE_PAY_SECRET_KEY!

interface BinancePayOrderRequest {
  amount: number
  organizationId: string
  currency: string
}

export async function POST(request: NextRequest) {
  try {
    const { amount, organizationId, currency }: BinancePayOrderRequest = await request.json()

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    if (amount < 10 || amount > 10000) {
      return NextResponse.json({ error: 'Amount must be between $10 and $10,000' }, { status: 400 })
    }

    // Verify organization exists
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('organization_id, name')
      .eq('organization_id', organizationId)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Generate unique order ID
    const orderId = `adhub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create Binance Pay order
    const binancePayOrder = await createBinancePayOrder({
      orderId,
      amount,
      currency,
      organizationId,
      organizationName: org.name
    })

    // Store order in database
    const { error: dbError } = await supabase
      .from('binance_pay_orders')
      .insert({
        order_id: orderId,
        organization_id: organizationId,
        amount_usd: amount,
        currency,
        status: 'pending',
        binance_order_id: binancePayOrder.binanceOrderId,
        payment_url: binancePayOrder.paymentUrl,
        qr_code: binancePayOrder.qrCode,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Error storing Binance Pay order:', dbError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order: {
        orderId,
        paymentUrl: binancePayOrder.paymentUrl,
        qrCode: binancePayOrder.qrCode,
        status: 'pending',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        amount,
        currency
      }
    })

  } catch (error) {
    console.error('Error creating Binance Pay order:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create Binance Pay order' 
    }, { status: 500 })
  }
}

async function createBinancePayOrder(params: {
  orderId: string
  amount: number
  currency: string
  organizationId: string
  organizationName: string
}) {
  const { orderId, amount, currency, organizationId, organizationName } = params
  
  // Binance Pay API request payload
  const requestBody = {
    env: {
      terminalType: 'WEB'
    },
    merchantTradeNo: orderId,
    orderAmount: amount,
    currency: currency,
    goods: {
      goodsType: '02', // Virtual goods
      goodsCategory: 'Z000', // Others
      referenceGoodsId: 'wallet_topup',
      goodsName: `AdHub Wallet Top-up - ${organizationName}`,
      goodsDetail: `Add $${amount} to AdHub wallet for ${organizationName}`
    },
    shipping: {
      shippingName: organizationName,
      shippingAddress: {
        region: 'US',
        state: 'CA',
        city: 'San Francisco',
        address: '123 Main St'
      }
    },
    buyer: {
      referenceBuyerId: organizationId,
      buyerName: {
        firstName: organizationName.split(' ')[0] || 'AdHub',
        lastName: organizationName.split(' ').slice(1).join(' ') || 'User'
      }
    },
    returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/wallet?payment=success`,
    cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/wallet?payment=cancelled`
  }

  // Generate signature
  const timestamp = Date.now().toString()
  const nonce = Math.random().toString(36).substr(2, 32)
  const payload = JSON.stringify(requestBody)
  const signature = generateBinancePaySignature(timestamp, nonce, payload)

  // Make API request to Binance Pay
  const response = await fetch(`${BINANCE_PAY_API_URL}/binancepay/openapi/v2/order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'BinancePay-Timestamp': timestamp,
      'BinancePay-Nonce': nonce,
      'BinancePay-Certificate-SN': BINANCE_PAY_API_KEY,
      'BinancePay-Signature': signature
    },
    body: payload
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('Binance Pay API error:', errorData)
    throw new Error(`Binance Pay API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  if (data.status !== 'SUCCESS') {
    throw new Error(`Binance Pay order creation failed: ${data.errorMessage || 'Unknown error'}`)
  }

  return {
    binanceOrderId: data.data.prepayId,
    paymentUrl: data.data.universalUrl,
    qrCode: data.data.qrContent
  }
}

function generateBinancePaySignature(timestamp: string, nonce: string, body: string): string {
  const payload = timestamp + '\n' + nonce + '\n' + body + '\n'
  return createHmac('sha512', BINANCE_PAY_SECRET_KEY)
    .update(payload)
    .digest('hex')
    .toUpperCase()
} 
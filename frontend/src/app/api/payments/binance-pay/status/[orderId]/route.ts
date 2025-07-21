import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Binance Pay API configuration
const BINANCE_PAY_API_URL = process.env.BINANCE_PAY_API_URL || 'https://bpay.binanceapi.com'
const BINANCE_PAY_API_KEY = process.env.BINANCE_PAY_API_KEY!
const BINANCE_PAY_SECRET_KEY = process.env.BINANCE_PAY_SECRET_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Get order from database
    const { data: order, error: orderError } = await supabase
      .from('binance_pay_orders')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // If order is already completed or failed, return cached status
    if (order.status !== 'pending') {
      return NextResponse.json({
        orderId,
        status: order.status,
        amount: order.amount_usd,
        currency: order.currency
      })
    }

    // Check if order has expired
    const now = new Date()
    const expiresAt = new Date(order.expires_at)
    if (now > expiresAt) {
      // Update order status to expired
      await supabase
        .from('binance_pay_orders')
        .update({ status: 'expired' })
        .eq('order_id', orderId)

      return NextResponse.json({
        orderId,
        status: 'expired',
        amount: order.amount_usd,
        currency: order.currency
      })
    }

    // Query Binance Pay API for current status using our merchantTradeNo
    const binanceStatus = await checkBinancePayOrderStatus(order.order_id)
    
    // Update local database if status changed
    if (binanceStatus !== order.status) {
      await supabase
        .from('binance_pay_orders')
        .update({ 
          status: binanceStatus,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId)
    }

    return NextResponse.json({
      orderId,
      status: binanceStatus,
      amount: order.amount_usd,
      currency: order.currency
    })

  } catch (error) {
    console.error('Error checking Binance Pay order status:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to check order status' 
    }, { status: 500 })
  }
}

async function checkBinancePayOrderStatus(merchantTradeNo: string): Promise<string> {
  try {
    const requestBody = {
      merchantTradeNo: merchantTradeNo
    }

    // Generate signature
    const timestamp = Date.now().toString()
    const nonce = generateNonce(32)
    const payload = JSON.stringify(requestBody)
    const signature = generateBinancePaySignature(timestamp, nonce, payload)

    // Make API request to Binance Pay
    const response = await fetch(`${BINANCE_PAY_API_URL}/binancepay/openapi/v3/order/query`, {
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
      console.error('Binance Pay query API error:', response.status, response.statusText)
      return 'pending' // Default to pending if we can't check
    }

    const data = await response.json()
    
    if (data.status !== 'SUCCESS') {
      console.error('Binance Pay query failed:', data.errorMessage)
      return 'pending'
    }

    // Map Binance Pay status to our internal status
    const binanceStatus = data.data.status
    switch (binanceStatus) {
      case 'INITIAL':
      case 'PENDING':
        return 'pending'
      case 'PAID':
        return 'completed'
      case 'CANCELED':
      case 'ERROR':
        return 'failed'
      case 'EXPIRED':
        return 'expired'
      default:
        return 'pending'
    }

  } catch (error) {
    console.error('Error querying Binance Pay order:', error)
    return 'pending' // Default to pending if we can't check
  }
}

function generateNonce(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function generateBinancePaySignature(timestamp: string, nonce: string, body: string): string {
  const payload = timestamp + '\n' + nonce + '\n' + body + '\n'
  return createHmac('sha512', BINANCE_PAY_SECRET_KEY)
    .update(payload)
    .digest('hex')
    .toUpperCase()
} 
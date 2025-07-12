import { NextRequest, NextResponse } from 'next/server'
import { WalletService } from '../../../../lib/wallet-service'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Webhook secrets
const CRYPTO_WEBHOOK_SECRET = process.env.CRYPTO_WEBHOOK_SECRET!
const BINANCE_PAY_WEBHOOK_SECRET = process.env.BINANCE_PAY_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-crypto-signature') || request.headers.get('BinancePay-Signature')
    const timestamp = request.headers.get('BinancePay-Timestamp')
    const nonce = request.headers.get('BinancePay-Nonce')
    const certificateSN = request.headers.get('BinancePay-Certificate-SN')
    
    // Determine if this is a Binance Pay webhook
    const isBinancePayWebhook = !!(timestamp && nonce && certificateSN)
    
    if (isBinancePayWebhook) {
      // Handle Binance Pay webhook
      if (!verifyBinancePaySignature(body, signature, timestamp, nonce)) {
        console.error('Binance Pay webhook signature verification failed')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
      
      const payload = JSON.parse(body)
      await handleBinancePayWebhook(payload)
      
    } else {
      // Handle generic crypto webhook
      if (!verifyCryptoSignature(body, signature)) {
        console.error('Crypto webhook signature verification failed')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }

      const payload = JSON.parse(body)
      
      // Handle different crypto webhook events
      switch (payload.event_type) {
        case 'deposit.confirmed':
          await handleCryptoDepositConfirmed(payload.data)
          break
        
        case 'deposit.failed':
          await handleCryptoDepositFailed(payload.data)
          break
          
        default:
          console.log(`Unhandled crypto event type: ${payload.event_type}`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Crypto webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleBinancePayWebhook(payload: any) {
  try {
    console.log('Processing Binance Pay webhook:', payload)
    
    const { bizType, bizId, bizIdStr, bizStatus, data } = payload
    
    // Handle different Binance Pay events
    switch (bizType) {
      case 'PAY':
        await handleBinancePayment(data, bizStatus)
        break
      default:
        console.log(`Unhandled Binance Pay event type: ${bizType}`)
    }
    
  } catch (error) {
    console.error('Error handling Binance Pay webhook:', error)
  }
}

async function handleBinancePayment(paymentData: any, status: string) {
  try {
    const { merchantTradeNo, transactionId, totalFee, currency } = paymentData
    
    console.log('Processing Binance Pay payment:', {
      merchantTradeNo,
      transactionId,
      totalFee,
      currency,
      status
    })
    
    // Get order from database
    const { data: order, error: orderError } = await supabase
      .from('binance_pay_orders')
      .select('*')
      .eq('order_id', merchantTradeNo)
      .single()
    
    if (orderError || !order) {
      console.error('Binance Pay order not found:', merchantTradeNo)
      return
    }
    
    // Update order status
    const newStatus = status === 'PAY_SUCCESS' ? 'completed' : 'failed'
    await supabase
      .from('binance_pay_orders')
      .update({ 
        status: newStatus,
        binance_transaction_id: transactionId,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', merchantTradeNo)
    
    // Process wallet topup if payment was successful
    if (status === 'PAY_SUCCESS') {
      const result = await WalletService.processTopup({
        organizationId: order.organization_id,
        amount: order.amount_usd,
        paymentMethod: 'binance_pay',
        transactionId: transactionId,
        metadata: {
          binance_pay_order_id: merchantTradeNo,
          binance_transaction_id: transactionId,
          currency: currency,
          total_fee: totalFee
        },
        description: `Binance Pay - $${order.amount_usd.toFixed(2)}`
      })
      
      if (!result.success) {
        console.error('Failed to process Binance Pay topup:', result.error)
      } else {
        console.log('✅ Binance Pay payment processed successfully:', {
          organizationId: order.organization_id,
          amount: order.amount_usd,
          newBalance: result.newBalance,
          transactionId
        })
      }
    }
    
  } catch (error) {
    console.error('Error handling Binance Pay payment:', error)
  }
}

async function handleCryptoDepositConfirmed(depositData: any) {
  try {
    console.log('Processing crypto deposit confirmation:', depositData.deposit_id)
    
    // Extract data from your crypto API format
    const {
      deposit_id,
      organization_id, // This should be in the deposit metadata
      amount,
      currency,
      usd_value, // Converted USD value
      transaction_hash,
      confirmations
    } = depositData

    // Process the wallet topup using unified service
    const result = await WalletService.processTopup({
      organizationId: organization_id,
      amount: parseFloat(usd_value), // Use USD value for wallet credit
      paymentMethod: 'crypto',
      transactionId: deposit_id,
      metadata: {
        crypto_deposit_id: deposit_id,
        crypto_currency: currency,
        crypto_amount: amount,
        usd_value,
        transaction_hash,
        confirmations
      },
      description: `Crypto Deposit - ${amount} ${currency} ($${parseFloat(usd_value).toFixed(2)})`
    })

    if (!result.success) {
      console.error('Failed to process crypto deposit topup:', result.error)
    }
  } catch (error) {
    console.error('Error handling crypto deposit confirmation:', error)
  }
}

async function handleCryptoDepositFailed(depositData: any) {
  console.log('Crypto deposit failed:', depositData.deposit_id)
  // Handle failed deposits - maybe notify the user
  // Could create a failed transaction record or send notification
}

function verifyBinancePaySignature(body: string, signature: string | null, timestamp: string, nonce: string): boolean {
  if (!signature || !BINANCE_PAY_WEBHOOK_SECRET) {
    return false
  }
  
  try {
    const payload = timestamp + '\n' + nonce + '\n' + body + '\n'
    const expectedSignature = createHmac('sha512', BINANCE_PAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex')
      .toUpperCase()
    
    return signature === expectedSignature
  } catch (error) {
    console.error('Error verifying Binance Pay signature:', error)
    return false
  }
}

function verifyCryptoSignature(body: string, signature: string | null): boolean {
  if (!signature || !CRYPTO_WEBHOOK_SECRET) {
    return false
  }
  
  // Implement signature verification based on your crypto API
  // This is just a placeholder - each crypto API has different signature methods
  // Example for Binance webhook signature verification:
  // const crypto = require('crypto')
  // const expectedSignature = crypto
  //   .createHmac('sha256', CRYPTO_WEBHOOK_SECRET)
  //   .update(body)
  //   .digest('hex')
  // return signature === expectedSignature
  
  return true // For now, always return true - implement proper verification
} 
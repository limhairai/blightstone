import { NextRequest, NextResponse } from 'next/server'
import { WalletService } from '../../../../lib/wallet-service'

// This would be your crypto exchange API webhook secret (e.g., Binance)
const CRYPTO_WEBHOOK_SECRET = process.env.CRYPTO_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (implementation depends on your crypto API)
    const body = await request.text()
    const signature = request.headers.get('x-crypto-signature')
    
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

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Crypto webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
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
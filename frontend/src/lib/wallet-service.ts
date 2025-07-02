import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface WalletTopupRequest {
  organizationId: string
  amount: number // in dollars
  paymentMethod: 'stripe' | 'bank_transfer' | 'crypto'
  transactionId: string // external transaction ID
  metadata?: Record<string, any>
  description?: string
}

export interface WalletTopupResult {
  success: boolean
  walletId?: string
  transactionId?: string
  newBalance?: number
  error?: string
}

/**
 * Unified wallet topup service that handles all payment methods
 */
export class WalletService {
  /**
   * Process a wallet topup from any payment method
   */
  static async processTopup(request: WalletTopupRequest): Promise<WalletTopupResult> {
    try {
      console.log(`Processing ${request.paymentMethod} topup:`, {
        organizationId: request.organizationId,
        amount: request.amount,
        transactionId: request.transactionId
      })

      // Get or create wallet
      const wallet = await this.getOrCreateWallet(request.organizationId)
      if (!wallet.success) {
        return { success: false, error: wallet.error }
      }

      const amountCents = Math.round(request.amount * 100)
      const newBalanceCents = wallet.balanceCents + amountCents

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance_cents: newBalanceCents,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', request.organizationId)

      if (updateError) {
        console.error('Error updating wallet balance:', updateError)
        return { success: false, error: 'Failed to update wallet balance' }
      }

      // Create transaction record
      const description = request.description || `Wallet Top-up - $${request.amount.toFixed(2)}`
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          organization_id: request.organizationId,
          wallet_id: wallet.walletId,
          type: 'deposit',
          amount_cents: amountCents,
          status: 'completed',
          description,
          metadata: {
            payment_method: request.paymentMethod,
            external_transaction_id: request.transactionId,
            ...request.metadata
          }
        })
        .select('transaction_id')
        .single()

      if (transactionError) {
        console.error('Error creating transaction record:', transactionError)
        // Don't fail the topup if transaction record fails, but log it
      }

      console.log(`Successfully processed ${request.paymentMethod} topup: $${request.amount} for org ${request.organizationId}`)

      return {
        success: true,
        walletId: wallet.walletId,
        transactionId: transaction?.transaction_id,
        newBalance: newBalanceCents / 100
      }

    } catch (error) {
      console.error('Error processing wallet topup:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get existing wallet or create new one
   */
  private static async getOrCreateWallet(organizationId: string): Promise<{
    success: boolean
    walletId?: string
    balanceCents?: number
    error?: string
  }> {
    // Try to get existing wallet
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('wallet_id, balance_cents')
      .eq('organization_id', organizationId)
      .single()

    if (walletData) {
      return {
        success: true,
        walletId: walletData.wallet_id,
        balanceCents: walletData.balance_cents || 0
      }
    }

    // Create wallet if it doesn't exist
    console.log('Creating wallet for organization:', organizationId)
    const { data: newWallet, error: createError } = await supabase
      .from('wallets')
      .insert({
        organization_id: organizationId,
        balance_cents: 0
      })
      .select('wallet_id, balance_cents')
      .single()

    if (createError) {
      console.error('Failed to create wallet:', createError)
      return { success: false, error: 'Failed to create wallet' }
    }

    return {
      success: true,
      walletId: newWallet.wallet_id,
      balanceCents: newWallet.balance_cents || 0
    }
  }

  /**
   * Get wallet balance for an organization
   */
  static async getBalance(organizationId: string): Promise<{
    success: boolean
    balance?: number
    error?: string
  }> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance_cents, reserved_balance_cents')
        .eq('organization_id', organizationId)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      const totalBalance = (data.balance_cents || 0) / 100
      const availableBalance = ((data.balance_cents || 0) - (data.reserved_balance_cents || 0)) / 100

      return {
        success: true,
        balance: availableBalance
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
} 